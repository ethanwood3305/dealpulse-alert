
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
        const ukVehicleDataApiKey = Deno.env.get('UKVEHICLEDATA_API_KEY')
        if (!ukVehicleDataApiKey) {
          console.error('UKVehicleData API key not configured in environment')
          return new Response(
            JSON.stringify({ 
              error: 'UKVehicleData API key not configured',
              source: 'mock_data',
              vehicle: getMockVehicleData(registration)
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          )
        }
        
        console.log(`Processing registration lookup for: ${registration}`)
        const registrationClean = registration.replace(/\s+/g, '').toUpperCase()
        
        try {
          console.log(`Calling UKVehicleData API for registration: ${registrationClean}`)
          console.log(`Using API key: ${ukVehicleDataApiKey.substring(0, 5)}...`)
          
          // Prepare the request body
          const requestBody = JSON.stringify({
            v: 2,
            api_nullitems: 1,
            auth_apikey: ukVehicleDataApiKey,
            key_VRM: registrationClean,
          });
          
          console.log("Request body:", requestBody);
          
          // Call the UKVehicleData API with improved error handling
          try {
            const response = await fetch('https://api.ukvehicledata.co.uk/api/datapackage/VehicleData', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: requestBody
            });
            
            console.log(`UKVehicleData API response status: ${response.status}`);
            
            if (!response.ok) {
              // Try to parse error response
              const errorText = await response.text();
              console.error('UKVehicleData API error response text:', errorText);
              
              let errorData = {};
              try {
                errorData = JSON.parse(errorText);
                console.error('UKVehicleData API error data:', errorData);
              } catch (parseError) {
                console.error('Could not parse UKVehicleData error response:', parseError);
              }
              
              let errorMessage = 'Error connecting to vehicle data service';
              
              // Handle specific error cases
              if (response.status === 404) {
                errorMessage = 'Vehicle not found with that registration number';
              } else if (response.status === 401 || response.status === 403) {
                errorMessage = 'Authentication failed with vehicle data service. The API key may be invalid.';
              }
              
              // For API errors, fall back to mock data with the error message
              return new Response(
                JSON.stringify({ 
                  error: errorMessage,
                  source: 'mock_data',
                  vehicle: getMockVehicleData(registrationClean)
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
              );
            }
            
            // Parse response body
            const responseData = await response.json();
            console.log('UKVehicleData API response data (partial):', JSON.stringify(responseData).substring(0, 200) + '...');
            
            if (!responseData.Response || responseData.Response.StatusCode !== "Success") {
              console.error('UKVehicleData API returned an error:', responseData.Response?.StatusMessage || 'Unknown error');
              
              return new Response(
                JSON.stringify({
                  error: responseData.Response?.StatusMessage || 'Error retrieving vehicle data',
                  source: 'mock_data',
                  vehicle: getMockVehicleData(registrationClean)
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
              );
            }
            
            // Extract the vehicle data
            const vehicleInfo = responseData.Response.DataItems.VehicleRegistration;
            const motInfo = responseData.Response.DataItems.MotVed?.MotHistory?.[0] || {};
            const technicalInfo = responseData.Response.DataItems.TechnicalDetails;
            
            // Map UKVehicleData API response to our expected format
            const vehicleData = {
              registration: registrationClean,
              make: vehicleInfo.Make || 'Unknown',
              model: vehicleInfo.Model || 'Unknown',
              color: vehicleInfo.Colour || 'Unknown',
              fuelType: technicalInfo?.FuelType || 'Unknown',
              year: vehicleInfo.YearOfManufacture?.toString() || 'Unknown',
              engineSize: technicalInfo?.EngineCapacity 
                ? `${(parseInt(technicalInfo.EngineCapacity) / 1000).toFixed(1)}L` 
                : 'Unknown',
              motStatus: motInfo?.TestResult === 'PASSED' ? 'Valid' : (motInfo?.TestResult === 'FAILED' ? 'Invalid' : 'Unknown'),
              motExpiryDate: motInfo?.ExpiryDate || null,
              taxStatus: vehicleInfo.TaxStatus || 'Unknown',
              taxDueDate: vehicleInfo.TaxDueDate || null,
            };
            
            console.log('Mapped vehicle data:', JSON.stringify(vehicleData));
            
            return new Response(
              JSON.stringify({ 
                vehicle: vehicleData,
                source: 'ukvehicledata_api'
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            );
          } catch (fetchError) {
            console.error('Fetch error with UKVehicleData API call:', fetchError);
            console.error('Error details:', fetchError.stack || 'No stack trace available');
            
            // Provide more detailed diagnostic information
            return new Response(
              JSON.stringify({ 
                vehicle: getMockVehicleData(registrationClean), 
                warning: 'Using mock data due to API connection error',
                error: `API connection error: ${fetchError.message}. This may be due to network restrictions in the serverless environment.`,
                source: 'mock_data',
                diagnostic: {
                  error_type: fetchError.name,
                  error_message: fetchError.message,
                  stack: fetchError.stack
                }
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            );
          }
        } catch (apiError) {
          console.error('Error during UKVehicleData API call:', apiError);
          
          // If the actual API call fails, provide some realistic mock data as fallback
          console.log('Falling back to mock data for registration:', registrationClean);
          
          return new Response(
            JSON.stringify({ 
              vehicle: getMockVehicleData(registrationClean), 
              warning: 'Using mock data due to API error',
              error: apiError.message,
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
