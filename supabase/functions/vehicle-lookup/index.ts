
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
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
    // Get the request data
    const { registration } = await req.json()
    
    if (!registration) {
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
    
    // Create a Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // In a real implementation, we would call the DVLA API here
    // For now, we'll use our mock data function in the database
    
    // Call the database function to get vehicle data
    const { data, error } = await supabaseAdmin.rpc(
      'get_vehicle_by_registration',
      { reg_number: formattedReg }
    )

    if (error) {
      console.error('Error calling database function:', error)
      throw error
    }

    // Mock different responses based on registration patterns
    let mockData = data[0]
    
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
    }

    console.log(`Vehicle lookup response for ${formattedReg}:`, mockData)

    return new Response(
      JSON.stringify(mockData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error in vehicle lookup:', error)
    
    return new Response(
      JSON.stringify({ error: 'Failed to lookup vehicle details' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
