
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Handle CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract request data
    const { userId, postcode, adminApiKey } = await req.json();

    // Validate admin API key (you need to set this in your Supabase secrets)
    const expectedAdminKey = Deno.env.get('ADMIN_API_KEY') || '';
    if (!expectedAdminKey || adminApiKey !== expectedAdminKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Unauthorized: Invalid admin API key' 
        }),
        { 
          status: 401, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      );
    }

    // Validate required fields
    if (!userId || !postcode) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Bad request: Missing required fields (userId, postcode)' 
        }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      );
    }

    // Update the dealer postcode in the database
    const { error } = await supabase
      .from('subscriptions')
      .update({ dealer_postcode: postcode.trim() })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating dealer postcode:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to update dealer postcode' 
        }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      );
    }

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Dealer postcode updated successfully' 
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );
  }
});
