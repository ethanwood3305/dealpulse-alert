
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
    
    // Drop existing problematic policies
    console.log("[EXEC] Dropping existing policies")
    await supabase.rpc('reset_organization_rls_policies')
    
    // Create the security definer function to check organization membership
    console.log("[EXEC] Creating security definer function")
    await supabase.rpc('create_user_is_org_member_function')
    
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
