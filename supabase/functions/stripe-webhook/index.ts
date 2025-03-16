
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.9.0?target=deno";

// Initialize Stripe
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(), // Use fetch-based HTTP client
});

// Initialize Supabase client
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Set up CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log("Received webhook request");
  
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    // Get the webhook signature from headers
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
    
    if (!signature || !webhookSecret) {
      console.error("Missing signature or webhook secret");
      return new Response(JSON.stringify({ error: "Missing signature or webhook secret" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get raw request body
    const body = await req.text();
    console.log("Webhook payload received");
    
    // Verify webhook signature
    let event;
    try {
      // Construct event without using Node.js stream
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log(`Webhook event type: ${event.type}`);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(JSON.stringify({ error: `Webhook Error: ${err.message}` }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Handle the event
    let result = false;
    
    switch (event.type) {
      case 'checkout.session.completed':
        result = await handleCheckoutSessionCompleted(event.data.object);
        break;
      case 'customer.subscription.updated':
        result = await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        result = await handleSubscriptionDeleted(event.data.object);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    
    console.log(`Event ${event.type} processed successfully: ${result}`);

    return new Response(JSON.stringify({ received: true, success: result }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error(`Error processing webhook: ${error.message}`);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

// Handler for checkout.session.completed events
async function handleCheckoutSessionCompleted(session) {
  console.log("Processing checkout.session.completed event");
  console.log(`Session ID: ${session.id}`);
  console.log(`User ID: ${session.client_reference_id}`);
  
  if (!session.client_reference_id) {
    console.error("No client_reference_id in session");
    return false;
  }

  try {
    // Get the subscription details from the metadata
    const userId = session.client_reference_id;
    const urlCount = parseInt(session.metadata?.url_count || "1", 10);
    const hasApiAccess = session.metadata?.api_access === 'yes';
    const planId = session.metadata?.plan || 'free';
    
    console.log(`Updating subscription for user ${userId}: URLs=${urlCount}, API access=${hasApiAccess}, Plan=${planId}`);
    
    // Check if subscription exists
    const { data: existingSubscription, error: checkError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (checkError && checkError.code !== 'PGRST116') {
      console.error(`Error checking subscription: ${checkError.message}`);
      return false;
    }
    
    // Update the subscription in the database
    const { data: updateData, error: updateError } = await supabase
      .from('subscriptions')
      .update({
        plan: planId,
        urls_limit: urlCount,
        has_api_access: hasApiAccess,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
    
    if (updateError) {
      console.error(`Error updating subscription for user ${userId}: ${updateError.message}`);
      return false;
    }
    
    console.log(`Subscription updated successfully for user ${userId}`);
    
    // Verify the update
    const { data: verifyData, error: verifyError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (verifyError) {
      console.error(`Error verifying subscription update: ${verifyError.message}`);
      return false;
    }
    
    console.log(`Verified subscription data:`, verifyData);
    return true;
  } catch (error) {
    console.error(`Error in handleCheckoutSessionCompleted: ${error.message}`);
    return false;
  }
}

// Handler for customer.subscription.updated events
async function handleSubscriptionUpdated(subscription) {
  console.log("Processing customer.subscription.updated event");
  console.log(`Subscription ID: ${subscription.id}`);
  
  try {
    // Get the user ID from metadata
    const userId = subscription.metadata?.user_id;
    if (!userId) {
      console.error("No user_id in subscription metadata");
      return false;
    }
    
    // Get the subscription item details
    const subscriptionItem = subscription.items.data[0];
    if (!subscriptionItem) {
      console.error("No subscription item found");
      return false;
    }
    
    // Get the price metadata
    let urlCount = 1;
    let hasApiAccess = false;
    let planId = 'free';
    
    try {
      const price = await stripe.prices.retrieve(subscriptionItem.price.id);
      urlCount = parseInt(price.metadata?.url_count || "1", 10);
      hasApiAccess = price.metadata?.api_access === 'yes';
      planId = price.metadata?.plan || 'free';
    } catch (priceError) {
      console.error(`Error retrieving price: ${priceError.message}`);
      // Continue with default values
    }
    
    console.log(`Updating subscription for user ${userId}: URLs=${urlCount}, API access=${hasApiAccess}, Plan=${planId}`);
    
    // Update the subscription in the database
    const { data, error: updateError } = await supabase
      .from('subscriptions')
      .update({
        plan: planId,
        urls_limit: urlCount,
        has_api_access: hasApiAccess,
        stripe_subscription_id: subscription.id,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
    
    if (updateError) {
      console.error(`Error updating subscription for user ${userId}: ${updateError.message}`);
      return false;
    }
    
    console.log(`Subscription updated successfully for user ${userId}`);
    return true;
  } catch (error) {
    console.error(`Error in handleSubscriptionUpdated: ${error.message}`);
    return false;
  }
}

// Handler for customer.subscription.deleted events
async function handleSubscriptionDeleted(subscription) {
  console.log("Processing customer.subscription.deleted event");
  console.log(`Subscription ID: ${subscription.id}`);
  
  try {
    // Find the user with this subscription ID
    const { data: subscriptionData, error: findError } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscription.id)
      .single();
    
    if (findError) {
      console.error(`Error finding subscription: ${findError.message}`);
      return false;
    }
    
    if (!subscriptionData) {
      console.error(`No subscription found for ID ${subscription.id}`);
      return false;
    }
    
    const userId = subscriptionData.user_id;
    console.log(`Resetting subscription for user ${userId} to free plan`);
    
    // Reset the subscription to the free plan
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        plan: 'free',
        urls_limit: 1,
        has_api_access: false,
        stripe_subscription_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
    
    if (updateError) {
      console.error(`Error resetting subscription for user ${userId}: ${updateError.message}`);
      return false;
    }
    
    console.log(`Subscription reset successfully for user ${userId}`);
    return true;
  } catch (error) {
    console.error(`Error in handleSubscriptionDeleted: ${error.message}`);
    return false;
  }
}
