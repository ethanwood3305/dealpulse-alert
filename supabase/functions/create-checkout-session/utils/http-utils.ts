
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export const getClientUrl = () => {
  const clientUrl = Deno.env.get("CLIENT_URL") || "http://localhost:5173";
  // Ensure URL doesn't end with a slash
  const normalizedUrl = clientUrl.endsWith('/') ? clientUrl.slice(0, -1) : clientUrl;
  console.log("Using client URL:", normalizedUrl);
  return normalizedUrl;
};

export const createErrorResponse = (error: Error) => {
  console.error("Error:", error);
  return new Response(
    JSON.stringify({ 
      error: error.message || "An error occurred",
      details: error.stack
    }),
    {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    }
  );
};

export const createSuccessResponse = (data: any) => {
  return new Response(
    JSON.stringify(data),
    {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    }
  );
};

export const createOptionsResponse = () => {
  return new Response(null, { headers: corsHeaders, status: 204 });
};
