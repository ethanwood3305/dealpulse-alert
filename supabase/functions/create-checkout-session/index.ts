
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.9.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Get environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
const clientUrl = Deno.env.get("CLIENT_URL") || "http://localhost:3000";

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16",
});

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Calculate price using the same logic as in the frontend
const calculatePrice = (urls: number, includeApiAccess: boolean, billingCycle = 'monthly'): number => {
  if (urls <= 1) return 0; // Free for 1 URL
  
  let basePrice;
  
  if (urls <= 5) {
    basePrice = 3 + (urls - 2) * 0.75; // $3 for 2 URLs, then +$0.75 per URL
  } else if (urls <= 25) {
    basePrice = 6 + (urls - 5) * 0.5; // After 5 URLs, slower increase per URL
  } else if (urls <= 50) {
    const basePriceAt25 = 6 + (25 - 5) * 0.5; // = $16
    basePrice = basePriceAt25 + (urls - 25) * 0.33; // Adjusted to $0.33 per URL after 25
  } else if (urls <= 100) {
    const basePriceAt50 = 16 + (50 - 25) * 0.33; // = $24.25
    basePrice = basePriceAt50 + (urls - 50) * 0.4; // After 50 URLs, $0.40 per URL
  } else if (urls <= 175) {
    const basePriceAt100 = 24.25 + (100 - 50) * 0.4; // = $44.25
    basePrice = basePriceAt100 + (urls - 100) * 0.35; // After 100 URLs, lower price
  } else {
    const basePriceAt175 = 44.25 + (175 - 100) * 0.35; // = $70.5
    basePrice = basePriceAt175 + (urls - 175) * 0.15; // After 175 URLs, lowest per-URL price
  }
  
  const needsApiAccessCharge = includeApiAccess && urls > 1 && urls <= 125;
  
  if (needsApiAccessCharge) {
    basePrice += 6; // $6/month for API access
  }
  
  if (urls === 250) {
    basePrice = Math.min(basePrice, 100);
  }
  
  if (billingCycle === 'yearly') {
    basePrice = basePrice * 12 * 0.9; // 10% discount for annual billing
  }
  
  return basePrice;
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract the JWT token
    const token = authHeader.replace("Bearer ", "");
    
    // Verify the JWT and get the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the request body
    const { plan, urlCount, includeApiAccess, billingCycle = 'monthly' } = await req.json();
    
    if (!plan) {
      return new Response(
        JSON.stringify({ error: "Plan is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    try {
      // Calculate the price based on our custom pricing tiers
      const numberOfUrls = urlCount || 1;
      const price = calculatePrice(numberOfUrls, includeApiAccess, billingCycle);
      const isFreePlan = numberOfUrls <= 1;
      
      // If it's a free plan, don't create a checkout session
      if (isFreePlan) {
        return new Response(
          JSON.stringify({ url: `${clientUrl}/dashboard?checkout=success` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get the customer ID from the database or create a new one
      const { data: subscriptionData } = await supabase
        .from("subscriptions")
        .select("stripe_customer_id")
        .eq("user_id", user.id)
        .single();

      let customerId = subscriptionData?.stripe_customer_id;

      // If the customer doesn't exist in Stripe, create one
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            supabase_id: user.id,
          },
        });
        customerId = customer.id;

        // Save the customer ID to the database
        await supabase
          .from("subscriptions")
          .update({ stripe_customer_id: customerId })
          .eq("user_id", user.id);
      }

      console.log(`Creating checkout for ${numberOfUrls} URLs with price ${price}`);

      // Create a product for this specific subscription
      const product = await stripe.products.create({
        name: `DealPulse Alert - ${numberOfUrls} URLs${includeApiAccess ? ' with API Access' : ''}`,
        description: `Monitoring for ${numberOfUrls} URLs${includeApiAccess ? ' with API Access' : ''}`,
      });

      // Create a price for this specific product with the calculated amount
      const stripePrice = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(price * 100), // Convert to cents
        currency: 'usd',
        recurring: {
          interval: billingCycle === 'yearly' ? 'year' : 'month',
        },
      });

      // Create the checkout session with the custom price
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [
          {
            price: stripePrice.id,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${clientUrl}/dashboard?checkout=success`,
        cancel_url: `${clientUrl}/pricing?checkout=cancelled`,
        metadata: {
          user_id: user.id,
          plan: plan,
          url_count: numberOfUrls.toString(),
          api_access: (includeApiAccess || numberOfUrls > 125) ? "yes" : "no",
          billing_cycle: billingCycle,
        },
      });

      // Return the checkout URL
      return new Response(
        JSON.stringify({ url: session.url }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (stripeError) {
      console.error("Stripe error:", stripeError);
      return new Response(
        JSON.stringify({ error: `Stripe error: ${stripeError.message}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Server error:", error);
    return new Response(
      JSON.stringify({ error: `Server error: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
