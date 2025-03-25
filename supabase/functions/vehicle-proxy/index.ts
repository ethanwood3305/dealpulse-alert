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
      return jsonResponse({ error: 'Missing API key', success: false, code: 'MISSING_API_KEY' }, 500);
    }

    const body = await req.text();
    let parsed: { vrm: string };

    try {
      parsed = JSON.parse(body);
    } catch {
      return jsonResponse({ error: 'Invalid JSON', success: false, code: 'INVALID_JSON' }, 400);
    }

    const vrm = parsed?.vrm?.trim().toUpperCase();
    if (!vrm) {
      return jsonResponse({ error: 'Missing VRM', success: false, code: 'MISSING_VRM' }, 400);
    }

    const url = new URL(API_ENDPOINT);
    url.searchParams.set('v', '2');
    url.searchParams.set('api_nullitems', '1');
    url.searchParams.set('auth_apikey', UKVEHICLEDATA_API_KEY);
    url.searchParams.set('key_VRM', vrm);
    url.searchParams.set('key_VehicleData', 'Yes');
    url.searchParams.set('key_MOTData', 'Yes');
    url.searchParams.set('key_TaxStatusData', 'Yes');
    url.searchParams.set('user_tag', 'supabase_edge');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errorText = await res.text();
      return jsonResponse({
        error: `API returned ${res.status}`,
        success: false,
        code: 'API_HTTP_ERROR',
        statusCode: res.status,
        responseText: errorText,
      }, 502);
    }

    const data = await res.json();

    if (data.Response?.StatusCode !== 'Success') {
      console.log(data);
      const message = data.Response?.StatusMessage || 'Vehicle lookup failed';
      const code = message.includes('No vehicle found') ? 'VEHICLE_NOT_FOUND' : 'API_ERROR';
      return jsonResponse({ error: message, success: false, code, apiResponse: data.Response }, 404);
      
    }

    const v = data.Response.DataItems;
    const reg = v?.VehicleRegistration || {};
    const smmt = v?.SmmtDetails || {};
    const classif = v?.ClassificationDetails || {};
    const mot = v?.MotHistory || {};
    const tax = v?.VehicleTaxDetails || {};
    const tech = v?.TechnicalDetails || {};

    const vehicle = {
  registration: vrm,
  make: reg.Make || 'Unknown',
  model: smmt.Range || reg.Model?.split(' ')[0] || 'Unknown',
  color: reg.Colour ? reg.Colour.charAt(0).toUpperCase() + reg.Colour.slice(1).toLowerCase() : 'Unknown',
  fuelType: reg.FuelType || 'Unknown',
  year: reg.YearOfManufacture || 'Unknown',
  engineSize: reg.EngineCapacity ? `${reg.EngineCapacity}cc` : 'Unknown',
  motStatus: mot.MotTestResult || 'Unknown',
  motExpiryDate: mot.ExpiryDate || null,
  taxStatus: tax.TaxStatus || 'Unknown',
  taxDueDate: tax.TaxDueDate || null,
  doorCount: smmt.NumberOfDoors || 'Unknown',
  bodyStyle: smmt.BodyStyle || 'Unknown',
  transmission: reg.Transmission || 'Unknown',
  weight: tech.Dimensions?.GrossVehicleWeight
    ? `${tech.Dimensions.GrossVehicleWeight} kg`
    : 'Unknown',

  trim:
  classif?.Smmt?.Trim?.trim() ||
  (typeof classif?.Dvla?.Model === 'string'
    ? classif.Dvla.Model
        .split(' ')
        .slice(1) // skip the model name (first word)
        .filter(w => !/^(ISG|MHEV|PHEV|DCT|T-GDi|GDi|CRDi)$/i.test(w)) // remove suffixes
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()) // format like "2 Nav"
        .join(' ')
        .trim()
    : null) ||
  null,



};

    console.log(vehicle.trim);

    return jsonResponse({ vehicle, success: true }, 200);
  } catch (error) {
    const e = error as Error;
    const isTimeout = e.name === 'AbortError';
    return jsonResponse({
      error: isTimeout ? 'Request timed out' : 'Unexpected error',
      success: false,
      code: isTimeout ? 'API_TIMEOUT' : 'INTERNAL_ERROR',
      diagnostic: {
        error_type: e.name,
        error_message: e.message,
        stack: e.stack,
      },
    }, isTimeout ? 504 : 500);
  }
});

function jsonResponse(obj: object, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });
}
