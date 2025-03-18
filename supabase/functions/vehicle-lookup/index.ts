
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
      Deno.env.get('SUPABASE_URL') ?? '',
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
      
      // If we have a registration, process DVLA lookup
      if (registration) {
        const dvlaApiKey = Deno.env.get('DVLA_API_KEY')
        if (!dvlaApiKey) {
          console.error('DVLA API key not configured in environment')
          return new Response(
            JSON.stringify({ 
              error: 'DVLA API key not configured',
              source: 'mock_data',
              vehicle: getMockVehicleData(registration)
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          )
        }
        
        console.log(`Processing registration lookup for: ${registration}`)
        const registrationClean = registration.replace(/\s+/g, '').toUpperCase()
        
        try {
          console.log(`Calling DVLA API for registration: ${registrationClean}`)
          console.log(`Using API key: ${dvlaApiKey.substring(0, 3)}...${dvlaApiKey.substring(dvlaApiKey.length - 3)}`)
          
          // Call the real DVLA API
          // DVLA Vehicle Enquiry Service API: https://developer-portal.driver-vehicle-licensing.api.gov.uk/
          const response = await fetch('https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles', {
            method: 'POST',
            headers: {
              'x-api-key': dvlaApiKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ registrationNumber: registrationClean })
          });
          
          console.log(`DVLA API response status: ${response.status}`);
          
          if (!response.ok) {
            // Try to parse error response
            const errorText = await response.text();
            console.error('DVLA API error response text:', errorText);
            
            let errorData = {};
            try {
              errorData = JSON.parse(errorText);
              console.error('DVLA API error data:', errorData);
            } catch (parseError) {
              console.error('Could not parse DVLA error response:', parseError);
            }
            
            if (response.status === 404) {
              return new Response(
                JSON.stringify({ error: 'Vehicle not found with that registration number' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
              );
            } else if (response.status === 403) {
              console.error('Forbidden error from DVLA API. API key may be invalid or expired.');
              // Return a more specific error for forbidden
              return new Response(
                JSON.stringify({ 
                  error: 'Access to DVLA API forbidden. The API key may be invalid or expired.',
                  source: 'mock_data',
                  vehicle: getMockVehicleData(registrationClean)
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
              );
            }
            
            // For other errors, fall back to mock data with the error message
            const errorMessage = errorData.message || `DVLA API error: ${response.status} ${response.statusText}`;
            return new Response(
              JSON.stringify({ 
                error: errorMessage,
                source: 'mock_data',
                vehicle: getMockVehicleData(registrationClean)
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            );
          }
          
          // Try to parse response body
          const responseText = await response.text();
          console.log('DVLA API response text:', responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''));
          
          let dvlaData;
          try {
            dvlaData = JSON.parse(responseText);
          } catch (parseError) {
            console.error('Failed to parse DVLA API response:', parseError);
            return new Response(
              JSON.stringify({ 
                error: 'Invalid response format from DVLA API',
                source: 'mock_data',
                vehicle: getMockVehicleData(registrationClean)
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            );
          }
          
          console.log('Successfully retrieved DVLA data:', JSON.stringify(dvlaData).substring(0, 200));
          
          // Map DVLA API response to our expected format
          const vehicleData = {
            registration: registrationClean,
            make: dvlaData.make || 'Unknown',
            model: dvlaData.model || 'Unknown',
            color: dvlaData.colour || 'Unknown',
            fuelType: dvlaData.fuelType || 'Unknown',
            year: dvlaData.yearOfManufacture?.toString() || 'Unknown',
            engineSize: dvlaData.engineCapacity ? `${(dvlaData.engineCapacity / 1000).toFixed(1)}L` : 'Unknown',
            motStatus: dvlaData.motStatus || 'Unknown',
            motExpiryDate: dvlaData.motExpiryDate || null,
            taxStatus: dvlaData.taxStatus || 'Unknown',
            taxDueDate: dvlaData.taxDueDate || null,
          };
          
          console.log('Mapped vehicle data:', JSON.stringify(vehicleData));
          
          return new Response(
            JSON.stringify({ 
              vehicle: vehicleData,
              source: 'dvla_api'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        } catch (dvlaError) {
          console.error('Error during DVLA API call:', dvlaError);
          
          // If the actual API call fails, provide some realistic mock data as fallback
          // This helps during development or if the API temporarily fails
          console.log('Falling back to mock data for registration:', registrationClean);
          
          return new Response(
            JSON.stringify({ 
              vehicle: getMockVehicleData(registrationClean), 
              warning: 'Using mock data due to API error',
              error: dvlaError.message,
              source: 'mock_data'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
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

// Function to generate mock data for a registration
function getMockVehicleData(registration) {
  return {
    registration: registration,
    make: 'Ford',
    model: 'Focus',
    color: 'Blue',
    fuelType: 'Petrol',
    year: '2022',
    engineSize: '1.0L',
    motStatus: 'Valid',
    motExpiryDate: '2025-10-15',
    taxStatus: 'Taxed',
    taxDueDate: '2026-01-01',
  };
}
