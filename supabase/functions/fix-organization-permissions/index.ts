
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log("[INIT] Fix Organization Permissions function started")
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    // Get the Supabase URL and service role key from environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing environment variables. Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.')
    }
    
    console.log("[INIT] Creating admin Supabase client")
    // Create a Supabase client with the service role key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    
    // Reset existing problematic policies
    console.log("[EXEC] Dropping existing RLS policies")
    const { error: dropError } = await supabase.rpc('reset_organization_rls_policies')
    
    if (dropError) {
      console.error("[ERROR] Failed to drop existing policies:", dropError)
      throw dropError
    }
    
    // Apply new RLS policies
    console.log("[EXEC] Applying RLS policies")
    const { error: applyError } = await supabase.rpc('apply_organization_rls_policies')
    
    if (applyError) {
      console.error("[ERROR] Failed to apply RLS policies:", applyError)
      throw applyError
    }
    
    console.log("[SUCCESS] Successfully fixed organization permissions")
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Organization permissions fixed successfully" 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error("[FATAL] Error in fix-organization-permissions function:", error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
