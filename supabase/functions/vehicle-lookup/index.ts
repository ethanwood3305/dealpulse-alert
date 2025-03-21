import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      'https://wskiwwfgelypkrufsimz.supabase.co',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    if (req.method === 'GET') {
      console.log('Fetching car brands')
      
      try {
        const { data: brands, error: brandsError } = await supabaseClient
          .from('car_brands')
          .select('id, name')
          .order('name')

        if (brandsError) {
          console.error('Error fetching brands:', brandsError)
          throw brandsError
        }

        console.log(`Successfully fetched ${brands?.length || 0} brands`)
        
        return new Response(
          JSON.stringify({ 
            brands: brands || [],
            success: true
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )
      } catch (brandsQueryError) {
        console.error('Critical error when fetching brands:', brandsQueryError)
        
        // Fallback to returning an empty array but with a 200 status
        // This prevents the UI from showing an error and allows the default brands to be used
        return new Response(
          JSON.stringify({ 
            brands: [],
            success: false,
            error: brandsQueryError.message || 'Failed to query car brands'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )
      }
    } else if (req.method === 'POST') {
      const { brandId, modelId, registration } = await req.json()
      
      // If we have a registration, process vehicle lookup via proxy
      if (registration) {
        console.log(`Processing registration lookup for: ${registration}`)
        const registrationClean = registration.replace(/\s+/g, '').toUpperCase()
        
        try {
          console.log(`Calling vehicle-proxy function for registration: ${registrationClean}`)
          
          const supabaseUrl = 'https://wskiwwfgelypkrufsimz.supabase.co';
          const proxyUrl = `${supabaseUrl}/functions/v1/vehicle-proxy`;
          
          console.log("Complete Proxy URL:", proxyUrl);
          
          // Get the API key to pass to the proxy
          const apiKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
          
          if (!apiKey) {
            console.error('Missing API key for proxy request');
            throw new Error('Authentication information missing');
          }
          
          console.log("Starting request to vehicle-proxy");
          
          try {
            const response = await fetch(proxyUrl, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'apikey': apiKey,
                'Authorization': `Bearer ${apiKey}`
              },
              body: JSON.stringify({ vrm: registrationClean })
            });
            
            console.log(`Vehicle-proxy response status: ${response.status}`);
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error('Vehicle-proxy error response:', errorText);
              
              try {
                const errorJson = JSON.parse(errorText);
                console.log('Parsed error details:', JSON.stringify(errorJson));
                
                if (errorJson.code === "VEHICLE_NOT_FOUND") {
                  return new Response(
                    JSON.stringify({ 
                      error: 'Registration not found in vehicle database',
                      code: 'VEHICLE_NOT_FOUND'
                    }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
                  );
                }
                
                return new Response(
                  JSON.stringify({ 
                    error: errorJson.error || 'Error retrieving vehicle data',
                    code: errorJson.code || 'SERVICE_ERROR',
                    diagnostic: errorJson.diagnostic
                  }),
                  { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
                );
              } catch (parseError) {
                console.error('Error parsing error response:', parseError);
                throw new Error(`Vehicle-proxy request failed with status ${response.status}`);
              }
            }
            
            const proxyData = await response.json();
            console.log('Vehicle-proxy response received:', JSON.stringify(proxyData));
            
            if (!proxyData.success) {
              throw new Error(proxyData.error || 'Error retrieving vehicle data');
            }
            
            return new Response(
              JSON.stringify({ 
                vehicle: proxyData.vehicle,
                source: 'vehicle_proxy',
                success: true
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            );
          } catch (fetchError) {
            console.error('Fetch error:', fetchError);
            
            return new Response(
              JSON.stringify({ 
                error: fetchError.message || 'Failed to lookup vehicle details',
                code: 'PROXY_ERROR',
                diagnostic: {
                  error_type: fetchError.name,
                  error_message: fetchError.message
                }
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
            );
          }
        } catch (apiError) {
          console.error('Error during vehicle-proxy API call:', apiError);
          
          return new Response(
            JSON.stringify({ 
              error: apiError.message || 'Failed to lookup vehicle details',
              diagnostic: {
                error_type: apiError.name,
                error_message: apiError.message,
                stack: apiError.stack
              }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
      }
      
      // If we have a brandId, fetch models for that brand
      if (brandId) {
        console.log('Fetching models for brand ID:', brandId)
        try {
          const { data: models, error: modelsError } = await supabaseClient
            .from('car_models')
            .select('id, name')
            .eq('brand_id', brandId)
            .order('name')

          if (modelsError) {
            console.error('Error fetching models:', modelsError)
            throw modelsError
          }

          console.log(`Successfully fetched ${models?.length || 0} models for brand ${brandId}`)
          
          return new Response(
            JSON.stringify({ models: models || [] }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          )
        } catch (modelsQueryError) {
          console.error('Critical error when fetching models:', modelsQueryError)
          return new Response(
            JSON.stringify({ 
              models: [],
              error: modelsQueryError.message || 'Failed to query car models'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          )
        }
      }
      
      // If we have a modelId, fetch engine types for that model
      if (modelId) {
        console.log('Fetching engine types for model ID:', modelId)
        try {
          const { data: engineTypes, error: engineTypesError } = await supabaseClient
            .from('engine_types')
            .select('id, name, fuel_type, capacity, power')
            .eq('model_id', modelId)
            .order('name')

          if (engineTypesError) {
            console.error('Error fetching engine types:', engineTypesError)
            throw engineTypesError
          }

          console.log(`Successfully fetched ${engineTypes?.length || 0} engine types for model ${modelId}`)
          
          return new Response(
            JSON.stringify({ engineTypes: engineTypes || [] }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          )
        } catch (engineTypesQueryError) {
          console.error('Critical error when fetching engine types:', engineTypesQueryError)
          return new Response(
            JSON.stringify({ 
              engineTypes: [],
              error: engineTypesQueryError.message || 'Failed to query engine types'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          )
        }
      }
      
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
    
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    )
  } catch (error) {
    console.error('Error processing request:', error)
    
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
