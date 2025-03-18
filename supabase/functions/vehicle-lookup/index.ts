
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
      const { data: brands, error: brandsError } = await supabaseClient
        .from('car_brands')
        .select('id, name')
        .order('name')

      if (brandsError) {
        console.error('Error fetching brands:', brandsError)
        throw brandsError
      }

      return new Response(
        JSON.stringify({ 
          brands: brands || []
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    } else if (req.method === 'POST') {
      const { brandId, modelId, registration } = await req.json()
      
      // If we have a registration, process DVLA lookup
      if (registration) {
        const dvlaApiKey = Deno.env.get('DVLA_API_KEY')
        if (!dvlaApiKey) {
          return new Response(
            JSON.stringify({ error: 'DVLA API key not configured' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          )
        }
        
        // Implement DVLA lookup logic here
        // This is a mock implementation since we don't have actual DVLA API access
        const registrationClean = registration.replace(/\s+/g, '').toUpperCase()
        
        // Mock data for demonstration purposes
        const vehicleData = {
          registration: registrationClean,
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
        }
        
        return new Response(
          JSON.stringify({ vehicle: vehicleData }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }
      
      // If we have a brandId, fetch models for that brand
      if (brandId) {
        console.log('Fetching models for brand ID:', brandId)
        const { data: models, error: modelsError } = await supabaseClient
          .from('car_models')
          .select('id, name')
          .eq('brand_id', brandId)
          .order('name')

        if (modelsError) {
          console.error('Error fetching models:', modelsError)
          throw modelsError
        }

        return new Response(
          JSON.stringify({ models: models || [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }
      
      // If we have a modelId, fetch engine types for that model
      if (modelId) {
        console.log('Fetching engine types for model ID:', modelId)
        const { data: engineTypes, error: engineTypesError } = await supabaseClient
          .from('engine_types')
          .select('id, name, fuel_type, capacity, power')
          .eq('model_id', modelId)
          .order('name')

        if (engineTypesError) {
          console.error('Error fetching engine types:', engineTypesError)
          throw engineTypesError
        }

        return new Response(
          JSON.stringify({ engineTypes: engineTypes || [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
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
