
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

    const { vrm } = await req.json();
    
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

    const requestData = {
      v: 2,
      api_nullitems: 1,
      auth_apikey: UKVEHICLEDATA_API_KEY,
      user_tag: "supabase_edge",
      key_VRM: vrm,
      "key_VehicleData": "Yes",
      "key_MOTData": "Yes",
      "key_TaxStatusData": "Yes"
    };

    try {
      console.log('Calling UK Vehicle Data API...');

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      console.log(`API response status: ${response.status}`);

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
            code: code
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
        doorCount: vehicleInfo.DoorPlan || 'Unknown',
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
})
