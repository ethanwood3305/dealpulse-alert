import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const UKVEHICLEDATA_API_KEY = Deno.env.get('UKVEHICLEDATA_API_KEY');
const API_ENDPOINT = 'https://uk1.ukvehicledata.co.uk/api/datapackage/VehicleData';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Vehicle proxy function invoked');
    
    if (!UKVEHICLEDATA_API_KEY) {
      console.error('API key is missing');
      return new Response(
        JSON.stringify({ 
          error: 'Service configuration error',
          success: false,
          code: 'MISSING_API_KEY'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Get the registration from the request body
    const reqBody = await req.text();
    console.log(`Request body: ${reqBody}`);
    
    let jsonBody;
    try {
      jsonBody = JSON.parse(reqBody);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request format',
          success: false,
          code: 'INVALID_REQUEST_FORMAT'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    const { vrm } = jsonBody;
    
    if (!vrm) {
      console.error('Missing VRM in request');
      return new Response(
        JSON.stringify({ 
          error: 'Vehicle registration number is required',
          success: false,
          code: 'MISSING_VRM'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Processing VRM lookup for: ${vrm}`);

    // Construct the request body following the API documentation
    const requestData = {
      v: 2,
      api_nullitems: 1,
      auth_apikey: UKVEHICLEDATA_API_KEY,
      user_tag: "supabase_edge",
      key_VRM: vrm,
      key_VehicleData: "Yes",
      key_MOTData: "Yes",
      key_TaxStatusData: "Yes"
    };

    try {
      console.log('Calling UK Vehicle Data API...');
      console.log('Request data:', JSON.stringify(requestData));

      // Use POST method with JSON body as specified in the docs
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      try {
        const response = await fetch(API_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        
        console.log(`API response status: ${response.status}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`API error response (${response.status}):`, errorText);
          
          return new Response(
            JSON.stringify({ 
              error: `API returned error status: ${response.status}`,
              success: false,
              code: 'API_HTTP_ERROR',
              statusCode: response.status,
              responseText: errorText
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
          );
        }

        const data = await response.json();
        console.log('API response received');

        // Check for API error responses
        if (data.Response && data.Response.StatusCode !== 'Success') {
          const errorMessage = data.Response.StatusMessage || 'Vehicle lookup failed';
          console.error(`API error: ${errorMessage}`, data.Response);

          // Parse specific error conditions
          let code = 'API_ERROR';
          if (data.Response.StatusMessage && data.Response.StatusMessage.includes('No vehicle found')) {
            code = 'VEHICLE_NOT_FOUND';
          }

          return new Response(
            JSON.stringify({ 
              error: errorMessage,
              success: false,
              code: code,
              apiResponse: data.Response
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
          );
        }

        // Extract and map the vehicle data
        const vehicleInfo = data.Response.DataItems.VehicleRegistration || {};
        const motInfo = data.Response.DataItems.MotHistory || {};
        const taxInfo = data.Response.DataItems.VehicleTaxDetails || {};
        
        // Map API data to expected structure
        const vehicleData = {
          registration: vrm,
          make: vehicleInfo.Make || 'Unknown',
          model: vehicleInfo.Model || 'Unknown',
          color: vehicleInfo.Colour || 'Unknown',
          fuelType: vehicleInfo.FuelType || 'Unknown',
          year: vehicleInfo.YearOfManufacture || 'Unknown',
          engineSize: vehicleInfo.EngineCapacity 
              ? `${vehicleInfo.EngineCapacity}cc` 
              : 'Unknown',
          motStatus: motInfo.MotTestResult || 'Unknown',
          motExpiryDate: motInfo.ExpiryDate || null,
          taxStatus: taxInfo.TaxStatus || 'Unknown',
          taxDueDate: taxInfo.TaxDueDate || null,
          doorCount: vehicleInfo.NumberOfDoors || 'Unknown',
          bodyStyle: vehicleInfo.BodyStyle || 'Unknown',
          transmission: vehicleInfo.Transmission || 'Unknown',
          weight: vehicleInfo.GrossVehicleWeight ? 
              `${vehicleInfo.GrossVehicleWeight}` 
              : 'Unknown',
        };

        console.log('Vehicle data processed successfully');
        
        return new Response(
          JSON.stringify({ 
            vehicle: vehicleData,
            success: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          console.error('API request timed out after 30 seconds');
          return new Response(
            JSON.stringify({ 
              error: 'Request to vehicle data service timed out',
              success: false,
              code: 'API_TIMEOUT',
              diagnostic: {
                error_type: 'AbortError',
                error_message: 'Request timed out after 30 seconds'
              }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 504 }
          );
        }
        
        console.error('Error fetching from UK Vehicle Data API:', fetchError);
        
        return new Response(
          JSON.stringify({ 
            error: 'Failed to retrieve vehicle data',
            success: false,
            diagnostic: {
              error_type: fetchError.name,
              error_message: fetchError.message
            },
            code: 'API_REQUEST_FAILED'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    } catch (error) {
      console.error('Error in vehicle-proxy function:', error);
      
      return new Response(
        JSON.stringify({ 
          error: error.message || 'An unexpected error occurred',
          success: false,
          diagnostic: {
            error_type: error.name,
            error_message: error.message,
            stack: error.stack
          },
          code: 'INTERNAL_ERROR'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in vehicle-proxy function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        success: false,
        diagnostic: {
          error_type: error.name,
          error_message: error.message,
          stack: error.stack
        },
        code: 'INTERNAL_ERROR'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
})
