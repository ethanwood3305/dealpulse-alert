
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
    
    // Expanded mock data with more detailed variants and specifications
    if (formattedReg.startsWith('A')) {
      mockData = {
        brand: 'Audi',
        model: 'A4',
        engine_type: '2.0 TDI quattro 204HP',
        mileage: '45000',
        registration: formattedReg,
        year: '2019',
        color: 'Black'
      }
    } else if (formattedReg.startsWith('B')) {
      mockData = {
        brand: 'BMW',
        model: '3 Series',
        engine_type: '320d xDrive M Sport 190HP',
        mileage: '32000',
        registration: formattedReg,
        year: '2020',
        color: 'Alpine White'
      }
    } else if (formattedReg.startsWith('F')) {
      mockData = {
        brand: 'Ford',
        model: 'Focus',
        engine_type: '2.3 EcoBoost ST 280HP',
        mileage: '28500',
        registration: formattedReg,
        year: '2018',
        color: 'Ford Performance Blue'
      }
    } else if (formattedReg.startsWith('T')) {
      mockData = {
        brand: 'Tesla',
        model: 'Model 3',
        engine_type: 'Performance Dual Motor AWD 455HP',
        mileage: '15000',
        registration: formattedReg,
        year: '2021',
        color: 'Red Multi-Coat'
      }
    } else if (formattedReg.startsWith('V')) {
      mockData = {
        brand: 'Volkswagen',
        model: 'Golf',
        engine_type: '2.0 TSI GTI Clubsport 300HP',
        mileage: '22000',
        registration: formattedReg,
        year: '2020',
        color: 'Oryx White Pearl'
      }
    } else if (formattedReg.startsWith('M')) {
      mockData = {
        brand: 'Mercedes-Benz',
        model: 'C-Class',
        engine_type: 'C43 AMG 4MATIC 390HP',
        mileage: '35000',
        registration: formattedReg,
        year: '2020',
        color: 'Designo Selenite Grey Magno'
      }
    } else if (formattedReg.startsWith('H')) {
      mockData = {
        brand: 'Honda',
        model: 'Civic',
        engine_type: '2.0 VTEC Turbo Type R 320HP',
        mileage: '22000',
        registration: formattedReg,
        year: '2019',
        color: 'Championship White'
      }
    } else if (formattedReg.startsWith('L')) {
      mockData = {
        brand: 'Land Rover',
        model: 'Defender',
        engine_type: 'P400e Plug-in Hybrid 404HP',
        mileage: '18000',
        registration: formattedReg,
        year: '2021',
        color: 'Pangea Green'
      }
    } else if (formattedReg.startsWith('P')) {
      mockData = {
        brand: 'Porsche',
        model: '911',
        engine_type: 'Carrera S 3.0L 450HP',
        mileage: '12500',
        registration: formattedReg,
        year: '2022',
        color: 'Gentian Blue Metallic'
      }
    } else if (formattedReg.startsWith('S')) {
      mockData = {
        brand: 'Subaru',
        model: 'WRX',
        engine_type: 'STI 2.5L Turbo 310HP',
        mileage: '30200',
        registration: formattedReg,
        year: '2019',
        color: 'WR Blue Pearl'
      }
    } else if (formattedReg.startsWith('K')) {
      mockData = {
        brand: 'Kia',
        model: 'Stinger',
        engine_type: 'GT S 3.3 T-GDi 365HP',
        mileage: '25800',
        registration: formattedReg,
        year: '2020',
        color: 'Ceramic Grey'
      }
    } else if (formattedReg.startsWith('G')) {
      mockData = {
        brand: 'Mazda',
        model: 'MX-5',
        engine_type: '2.0L Skyactiv-G 184HP',
        mileage: '15600',
        registration: formattedReg,
        year: '2021',
        color: 'Soul Red Crystal'
      }
    } else if (formattedReg.startsWith('J')) {
      mockData = {
        brand: 'Jaguar',
        model: 'F-TYPE',
        engine_type: 'R 5.0 V8 Supercharged 575HP',
        mileage: '20400',
        registration: formattedReg,
        year: '2020',
        color: 'British Racing Green'
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
