import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const UKVEHICLEDATA_API_KEY = Deno.env.get('UKVEHICLEDATA_API_KEY');
const API_ENDPOINT = 'https://long-frost-6310.ethanwood3305.workers.dev/';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!UKVEHICLEDATA_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Missing API key', success: false, code: 'MISSING_API_KEY' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const reqBody = await req.text();
    let jsonBody;
    try {
      jsonBody = JSON.parse(reqBody);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid request format', success: false, code: 'INVALID_REQUEST_FORMAT' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const { vrm } = jsonBody;
    if (!vrm) {
      return new Response(
        JSON.stringify({ error: 'Vehicle registration number is required', success: false, code: 'MISSING_VRM' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Build query URL
    const url = new URL(API_ENDPOINT);
    url.searchParams.set("v", "2");
    url.searchParams.set("api_nullitems", "1");
    url.searchParams.set("auth_apikey", UKVEHICLEDATA_API_KEY);
    url.searchParams.set("key_VRM", vrm);
    url.searchParams.set("key_VehicleData", "Yes");
    url.searchParams.set("key_MOTData", "Yes");
    url.searchParams.set("key_TaxStatusData", "Yes");
    url.searchParams.set("user_tag", "supabase_edge");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
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

      if (data.Response && data.Response.StatusCode !== 'Success') {
        const errorMessage = data.Response.StatusMessage || 'Vehicle lookup failed';
        let code = 'API_ERROR';
        if (data.Response.StatusMessage?.includes('No vehicle found')) {
          code = 'VEHICLE_NOT_FOUND';
        }
        return new Response(
          JSON.stringify({ error: errorMessage, success: false, code, apiResponse: data.Response }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }

      const vehicleInfo = data.Response?.DataItems?.VehicleRegistration || {};
      const motInfo = data.Response?.DataItems?.MotHistory || {};
      const taxInfo = data.Response?.DataItems?.VehicleTaxDetails || {};
      const smmtDetails = data.Response?.DataItems?.SmmtDetails || {};
      const classificationDetails = data.Response?.DataItems?.ClassificationDetails || {};

      const model = smmtDetails.Range || vehicleInfo.Model?.split(' ')[0] || 'Unknown';
      const trim = classificationDetails?.Smmt?.Trim || null;
      const color = vehicleInfo.Colour
        ? vehicleInfo.Colour.charAt(0).toUpperCase() + vehicleInfo.Colour.slice(1).toLowerCase()
        : 'Unknown';

      const vehicleData = {
        registration: vrm,
        make: vehicleInfo.Make || 'Unknown',
        model,
        color,
        fuelType: vehicleInfo.FuelType || 'Unknown',
        year: vehicleInfo.YearOfManufacture || 'Unknown',
        engineSize: vehicleInfo.EngineCapacity ? `${vehicleInfo.EngineCapacity}cc` : 'Unknown',
        motStatus: motInfo.MotTestResult || 'Unknown',
        motExpiryDate: motInfo.ExpiryDate || null,
        taxStatus: taxInfo.TaxStatus || 'Unknown',
        taxDueDate: taxInfo.TaxDueDate || null,
        doorCount: vehicleInfo.NumberOfDoors || 'Unknown',
        bodyStyle: vehicleInfo.BodyStyle || 'Unknown',
        transmission: vehicleInfo.Transmission || 'Unknown',
        weight: vehicleInfo.GrossVehicleWeight ? `${vehicleInfo.GrossVehicleWeight}` : 'Unknown',
        trim
      };

      return new Response(
        JSON.stringify({ vehicle: vehicleData, success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    } catch (fetchError) {
      clearTimeout(timeoutId);
      const isTimeout = fetchError.name === 'AbortError';
      return new Response(
        JSON.stringify({
          error: isTimeout ? 'Request timed out' : 'Failed to retrieve vehicle data',
          success: false,
          code: isTimeout ? 'API_TIMEOUT' : 'API_REQUEST_FAILED',
          diagnostic: {
            error_type: fetchError.name,
            error_message: fetchError.message
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: isTimeout ? 504 : 500 }
      );
    }
  } catch (error) {
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
});
