
// CORS headers
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Get client URL from environment
export const getClientUrl = (): string => {
  let client_url = Deno.env.get('CLIENT_URL') || 'http://localhost:5173';
  // Remove trailing slash if it exists
  return client_url.replace(/\/$/, '');
};

// Create error response
export const createErrorResponse = (error: Error, status = 500) => {
  console.error('Error:', error);
  return new Response(
    JSON.stringify({ error: error.message || 'Internal server error' }),
    {
      status: status,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    }
  );
};

// Create success response
export const createSuccessResponse = (data: any) => {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
};

// Create options response (for CORS preflight)
export const createOptionsResponse = () => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
};
