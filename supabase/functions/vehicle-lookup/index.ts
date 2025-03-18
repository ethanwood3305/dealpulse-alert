
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('Vehicle lookup function called with method:', req.method);
  console.log('Request headers:', Object.fromEntries(req.headers.entries()));

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { 
      headers: corsHeaders,
      status: 200
    });
  }

  try {
    // Parse the request body
    const contentType = req.headers.get('content-type');
    console.log('Content-Type:', contentType);

    let registration;
    if (contentType?.includes('application/json')) {
      const jsonData = await req.json();
      registration = jsonData.registration;
    } else {
      const textData = await req.text();
      console.log('Raw request body:', textData);
      try {
        const jsonData = JSON.parse(textData);
        registration = jsonData.registration;
      } catch (e) {
        console.error('Error parsing request body:', e);
        registration = null;
      }
    }

    console.log('Parsed registration:', registration);
    
    if (!registration) {
      console.log('No registration provided');
      return new Response(
        JSON.stringify({ error: 'Registration number is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Parse the registration number to standard format
    const formattedReg = registration.trim().toUpperCase().replace(/\s/g, '');
    console.log('Formatted registration:', formattedReg);
    
    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    console.log('Supabase URL available:', !!supabaseUrl);
    console.log('Supabase key available:', !!supabaseKey);

    const supabaseAdmin = createClient(
      supabaseUrl ?? '',
      supabaseKey ?? ''
    );

    console.log('Using mock data instead of DVLA API');
    
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
