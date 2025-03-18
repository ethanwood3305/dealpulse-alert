import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('Vehicle lookup function called');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get the request data
    const body = await req.text();
    console.log('Request body:', body);
    
    const { registration } = JSON.parse(body);
    console.log('Parsed registration:', registration);
    
    if (!registration) {
      console.log('No registration provided');
      return new Response(
        JSON.stringify({ error: 'Registration number is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Parse the registration number to standard format
    const formattedReg = registration.trim().toUpperCase().replace(/\s/g, '')
    console.log('Formatted registration:', formattedReg);
    
    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    console.log('Supabase URL available:', !!supabaseUrl);
    console.log('Supabase key available:', !!supabaseKey);

    const supabaseAdmin = createClient(
      supabaseUrl ?? '',
      supabaseKey ?? ''
    )

    // Check if DVLA API key is available
    const dvlaApiKey = Deno.env.get('DVLA_API_KEY');
    console.log('DVLA API key available:', !!dvlaApiKey);
    let dvlaData = null;

    // If we have a DVLA API key, try to use the actual DVLA API
    if (dvlaApiKey) {
      try {
        console.log('Attempting DVLA API call for registration:', formattedReg);
        const dvlaResponse = await fetch('https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles', {
          method: 'POST',
          headers: {
            'x-api-key': dvlaApiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ registrationNumber: formattedReg })
        });

        console.log('DVLA API response status:', dvlaResponse.status);
        
        if (dvlaResponse.ok) {
          const responseData = await dvlaResponse.json();
          console.log('DVLA API response data:', responseData);
          
          // Transform DVLA data to our format
          dvlaData = {
            brand: responseData.make || 'Unknown',
            model: responseData.model || 'Unknown',
            engine_type: `${responseData.engineCapacity || ''} ${responseData.fuelType || ''}`.trim() || 'Unknown',
            mileage: 'N/A', // DVLA doesn't provide mileage
            registration: formattedReg,
            year: responseData.yearOfManufacture || 'Unknown',
            color: responseData.colour || 'Unknown'
          };
          console.log('Transformed DVLA data:', dvlaData);
        } else {
          const errorText = await dvlaResponse.text();
          console.error('DVLA API error response:', errorText);
          throw new Error(`DVLA API error: ${dvlaResponse.status} - ${errorText}`);
        }
      } catch (dvlaError) {
        console.error('Error calling DVLA API:', dvlaError);
      }
    } else {
      console.log('No DVLA API key available, will use mock data');
    }
    
    // If we got data from DVLA API, use it
    if (dvlaData) {
      console.log('Returning real DVLA data');
      return new Response(
        JSON.stringify(dvlaData),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }
    
    // Otherwise fall back to mock data
    console.log('Falling back to mock data');
    
    // Try database first
    const { data, error } = await supabaseAdmin.rpc(
      'get_vehicle_by_registration',
      { reg_number: formattedReg }
    )

    if (error) {
      console.error('Database function error:', error);
    } else {
      console.log('Database lookup result:', data);
    }

    // Initialize with default "not found" data
    let mockData = data?.[0] || {
      brand: 'Not Found',
      model: 'Not Found',
      engine_type: 'Not Found',
      mileage: '0',
      registration: formattedReg,
      year: 'Unknown',
      color: 'Unknown'
    }
    
    // Simulate different car data based on registration prefix
    if (formattedReg.startsWith('A')) {
      mockData = {
        brand: 'Audi',
        model: 'A4',
        engine_type: '2.0 TDI',
        mileage: '45000',
        registration: formattedReg,
        year: '2019',
        color: 'Black'
      }
    } else if (formattedReg.startsWith('B')) {
      mockData = {
        brand: 'BMW',
        model: '3 Series',
        engine_type: '320d 2.0L',
        mileage: '32000',
        registration: formattedReg,
        year: '2020',
        color: 'White'
      }
    } else if (formattedReg.startsWith('F')) {
      mockData = {
        brand: 'Ford',
        model: 'Fiesta',
        engine_type: 'EcoBoost 1.0',
        mileage: '28500',
        registration: formattedReg,
        year: '2018',
        color: 'Blue'
      }
    } else if (formattedReg.startsWith('T')) {
      mockData = {
        brand: 'Tesla',
        model: 'Model 3',
        engine_type: 'Electric Standard Range',
        mileage: '15000',
        registration: formattedReg,
        year: '2021',
        color: 'Red'
      }
    } else if (formattedReg.startsWith('V')) {
      mockData = {
        brand: 'Volkswagen',
        model: 'Golf',
        engine_type: '1.5 TSI',
        mileage: '50000',
        registration: formattedReg,
        year: '2017',
        color: 'Silver'
      }
    } else if (formattedReg.startsWith('M')) {
      mockData = {
        brand: 'Mercedes-Benz',
        model: 'C-Class',
        engine_type: 'C220d 2.0L',
        mileage: '35000',
        registration: formattedReg,
        year: '2020',
        color: 'Grey'
      }
    } else if (formattedReg.startsWith('H')) {
      mockData = {
        brand: 'Honda',
        model: 'Civic',
        engine_type: '1.5 VTEC Turbo',
        mileage: '22000',
        registration: formattedReg,
        year: '2019',
        color: 'Blue'
      }
    } else if (formattedReg.startsWith('L')) {
      mockData = {
        brand: 'Land Rover',
        model: 'Discovery',
        engine_type: '3.0 SDV6',
        mileage: '40000',
        registration: formattedReg,
        year: '2018',
        color: 'Green'
      }
    }

    console.log('Final response data:', mockData);

    return new Response(
      JSON.stringify(mockData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error in vehicle lookup:', error);
    
    return new Response(
      JSON.stringify({ error: 'Failed to lookup vehicle details', details: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
