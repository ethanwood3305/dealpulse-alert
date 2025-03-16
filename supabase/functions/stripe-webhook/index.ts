
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

console.log("Stripe webhook function initialized with URL:", supabaseUrl);

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16",
});

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  console.log("Received webhook request:", req.method);
  
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request");
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Get the signature from the headers
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      console.error("Webhook Error: No signature");
      return new Response(
        JSON.stringify({ error: "Webhook Error: No signature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the raw body
    const body = await req.text();
    console.log("Received webhook body length:", body.length);
    console.log("Webhook body preview:", body.substring(0, 500) + "...");
    
    // Verify the webhook signature
    let event;
    try {
      console.log("Verifying webhook signature with secret length:", stripeWebhookSecret?.length || 0);
      event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret);
      console.log("Signature verified successfully");
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(
        JSON.stringify({ error: `Webhook Error: ${err.message}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing webhook event: ${event.type}`);
    console.log(`Event data: ${JSON.stringify(event.data.object).substring(0, 500)}...`);

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        console.log("Full checkout session data:", JSON.stringify(session));
        
        const userId = session.metadata?.user_id || session.client_reference_id;
        const plan = session.metadata?.plan;
        const urlCount = parseInt(session.metadata?.url_count) || 1;
        const hasApiAccess = session.metadata?.api_access === "yes";
        
        console.log(`Checkout completed for user ${userId}: Plan=${plan}, URLs=${urlCount}, API=${hasApiAccess}, Subscription=${session.subscription}`);
        
        if (!userId) {
          console.error("No user ID found in session metadata or client_reference_id");
          break;
        }
        
        // Immediate update with session metadata
        console.log(`Updating subscription for user ${userId} with URLs limit: ${urlCount}`);
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
          console.log(`Successfully updated subscription for user ${userId} with URLs limit: ${urlCount}`);
        }
        
        // Fetch and force reload metadata from subscription too
        if (session.subscription) {
          try {
            console.log(`Retrieving subscription details for ${session.subscription}`);
            const subscription = await stripe.subscriptions.retrieve(session.subscription);
            console.log("Retrieved subscription:", JSON.stringify(subscription).substring(0, 500) + "...");
            
            // Update the URLs limit and API access based on the metadata from the subscription
            const subUrlCount = parseInt(subscription.metadata?.url_count) || urlCount;
            const subHasApiAccess = subscription.metadata?.api_access === "yes" || hasApiAccess;
            
            console.log(`Double-checking subscription with metadata: URL count=${subUrlCount}, API access=${subHasApiAccess}`);
            
            // Update the user's subscription in the database with the actual metadata from Stripe
            const { error: updateError } = await supabase
              .from("subscriptions")
              .update({
                urls_limit: subUrlCount,
                has_api_access: subHasApiAccess,
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", userId);
            
            if (updateError) {
              console.error(`Error updating subscription metadata for user ${userId}:`, updateError);
            } else {
              console.log(`Successfully updated subscription metadata for user ${userId} with URL count: ${subUrlCount}`);
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
        if (!customerId) {
          console.error("No customer ID found in subscription object");
          break;
        }
        
        console.log(`Subscription updated for customer: ${customerId}`);
        
        // Look up the user by customer ID
        const { data: userData, error: userError } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();
        
        if (userError || !userData) {
          console.error(`User not found for customer ${customerId}`, userError);
          break;
        }
        
        console.log(`Found user ${userData.user_id} for customer ${customerId}`);
        
        // Get subscription metadata directly
        const urlCount = parseInt(subscription.metadata?.url_count) || 1;
        const hasApiAccess = subscription.metadata?.api_access === "yes";
        
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
        
        break;
      }
      
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        
        // Get the customer ID
        const customerId = subscription.customer;
        if (!customerId) {
          console.error("No customer ID found in subscription object");
          break;
        }
        
        console.log(`Subscription deleted for customer: ${customerId}`);
        
        // Look up the user by customer ID
        const { data: userData, error: userError } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();
        
        if (userError || !userData) {
          console.error(`User not found for customer ${customerId}`, userError);
          break;
        }
        
        console.log(`Found user ${userData.user_id} for customer ${customerId}, downgrading to free plan`);
        
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
