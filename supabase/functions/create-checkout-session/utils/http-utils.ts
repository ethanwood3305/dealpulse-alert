
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export const getClientUrl = () => {
  const clientUrl = Deno.env.get("CLIENT_URL") || "http://localhost:5173";
  console.log("Using client URL:", clientUrl);
  return clientUrl;
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
