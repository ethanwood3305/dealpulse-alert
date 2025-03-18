
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('Vehicle lookup function called with method:', req.method);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { 
      headers: corsHeaders,
      status: 200
    });
  }

  try {
    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    console.log('Supabase URL available:', !!supabaseUrl);
    console.log('Supabase key available:', !!supabaseKey);

    const supabaseAdmin = createClient(
      supabaseUrl ?? '',
      supabaseKey ?? ''
    );

    // Parse the request URL to get query parameters
    const url = new URL(req.url);
    const brandId = url.searchParams.get('brandId');
    const modelId = url.searchParams.get('modelId');

    // Allow both GET method with query params and POST method with JSON body
    let params = {};
    if (req.method === 'POST') {
      const body = await req.json();
      params = body;
    }

    // If modelId is provided, fetch engine types for that model
    const requestModelId = modelId || params.modelId;
    if (requestModelId) {
      console.log(`Fetching engine types for model ID: ${requestModelId}`);
      
      const { data: engineTypes, error: engineTypesError } = await supabaseAdmin
        .from('engine_types')
        .select('id, name, fuel_type, capacity, power')
        .eq('model_id', requestModelId)
        .order('name');

      if (engineTypesError) {
        console.error('Error fetching engine types:', engineTypesError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch engine types', details: engineTypesError.message }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500 
          }
        );
      }

      return new Response(
        JSON.stringify({ engineTypes }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }
    
    // If brandId is provided, fetch models for that brand
    const requestBrandId = brandId || params.brandId;
    if (requestBrandId) {
      console.log(`Fetching models for brand ID: ${requestBrandId}`);
      
      const { data: models, error: modelsError } = await supabaseAdmin
        .from('car_models')
        .select('id, name')
        .eq('brand_id', requestBrandId)
        .order('name');

      if (modelsError) {
        console.error('Error fetching models:', modelsError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch car models', details: modelsError.message }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500 
          }
        );
      }

      return new Response(
        JSON.stringify({ models }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }
    
    // By default, fetch all brands
    else {
      const { data: brands, error: brandsError } = await supabaseAdmin
        .from('car_brands')
        .select('id, name')
        .order('name');

      if (brandsError) {
        console.error('Error fetching brands:', brandsError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch car brands', details: brandsError.message }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500 
          }
        );
      }

      return new Response(
        JSON.stringify({ brands }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }
  } catch (error) {
    console.error('Error in vehicle lookup:', error);
    
    return new Response(
      JSON.stringify({ error: 'Failed to lookup vehicle details', details: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
})
