
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log("[INIT] Get Scraped Listings function started")
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    // Parse the request body
    const { carId } = await req.json()
    
    console.log(`[INPUT] Car ID received: ${carId}`)
    
    if (!carId) {
      throw new Error('Missing car ID in request')
    }
    
    // Get the Supabase URL and service role key from environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseApiKey = Deno.env.get('SUPABASE_ANON_KEY')
    
    if (!supabaseUrl || !supabaseApiKey) {
      throw new Error('Missing environment variables. Make sure SUPABASE_URL and SUPABASE_ANON_KEY are set.')
    }
    
    console.log("[INIT] Creating Supabase client")
    // Create a Supabase client for authenticated requests
    const supabase = createClient(supabaseUrl, supabaseApiKey)
    
    // Get the user's JWT token from authorization header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }
    
    // Set the auth token for the client
    const token = authHeader.replace('Bearer ', '')
    supabase.auth.setSession({
      access_token: token,
      refresh_token: ''
    })
    
    // Call the RPC function to get scraped listings for this car
    console.log(`[EXEC] Calling RPC function get_scraped_listings_for_car for car ID: ${carId}`)
    const { data, error } = await supabase.rpc('get_scraped_listings_for_car', {
      car_id: carId
    })
    
    if (error) {
      console.error("[ERROR] Error fetching scraped listings:", error)
      throw error
    }
    
    const listingsCount = data?.length || 0
    console.log(`[SUCCESS] Retrieved ${listingsCount} listings for car ID: ${carId}`)
    
    return new Response(
      JSON.stringify({ success: true, listings: data || [] }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error("[FATAL] Error in get-scraped-listings function:", error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
