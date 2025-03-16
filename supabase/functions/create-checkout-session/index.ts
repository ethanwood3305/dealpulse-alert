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
    
    const client_url = Deno.env.get('CLIENT_URL') || 'http://localhost:5173';
    
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
        },
      },
      metadata: {
        user_id: userId,
        plan,
        url_count: urlCount.toString(),
        api_access: includeApiAccess ? 'yes' : 'no',
      },
    };
    
    // Create new Stripe customer if needed
    if (!subscriptionData?.stripe_customer_id) {
      // Get user email from auth.users
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
      
      if (userError || !userData.user) {
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
