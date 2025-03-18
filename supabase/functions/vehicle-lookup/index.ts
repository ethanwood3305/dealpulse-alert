
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Vehicle lookup function called with method: OPTIONS");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const DVLA_API_KEY = Deno.env.get('DVLA_API_KEY');
    if (!DVLA_API_KEY) {
      throw new Error('DVLA API key not configured');
    }

    const { registration } = await req.json();
    
    if (!registration) {
      return new Response(
        JSON.stringify({ error: 'Registration number is required' }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Example URL for the UK DVLA MOT history API
    const url = `https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles`;
    
    // Sanitize registration number (remove spaces, etc.)
    const sanitizedReg = registration.replace(/\s/g, '').toUpperCase();
    
    console.log(`Looking up vehicle with registration: ${sanitizedReg}`);
    
    // Make request to DVLA API
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'x-api-key': DVLA_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ registrationNumber: sanitizedReg })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`DVLA API error: ${response.status} - ${errorText}`);
      
      // Handle specific error cases
      if (response.status === 404) {
        return new Response(
          JSON.stringify({ error: 'Vehicle not found' }),
          { 
            status: 404, 
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          }
        );
      }
      
      throw new Error(`DVLA API error: ${response.status}`);
    }
    
    const vehicleData = await response.json();
    console.log(`Vehicle data retrieved successfully`);
    
    // Return the vehicle data with appropriate mapping/transformation
    return new Response(
      JSON.stringify({ 
        success: true,
        vehicle: {
          registration: vehicleData.registrationNumber,
          make: vehicleData.make,
          model: vehicleData.model || 'Unknown',
          color: vehicleData.colour || 'Unknown',
          fuelType: vehicleData.fuelType || 'Unknown',
          year: vehicleData.yearOfManufacture || 'Unknown',
          engineSize: vehicleData.engineCapacity ? `${vehicleData.engineCapacity}cc` : 'Unknown',
          motStatus: vehicleData.motStatus || 'Unknown',
          motExpiryDate: vehicleData.motExpiryDate || null,
          taxStatus: vehicleData.taxStatus || 'Unknown',
          taxDueDate: vehicleData.taxDueDate || null
        }
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error in vehicle-lookup function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
