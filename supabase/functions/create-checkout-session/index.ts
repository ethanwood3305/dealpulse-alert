
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
const stripePriceId = Deno.env.get("STRIPE_PRICE_ID_PER_URL") || ""; // Price per URL
const clientUrl = Deno.env.get("CLIENT_URL") || "http://localhost:3000";

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16",
});

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    const { plan, urlCount } = await req.json();
    
    if (!plan) {
      return new Response(
        JSON.stringify({ error: "Plan is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    try {
      // Calculate the number of URL units to charge for
      const numberOfUrls = urlCount || 1;
      
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

      // Create the checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [
          {
            price: stripePriceId,
            quantity: numberOfUrls > 1 ? numberOfUrls : 1, // If free plan (1 URL), still charge for 1 but will be $0
          },
        ],
        mode: "subscription",
        success_url: `${clientUrl}/dashboard?checkout=success`,
        cancel_url: `${clientUrl}/pricing?checkout=cancelled`,
        metadata: {
          user_id: user.id,
          plan: plan,
          url_count: numberOfUrls.toString(),
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
