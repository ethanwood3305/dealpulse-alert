
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Get user subscription data
export const getUserSubscription = async (userId: string) => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id, has_api_access, api_key, urls_limit')
    .eq('user_id', userId)
    .single();
  
  return { data, error };
};

// Get user data
export const getUserData = async (userId: string) => {
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  return { data, error };
};

// Update subscription with Stripe customer ID
export const updateSubscriptionWithCustomerId = async (userId: string, customerId: string) => {
  return await supabase
    .from('subscriptions')
    .update({ stripe_customer_id: customerId })
    .eq('user_id', userId);
};

// Update subscription with URL limit and API access
export const updateSubscriptionDetails = async (userId: string, urlsLimit: number, hasApiAccess: boolean) => {
  return await supabase
    .from('subscriptions')
    .update({ 
      urls_limit: urlsLimit,
      has_api_access: hasApiAccess,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);
};
