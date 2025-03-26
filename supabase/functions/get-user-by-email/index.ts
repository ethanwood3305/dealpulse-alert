
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log("============= GET USER BY EMAIL FUNCTION STARTED =============")
  console.log(`Request method: ${req.method}`)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight request")
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    // Get the request body
    const requestBody = await req.text()
    console.log(`Request body (raw): ${requestBody}`)
    
    const { email } = JSON.parse(requestBody)
    
    if (!email) {
      console.log("Error: Email is required but not provided")
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      )
    }
    
    console.log(`Searching for user with email: ${email}`)
    
    // Check environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    console.log(`SUPABASE_URL available: ${!!supabaseUrl}`)
    console.log(`SUPABASE_SERVICE_ROLE_KEY available: ${!!serviceRoleKey}`)
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing environment variables. Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.")
      throw new Error("Server configuration error: Missing environment variables")
    }
    
    // Create a Supabase client with the Admin key to bypass RLS
    console.log("Creating Supabase admin client")
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey
    )
    
    // Search for the user by email using admin privileges
    console.log("Calling auth.admin.getUserByEmail")
    const { data: user, error } = await supabaseAdmin.auth.admin.getUserByEmail(email)
    
    if (error) {
      console.error('Error finding user:', error)
      throw error
    }
    
    if (!user) {
      console.log('No user found with that email')
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 404 
        }
      )
    }
    
    console.log(`Found user with id: ${user.id}`)
    
    // Return only the necessary user information
    const responseData = { 
      id: user.id,
      email: user.email
    }
    
    console.log(`Returning response: ${JSON.stringify(responseData)}`)
    console.log("============= GET USER BY EMAIL FUNCTION COMPLETED =============")
    
    return new Response(
      JSON.stringify(responseData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error in get-user-by-email function:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})
