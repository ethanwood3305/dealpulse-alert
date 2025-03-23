
// Using a standalone fetch implementation instead of relying on @supabase/node-fetch
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('Populate car data function called');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 200
    });
  }

  try {
    // Create a direct fetch request to the Supabase RPC endpoint instead of using the client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    // Direct API call to the RPC endpoint to populate car data
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/populate_car_data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to call populate_car_data RPC: ${response.status} ${errorText}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Car data populated successfully' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error populating car data:', error);
    
    return new Response(
      JSON.stringify({ error: 'Failed to populate car data', details: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
