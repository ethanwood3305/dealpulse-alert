
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    console.log("Starting migration of car organizations...")
    
    // Get all tracked cars without an organization
    const { data: carsWithoutOrg, error: carsError } = await supabaseClient
      .from('tracked_urls')
      .select('id, user_id')
      .is('organization_id', null)
    
    if (carsError) {
      throw carsError
    }

    console.log(`Found ${carsWithoutOrg.length} cars without organizations`)

    // Process each car
    for (const car of carsWithoutOrg) {
      // Find user's organizations
      const { data: orgs, error: orgsError } = await supabaseClient
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', car.user_id)
        .limit(1)
      
      if (orgsError) {
        console.error(`Error getting organization for user ${car.user_id}:`, orgsError)
        continue
      }
      
      if (!orgs || orgs.length === 0) {
        console.log(`Creating organization for user ${car.user_id}`)
        
        // Get user's email to name the organization
        const { data: userData, error: userError } = await supabaseClient
          .from('auth.users')
          .select('email')
          .eq('id', car.user_id)
          .single()
        
        let orgName = 'Dealer Organization'
        if (!userError && userData) {
          orgName = `Dealer - ${userData.email}`
        }
        
        // Create new organization
        const { data: newOrg, error: createOrgError } = await supabaseClient
          .from('organizations')
          .insert({ name: orgName })
          .select()
          .single()
        
        if (createOrgError) {
          console.error(`Error creating organization for user ${car.user_id}:`, createOrgError)
          continue
        }
        
        // Add user to organization
        const { error: addUserError } = await supabaseClient
          .from('organization_members')
          .insert({
            user_id: car.user_id,
            organization_id: newOrg.id,
            role: 'admin'
          })
        
        if (addUserError) {
          console.error(`Error adding user ${car.user_id} to organization:`, addUserError)
          continue
        }
        
        // Update car with new organization
        const { error: updateCarError } = await supabaseClient
          .from('tracked_urls')
          .update({ organization_id: newOrg.id })
          .eq('id', car.id)
        
        if (updateCarError) {
          console.error(`Error updating car ${car.id} with organization:`, updateCarError)
          continue
        }
        
        console.log(`Created organization ${newOrg.id} for user ${car.user_id} and updated car ${car.id}`)
      } else {
        // Update car with existing organization
        const { error: updateCarError } = await supabaseClient
          .from('tracked_urls')
          .update({ organization_id: orgs[0].organization_id })
          .eq('id', car.id)
        
        if (updateCarError) {
          console.error(`Error updating car ${car.id} with organization:`, updateCarError)
          continue
        }
        
        console.log(`Updated car ${car.id} with organization ${orgs[0].organization_id}`)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Migration complete. Processed ${carsWithoutOrg.length} cars.` 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    )
  } catch (error) {
    console.error("Error in migration:", error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    )
  }
})
