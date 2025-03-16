
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
  console.log("Received checkout request:", req.method);
  
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
    const { plan, userId, urlCount, includeApiAccess, billingCycle, currentSubscriptionId } = await req.json();
    
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
    console.log("Plan details:", { plan, urlCount, includeApiAccess, billingCycle, currentSubscriptionId });
    
    // Calculate the actual price for this subscription
    const calculatedPrice = calculatePrice(urlCount, includeApiAccess, billingCycle);
    console.log(`Calculated price: $${calculatedPrice} for ${urlCount} URLs, API access: ${includeApiAccess}, billing: ${billingCycle}`);
    
    // Get client URL
    const client_url = getClientUrl();
    console.log("Client URL:", client_url);
    
    // Normalize client URL to ensure no double slashes
    const normalizedClientUrl = client_url.endsWith('/') ? client_url.slice(0, -1) : client_url;
    console.log("Normalized client URL:", normalizedClientUrl);
    
    // Check for existing customer ID
    const { data: subscriptionData, error: subscriptionError } = await getUserSubscription(userId);
    
    if (subscriptionError && subscriptionError.code !== 'PGRST116') {
      console.error(`Error fetching subscription:`, subscriptionError);
      throw new Error(`Error fetching subscription: ${subscriptionError.message}`);
    }
    
    console.log("Existing subscription data:", subscriptionData);
    
    // Create a new product for this specific subscription
    const product = await createSubscriptionProduct(plan, urlCount, includeApiAccess);
    console.log("Created product:", product.id);
    
    // Create a custom price for this product
    const price = await createSubscriptionPrice(
      product, 
      calculatedPrice, 
      billingCycle, 
      plan, 
      urlCount, 
      includeApiAccess
    );
    console.log("Created price:", price.id);
    
    // Prepare metadata - this is critical for the webhook to process correctly
    const metadata = {
      user_id: userId,
      plan: plan,
      url_count: urlCount.toString(),
      api_access: includeApiAccess ? 'yes' : 'no',
      billing_cycle: billingCycle,
      calculated_price: calculatedPrice.toString(),
      checkout_time: new Date().toISOString(),
    };
    
    console.log("Setting checkout metadata:", metadata);
    
    const timestamp = Date.now();
    const successUrl = `${normalizedClientUrl}/dashboard?checkout=success&t=${timestamp}&plan=${plan}&urls=${urlCount}`;
    console.log("Success URL:", successUrl);
    
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
      success_url: successUrl,
      cancel_url: `${normalizedClientUrl}/pricing?checkout=cancelled`,
      subscription_data: {
        metadata: metadata,
      },
      metadata: metadata,
    };
    
    console.log("Checkout session params prepared");
    
    // Create new Stripe customer if needed
    if (!subscriptionData?.stripe_customer_id) {
      // Get user email from auth.users
      const { data: userData, error: userError } = await getUserData(userId);
      
      if (userError || !userData.user) {
        console.error(`Error fetching user:`, userError || 'User not found');
        throw new Error(`Error fetching user: ${userError?.message || 'User not found'}`);
      }
      
      console.log("Creating Stripe customer for email:", userData.user.email);
      
      // Create Stripe customer
      const customer = await createCustomer(userData.user.email, userId);
      console.log("Created Stripe customer:", customer.id);
      
      // Update subscription with Stripe customer ID
      await updateSubscriptionWithCustomerId(userId, customer.id);
      console.log("Updated subscription with customer ID");
      
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
    console.log("Created checkout session:", session.id);
    console.log("Checkout URL:", session.url);
    
    return createSuccessResponse({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return createErrorResponse(error);
  }
});
