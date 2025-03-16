
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
  // Set up robust error handling to catch and log any errors
  try {
    console.log("Received webhook request at path:", req.url);
    console.log("Method:", req.method);
    
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders, status: 200 });
    }

    if (req.method !== "POST") {
      console.log(`Invalid method: ${req.method}`);
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check for environment variables
    if (!stripeSecretKey) {
      console.error("Missing STRIPE_SECRET_KEY environment variable");
      return new Response(JSON.stringify({ error: "Server configuration error: Missing Stripe key" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase environment variables");
      return new Response(JSON.stringify({ error: "Server configuration error: Missing Supabase credentials" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get the webhook signature from headers
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
    
    if (!signature) {
      console.error("Missing Stripe signature in webhook request");
      return new Response(JSON.stringify({ error: "Missing Stripe signature" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!webhookSecret) {
      console.error("Missing STRIPE_WEBHOOK_SECRET environment variable");
      return new Response(JSON.stringify({ error: "Server configuration error: Missing webhook secret" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get raw request body
    let body;
    try {
      body = await req.text();
      console.log("Received webhook payload of length:", body.length);
      console.log("Body preview:", body.substring(0, 100) + "...");
    } catch (err) {
      console.error(`Error reading request body: ${err.message}`);
      return new Response(JSON.stringify({ error: "Could not read request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    
    // Verify webhook signature using async approach for Deno compatibility
    let event;
    try {
      console.log("Verifying Stripe signature with async approach...");
      console.log("Signature:", signature.substring(0, 20) + "...");
      console.log("Webhook Secret:", webhookSecret.substring(0, 5) + "...");
      
      // Use constructEventAsync instead of constructEvent
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      console.log(`Webhook verified. Event type: ${event.type}`);
      console.log(`Event ID: ${event.id}`);
    } catch (err) {
      console.error(`⚠️ Webhook signature verification failed: ${err.message}`);
      console.error(`Error details: ${JSON.stringify(err)}`);
      return new Response(JSON.stringify({ error: `Webhook Error: ${err.message}` }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Handle the event
    let result = false;
    console.log(`Processing event type: ${event.type}`);
    
    // Log the event data for debugging
    console.log(`Event data: ${JSON.stringify(event.data.object).substring(0, 200)}...`);
    
    switch (event.type) {
      case 'checkout.session.completed':
        console.log("Handling checkout.session.completed event");
        result = await handleCheckoutSessionCompletedSafe(event.data.object);
        break;
      case 'customer.subscription.updated':
        console.log("Handling customer.subscription.updated event");
        result = await handleSubscriptionUpdatedSafe(event.data.object);
        break;
      case 'customer.subscription.deleted':
        console.log("Handling customer.subscription.deleted event");
        result = await handleSubscriptionDeletedSafe(event.data.object);
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
    // Catch-all error handler
    console.error(`⚠️ Critical webhook error: ${error.message}`);
    console.error(error.stack);
    
    // Log detailed error information
    if (error instanceof Error) {
      console.error(`Error name: ${error.name}`);
      console.error(`Error message: ${error.message}`);
      console.error(`Error stack: ${error.stack}`);
      if ('cause' in error) {
        console.error(`Error cause: ${JSON.stringify(error.cause)}`);
      }
    } else {
      console.error(`Unknown error type: ${typeof error}`);
      console.error(`String representation: ${String(error)}`);
    }
    
    return new Response(JSON.stringify({ error: "Internal server error", details: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

// Wrapped handler to catch errors for checkout.session.completed events
async function handleCheckoutSessionCompletedSafe(session) {
  try {
    return await handleCheckoutSessionCompleted(session);
  } catch (error) {
    console.error(`Error in handleCheckoutSessionCompletedSafe: ${error.message}`);
    console.error(error.stack);
    return false;
  }
}

// Wrapped handler to catch errors for customer.subscription.updated events
async function handleSubscriptionUpdatedSafe(subscription) {
  try {
    return await handleSubscriptionUpdated(subscription);
  } catch (error) {
    console.error(`Error in handleSubscriptionUpdatedSafe: ${error.message}`);
    console.error(error.stack);
    return false;
  }
}

// Wrapped handler to catch errors for customer.subscription.deleted events
async function handleSubscriptionDeletedSafe(subscription) {
  try {
    return await handleSubscriptionDeleted(subscription);
  } catch (error) {
    console.error(`Error in handleSubscriptionDeletedSafe: ${error.message}`);
    console.error(error.stack);
    return false;
  }
}

// Handler for checkout.session.completed events
async function handleCheckoutSessionCompleted(session) {
  console.log("Processing checkout.session.completed event");
  console.log(`Session ID: ${session.id}`);
  console.log(`User ID (client_reference_id): ${session.client_reference_id}`);
  console.log(`Metadata: ${JSON.stringify(session.metadata || {})}`);
  
  if (!session.client_reference_id) {
    console.error("❌ No client_reference_id in session");
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
      console.error(`❌ Error checking subscription: ${checkError.message}`);
      throw new Error(`Database error: ${checkError.message}`);
    }
    
    console.log(`Existing subscription found: ${JSON.stringify(existingSubscription || {})}`);
    
    // Get subscription ID from the session
    let stripeSubscriptionId = null;
    try {
      // Check if there's a subscription in the session
      if (session.subscription) {
        stripeSubscriptionId = session.subscription;
        console.log(`Found subscription ID in session: ${stripeSubscriptionId}`);
      } else if (session.mode === 'subscription') {
        // Try to retrieve the latest subscription for the customer
        console.log(`Fetching subscriptions for customer ${session.customer}`);
        const subscriptions = await stripe.subscriptions.list({
          customer: session.customer,
          limit: 1
        });
        
        if (subscriptions.data.length > 0) {
          stripeSubscriptionId = subscriptions.data[0].id;
          console.log(`Retrieved subscription ID from customer: ${stripeSubscriptionId}`);
        } else {
          console.log("No subscriptions found for customer");
        }
      }
    } catch (subError) {
      console.error(`❌ Error retrieving subscription ID: ${subError.message}`);
      // Continue without subscription ID
    }
    
    // Update the subscription in the database
    const updateData = {
      plan: planId,
      urls_limit: urlCount,
      has_api_access: hasApiAccess,
      updated_at: new Date().toISOString()
    };
    
    if (stripeSubscriptionId) {
      updateData.stripe_subscription_id = stripeSubscriptionId;
    }
    
    console.log(`Updating subscription with data: ${JSON.stringify(updateData)}`);
    
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('user_id', userId);
    
    if (updateError) {
      console.error(`❌ Error updating subscription for user ${userId}: ${updateError.message}`);
      throw new Error(`Database update error: ${updateError.message}`);
    }
    
    console.log(`✅ Subscription updated successfully for user ${userId}`);
    
    // Verify the update
    const { data: verifyData, error: verifyError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (verifyError) {
      console.error(`❌ Error verifying subscription update: ${verifyError.message}`);
      throw new Error(`Database verification error: ${verifyError.message}`);
    }
    
    console.log(`✅ Verified subscription data: ${JSON.stringify(verifyData || {})}`);
    return true;
  } catch (error) {
    console.error(`❌ Error in handleCheckoutSessionCompleted: ${error.message}`);
    console.error(error.stack);
    throw error; // Re-throw to be caught by the main handler
  }
}

// Handler for customer.subscription.updated events
async function handleSubscriptionUpdated(subscription) {
  console.log("Processing customer.subscription.updated event");
  console.log(`Subscription ID: ${subscription.id}`);
  console.log(`Subscription metadata: ${JSON.stringify(subscription.metadata || {})}`);
  
  try {
    // Get the user ID from metadata
    let userId = subscription.metadata?.user_id;
    if (!userId) {
      console.log("No user_id in subscription metadata, trying to find in database");
      
      // Try to find the subscription in the database
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_subscription_id', subscription.id)
        .single();
        
      if (subError || !subData) {
        console.error(`❌ Couldn't find user for subscription ${subscription.id}`);
        throw new Error(`No user found for subscription ${subscription.id}`);
      }
      
      console.log(`Found user ${subData.user_id} for subscription ${subscription.id}`);
      userId = subData.user_id;
    }
    
    // Get the subscription item details
    const subscriptionItem = subscription.items.data[0];
    if (!subscriptionItem) {
      console.error("❌ No subscription item found");
      throw new Error("No subscription item found in the subscription data");
    }
    
    // Get the price metadata
    let urlCount = 1;
    let hasApiAccess = false;
    let planId = 'free';
    
    try {
      console.log(`Retrieving price details for ${subscriptionItem.price.id}`);
      const price = await stripe.prices.retrieve(subscriptionItem.price.id);
      console.log(`Retrieved price: ${JSON.stringify(price.metadata || {})}`);
      urlCount = parseInt(price.metadata?.url_count || "1", 10);
      hasApiAccess = price.metadata?.api_access === 'yes';
      planId = price.metadata?.plan || 'free';
    } catch (priceError) {
      console.error(`❌ Error retrieving price: ${priceError.message}`);
      // Continue with default values
    }
    
    console.log(`Updating subscription for user ${userId}: URLs=${urlCount}, API access=${hasApiAccess}, Plan=${planId}`);
    
    // Update the subscription in the database
    const updateData = {
      plan: planId,
      urls_limit: urlCount,
      has_api_access: hasApiAccess,
      stripe_subscription_id: subscription.id,
      updated_at: new Date().toISOString()
    };
    
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('user_id', userId);
    
    if (updateError) {
      console.error(`❌ Error updating subscription for user ${userId}: ${updateError.message}`);
      throw new Error(`Database update error: ${updateError.message}`);
    }
    
    console.log(`✅ Subscription updated successfully for user ${userId}`);
    
    // Verify the update
    const { data: verifyData, error: verifyError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (verifyError) {
      console.error(`❌ Error verifying subscription update: ${verifyError.message}`);
      throw new Error(`Database verification error: ${verifyError.message}`);
    }
    
    console.log(`✅ Verified subscription data: ${JSON.stringify(verifyData || {})}`);
    return true;
  } catch (error) {
    console.error(`❌ Error in handleSubscriptionUpdated: ${error.message}`);
    console.error(error.stack);
    throw error; // Re-throw to be caught by the main handler
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
      console.error(`❌ Error finding subscription: ${findError.message}`);
      throw new Error(`Database error: ${findError.message}`);
    }
    
    if (!subscriptionData) {
      console.error(`❌ No subscription found for ID ${subscription.id}`);
      throw new Error(`No subscription found for ID ${subscription.id}`);
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
      console.error(`❌ Error resetting subscription for user ${userId}: ${updateError.message}`);
      throw new Error(`Database update error: ${updateError.message}`);
    }
    
    console.log(`✅ Subscription reset successfully for user ${userId}`);
    return true;
  } catch (error) {
    console.error(`❌ Error in handleSubscriptionDeleted: ${error.message}`);
    console.error(error.stack);
    throw error; // Re-throw to be caught by the main handler
  }
}
