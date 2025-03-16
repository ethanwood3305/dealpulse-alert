
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
const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
const stripeApiAccessPriceId = Deno.env.get("STRIPE_PRICE_ID_API_ACCESS") || "";

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
    // Get the signature from the headers
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response(
        JSON.stringify({ error: "Webhook Error: No signature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the raw body
    const body = await req.text();
    
    // Verify the webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(
        JSON.stringify({ error: `Webhook Error: ${err.message}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing webhook event: ${event.type}`);

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata.user_id;
        const plan = session.metadata.plan;
        const urlCount = parseInt(session.metadata.url_count) || 1;
        const hasApiAccess = session.metadata.api_access === "yes";
        
        console.log(`Checkout completed for user ${userId}: Plan=${plan}, URLs=${urlCount}, API=${hasApiAccess}`);
        
        // Update the user's subscription in the database
        const { data, error } = await supabase
          .from("subscriptions")
          .update({
            plan: plan,
            urls_limit: urlCount,
            has_api_access: hasApiAccess,
            stripe_subscription_id: session.subscription,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);
        
        if (error) {
          console.error(`Error updating subscription for user ${userId}:`, error);
        } else {
          console.log(`Successfully updated subscription for user ${userId}`);
        }
        
        console.log(`User ${userId} subscribed to ${plan} plan with ${urlCount} URLs, API access: ${hasApiAccess}`);
        
        // Force reload metadata from subscription
        if (session.subscription) {
          try {
            const subscription = await stripe.subscriptions.retrieve(session.subscription);
            
            // Update the URLs limit and API access based on the metadata from the subscription
            const urlCount = parseInt(subscription.metadata.url_count) || 1;
            const hasApiAccess = subscription.metadata.api_access === "yes";
            
            // Update the user's subscription in the database with the actual metadata from Stripe
            const { error: updateError } = await supabase
              .from("subscriptions")
              .update({
                urls_limit: urlCount,
                has_api_access: hasApiAccess,
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", userId);
            
            if (updateError) {
              console.error(`Error updating subscription metadata for user ${userId}:`, updateError);
            } else {
              console.log(`Successfully updated subscription metadata for user ${userId} with URL count: ${urlCount}`);
            }
          } catch (err) {
            console.error(`Error retrieving subscription details: ${err.message}`);
          }
        }
        
        break;
      }
      
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        
        // Get the customer ID
        const customerId = subscription.customer;
        
        // Look up the user by customer ID
        const { data: userData, error: userError } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();
        
        if (userError || !userData) {
          console.error(`User not found for customer ${customerId}`);
          break;
        }
        
        // Get subscription metadata directly
        const urlCount = parseInt(subscription.metadata.url_count) || 1;
        const hasApiAccess = subscription.metadata.api_access === "yes";
        
        console.log(`Subscription updated: Customer=${customerId}, URLs=${urlCount}, API=${hasApiAccess}`);
        
        // Update the user's subscription in the database
        const { data, error } = await supabase
          .from("subscriptions")
          .update({
            urls_limit: urlCount,
            has_api_access: hasApiAccess,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userData.user_id);
        
        if (error) {
          console.error(`Error updating subscription for user ${userData.user_id}:`, error);
        } else {
          console.log(`Successfully updated subscription for user ${userData.user_id}`);
        }
        
        console.log(`User ${userData.user_id}'s subscription updated to ${urlCount} URLs, API access: ${hasApiAccess}`);
        break;
      }
      
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        
        // Get the customer ID
        const customerId = subscription.customer;
        
        // Look up the user by customer ID
        const { data: userData, error: userError } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();
        
        if (userError || !userData) {
          console.error(`User not found for customer ${customerId}`);
          break;
        }
        
        // Downgrade to free plan
        const { data, error } = await supabase
          .from("subscriptions")
          .update({
            plan: "free",
            urls_limit: 1,
            has_api_access: false,
            stripe_subscription_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userData.user_id);
        
        if (error) {
          console.error(`Error downgrading subscription for user ${userData.user_id}:`, error);
        } else {
          console.log(`Successfully downgraded subscription for user ${userData.user_id}`);
        }
        
        console.log(`User ${userData.user_id}'s subscription cancelled, downgraded to free plan`);
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: `Webhook error: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
