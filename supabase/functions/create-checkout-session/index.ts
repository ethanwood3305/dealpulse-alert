
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.9.0?target=deno";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16",
});

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(supabaseUrl, supabaseKey);

// Calculate the price for a subscription with the given parameters
const calculatePrice = (urls: number, includeApiAccess: boolean, billingCycle: 'monthly' | 'yearly'): number => {
  if (urls <= 1) return 0; // Free for 1 URL
  
  let basePrice;
  
  // Tiered pricing structure
  if (urls <= 5) {
    basePrice = 3 + (urls - 2) * 0.75; // $3 for 2 URLs, then +$0.75 per URL
  } else if (urls <= 25) {
    const basePriceAt5 = 3 + (5 - 2) * 0.75; // = $5.25
    basePrice = basePriceAt5 + (urls - 5) * 0.5; // After 5 URLs, +$0.50 per URL
  } else if (urls <= 50) {
    const basePriceAt5 = 3 + (5 - 2) * 0.75; // = $5.25
    const basePriceAt25 = basePriceAt5 + (25 - 5) * 0.5; // = $15.25
    basePrice = basePriceAt25 + (urls - 25) * 0.33; // After 25 URLs, +$0.33 per URL
  } else if (urls <= 100) {
    const basePriceAt5 = 3 + (5 - 2) * 0.75; // = $5.25
    const basePriceAt25 = basePriceAt5 + (25 - 5) * 0.5; // = $15.25
    const basePriceAt50 = basePriceAt25 + (50 - 25) * 0.33; // = $23.5
    basePrice = basePriceAt50 + (urls - 50) * 0.25; // After 50 URLs, +$0.25 per URL
  } else if (urls <= 175) {
    const basePriceAt5 = 3 + (5 - 2) * 0.75; // = $5.25
    const basePriceAt25 = basePriceAt5 + (25 - 5) * 0.5; // = $15.25
    const basePriceAt50 = basePriceAt25 + (50 - 25) * 0.33; // = $23.5
    const basePriceAt100 = basePriceAt50 + (100 - 50) * 0.25; // = $36
    basePrice = basePriceAt100 + (urls - 100) * 0.22; // After 100 URLs, +$0.22 per URL
  } else {
    const basePriceAt5 = 3 + (5 - 2) * 0.75; // = $5.25
    const basePriceAt25 = basePriceAt5 + (25 - 5) * 0.5; // = $15.25
    const basePriceAt50 = basePriceAt25 + (50 - 25) * 0.33; // = $23.5
    const basePriceAt100 = basePriceAt50 + (100 - 50) * 0.25; // = $36
    const basePriceAt175 = basePriceAt100 + (175 - 100) * 0.22; // = $52.5
    basePrice = basePriceAt175 + (urls - 175) * 0.15; // After 175 URLs, lowest per-URL price
  }
  
  // Special case for 250 URLs - cap at $74.25
  if (urls >= 250) {
    basePrice = Math.min(basePrice, 74.25);
  }
  
  // Add API access charge if needed
  const needsApiAccessCharge = includeApiAccess && urls > 1 && urls <= 125;
  
  if (needsApiAccessCharge) {
    basePrice += 6; // $6/month for API access
  }
  
  // Apply yearly discount if applicable
  if (billingCycle === 'yearly') {
    basePrice = basePrice * 12 * 0.9; // 10% discount for annual billing, calculated on the full year
  }
  
  return parseFloat(basePrice.toFixed(2));
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
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
    
    // Get the client URL and ensure it doesn't end with a slash
    let client_url = Deno.env.get('CLIENT_URL') || 'http://localhost:5173';
    // Remove trailing slash if it exists
    client_url = client_url.replace(/\/$/, '');
    
    // Get the Stripe prices based on billing cycle
    const stripePriceIdPerUrl = Deno.env.get(
      billingCycle === 'yearly' 
        ? 'STRIPE_PRICE_ID_PER_URL_YEARLY' 
        : 'STRIPE_PRICE_ID_PER_URL'
    );
    
    const stripePriceIdApiAccess = Deno.env.get(
      billingCycle === 'yearly'
        ? 'STRIPE_PRICE_ID_API_ACCESS_YEARLY'
        : 'STRIPE_PRICE_ID_API_ACCESS'
    );
    
    if (!stripePriceIdPerUrl) {
      throw new Error('Stripe price ID not found for per-URL pricing');
    }
    
    // Check for existing customer ID
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();
    
    if (subscriptionError && subscriptionError.code !== 'PGRST116') {
      console.error(`Error fetching subscription:`, subscriptionError);
      throw new Error(`Error fetching subscription: ${subscriptionError.message}`);
    }
    
    // Create line items array
    const line_items = [
      {
        price: stripePriceIdPerUrl,
        quantity: urlCount,
      },
    ];
    
    // Add API access item if requested and needed
    if (includeApiAccess && urlCount <= 125 && stripePriceIdApiAccess) {
      line_items.push({
        price: stripePriceIdApiAccess,
        quantity: 1,
      });
    }
    
    const params: Stripe.Checkout.SessionCreateParams = {
      customer: subscriptionData?.stripe_customer_id,
      client_reference_id: userId,
      payment_method_types: ['card'],
      line_items,
      mode: 'subscription',
      success_url: `${client_url}/dashboard?checkout=success`,
      cancel_url: `${client_url}/pricing?checkout=cancelled`,
      subscription_data: {
        metadata: {
          user_id: userId,
          calculated_price: calculatedPrice.toString(),
        },
      },
      metadata: {
        user_id: userId,
        plan,
        url_count: urlCount.toString(),
        api_access: includeApiAccess ? 'yes' : 'no',
        billing_cycle: billingCycle,
        calculated_price: calculatedPrice.toString(),
      },
    };
    
    // Create new Stripe customer if needed
    if (!subscriptionData?.stripe_customer_id) {
      // Get user email from auth.users
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
      
      if (userError || !userData.user) {
        console.error(`Error fetching user:`, userError || 'User not found');
        throw new Error(`Error fetching user: ${userError?.message || 'User not found'}`);
      }
      
      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: userData.user.email,
        metadata: {
          user_id: userId,
        },
      });
      
      // Update subscription with Stripe customer ID
      await supabase
        .from('subscriptions')
        .update({ stripe_customer_id: customer.id })
        .eq('user_id', userId);
      
      params.customer = customer.id;
    }
    
    console.log("Creating Stripe checkout session with parameters:", {
      customerId: params.customer,
      userId: userId,
      lineItems: line_items.length,
      calculatedPrice
    });
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create(params);
    
    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
