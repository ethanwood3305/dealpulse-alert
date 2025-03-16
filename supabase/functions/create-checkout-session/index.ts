
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { calculatePrice } from "./utils/pricing.ts";
import { 
  createSubscriptionProduct, 
  createSubscriptionPrice, 
  createCustomer, 
  createCheckoutSession 
} from "./utils/stripe-service.ts";
import { 
  getUserSubscription, 
  getUserData, 
  updateSubscriptionWithCustomerId 
} from "./utils/supabase-service.ts";
import { 
  corsHeaders, 
  getClientUrl, 
  createErrorResponse, 
  createSuccessResponse, 
  createOptionsResponse 
} from "./utils/http-utils.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return createOptionsResponse();
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const { plan, userId, urlCount, includeApiAccess, billingCycle } = await req.json();
    
    // Validate userId
    if (!userId || typeof userId !== 'string') {
      console.error("Invalid userId provided:", userId);
      return new Response(
        JSON.stringify({ error: "Invalid user ID provided" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    
    console.log("Processing checkout for user:", userId);
    
    // Calculate the actual price for this subscription
    const calculatedPrice = calculatePrice(urlCount, includeApiAccess, billingCycle);
    console.log(`Calculated price: $${calculatedPrice} for ${urlCount} URLs, API access: ${includeApiAccess}, billing: ${billingCycle}`);
    
    // Get client URL
    const client_url = getClientUrl();
    
    // Check for existing customer ID
    const { data: subscriptionData, error: subscriptionError } = await getUserSubscription(userId);
    
    if (subscriptionError && subscriptionError.code !== 'PGRST116') {
      console.error(`Error fetching subscription:`, subscriptionError);
      throw new Error(`Error fetching subscription: ${subscriptionError.message}`);
    }
    
    // Create a new product for this specific subscription
    const product = await createSubscriptionProduct(plan, urlCount, includeApiAccess);
    
    // Create a custom price for this product
    const price = await createSubscriptionPrice(
      product, 
      calculatedPrice, 
      billingCycle, 
      plan, 
      urlCount, 
      includeApiAccess
    );
    
    const params = {
      customer: subscriptionData?.stripe_customer_id,
      client_reference_id: userId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: price.id,
          quantity: 1, // We use quantity of 1 since the price already includes everything
        },
      ],
      mode: 'subscription',
      success_url: `${client_url}/dashboard?checkout=success`,
      cancel_url: `${client_url}/pricing?checkout=cancelled`,
      subscription_data: {
        metadata: {
          user_id: userId,
          calculated_price: calculatedPrice.toString(),
          plan: plan,
          url_count: urlCount.toString(),
          api_access: includeApiAccess ? 'yes' : 'no',
          billing_cycle: billingCycle,
        },
      },
      metadata: {
        user_id: userId,
        plan: plan,
        url_count: urlCount.toString(),
        api_access: includeApiAccess ? 'yes' : 'no',
        billing_cycle: billingCycle,
        calculated_price: calculatedPrice.toString(),
      },
    };
    
    // Create new Stripe customer if needed
    if (!subscriptionData?.stripe_customer_id) {
      // Get user email from auth.users
      const { data: userData, error: userError } = await getUserData(userId);
      
      if (userError || !userData.user) {
        console.error(`Error fetching user:`, userError || 'User not found');
        throw new Error(`Error fetching user: ${userError?.message || 'User not found'}`);
      }
      
      // Create Stripe customer
      const customer = await createCustomer(userData.user.email, userId);
      
      // Update subscription with Stripe customer ID
      await updateSubscriptionWithCustomerId(userId, customer.id);
      
      params.customer = customer.id;
    }
    
    console.log("Creating Stripe checkout session with parameters:", {
      customerId: params.customer,
      userId: userId,
      product: product.name,
      price: calculatedPrice,
      billingCycle: billingCycle
    });
    
    // Create checkout session
    const session = await createCheckoutSession(params);
    
    return createSuccessResponse({ url: session.url });
  } catch (error) {
    return createErrorResponse(error);
  }
});
