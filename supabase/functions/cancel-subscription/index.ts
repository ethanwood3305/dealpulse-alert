
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.9.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || "";

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
    console.log("Received request to cancel subscription");
    
    // Get JWT token from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify auth token and get user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Invalid auth token:", authError);
      return new Response(
        JSON.stringify({ error: "Invalid auth token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Authenticated user: ${user.id}`);

    // Get request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error("Failed to parse request body:", e);
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { subscription_id } = body;

    if (!subscription_id) {
      console.error("No subscription_id provided in request");
      return new Response(
        JSON.stringify({ error: "Subscription ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Processing cancellation for subscription: ${subscription_id}`);

    // Verify that the subscription belongs to the authenticated user
    const { data: subscription, error: subscriptionError } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id")
      .eq("user_id", user.id)
      .eq("stripe_subscription_id", subscription_id)
      .single();

    if (subscriptionError || !subscription) {
      console.error("Subscription verification failed:", subscriptionError);
      return new Response(
        JSON.stringify({ error: "Subscription not found or doesn't belong to user" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("Subscription verified as belonging to user");

    // Cancel the subscription at the end of the current period
    try {
      console.log(`Sending cancel request to Stripe for subscription: ${subscription_id}`);
      const updatedSubscription = await stripe.subscriptions.update(subscription_id, {
        cancel_at_period_end: true,
      });
      
      console.log("Stripe cancellation successful, subscription will end at period end");
      
      // Add a timestamp to the subscription record to indicate when it was canceled
      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({ 
          updated_at: new Date().toISOString(),
          cancel_requested_at: new Date().toISOString()
        })
        .eq("user_id", user.id)
        .eq("stripe_subscription_id", subscription_id);
        
      if (updateError) {
        console.error("Failed to update subscription record:", updateError);
        // Continue anyway since the Stripe cancellation worked
      }
      
      // Return information about when the subscription will end
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Subscription will be canceled at the end of the billing period",
          cancel_at: updatedSubscription.cancel_at,
          current_period_end: updatedSubscription.current_period_end
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (stripeError) {
      console.error("Stripe cancellation error:", stripeError);
      return new Response(
        JSON.stringify({ 
          error: "Failed to cancel subscription with Stripe", 
          details: stripeError.message 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error canceling subscription:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to cancel subscription" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
