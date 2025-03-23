
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { v4 as uuidv4 } from "https://esm.sh/uuid@9.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Parse the request body
    const { userId } = await req.json();
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "User ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Check if the user has API access
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from("subscriptions")
      .select("has_api_access")
      .eq("user_id", userId)
      .single();
    
    if (subscriptionError) {
      return new Response(
        JSON.stringify({ error: "Failed to verify subscription" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!subscriptionData.has_api_access) {
      return new Response(
        JSON.stringify({ error: "User does not have API access" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Generate a new API key (UUID v4 + timestamp for uniqueness)
    const timestamp = Date.now().toString(36);
    const apiKey = `dpa_${uuidv4().replace(/-/g, "")}_${timestamp}`;
    
    // Update the user's subscription with the new API key
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({ api_key: apiKey })
      .eq("user_id", userId);
    
    if (updateError) {
      return new Response(
        JSON.stringify({ error: "Failed to update API key" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({ api_key: apiKey }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
