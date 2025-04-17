
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.36.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // CHANGED: Load and validate Supabase env vars (ready for future DB writes)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    console.log('[INIT] Supabase URL and Key loaded');
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('[INIT] Supabase client initialized');

    // Parse input JSON (expecting make, model, trim, colour, year, mileage)
    const { make, model, trim = '', colour = '', year, mileage } =
      (await req.json().catch(() => ({}))) as {
        make?: string;
        model?: string;
        trim?: string;
        colour?: string;
        year?: number;
        mileage?: number;
      };

    if (!make || !model || typeof year !== 'number' || typeof mileage !== 'number') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Required parameters: make (string), model (string), year (number), mileage (number)'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Compute ±2500 mileage range
    const minMileage = Math.max(0, mileage - 2500);
    const maxMileage = mileage + 2500;

    // GraphQL query & variables
    const query = `
      query SearchVehicles(
        $make: String!, $model: String!, $trim: String,
        $color: String, $year: Int!, $minMi: Int!, $maxMi: Int!
      ) {
        cars(filter: {
          make: { eq: $make },
          model: { eq: $model },
          trim: { eq: $trim },
          color: { eq: $color },
          year: { eq: $year },
          mileage: { between: [$minMi, $maxMi] }
        }) {
          id make model trim color year mileage price url
        }
      }
    `;
    const variables = {
      make,
      model,
      trim,
      color: colour, // CHANGED: use `colour` param as GraphQL `color`
      year,
      minMi: minMileage,
      maxMi: maxMileage
    };

    // CHANGED: retry logic with exponential backoff, dynamic UA
    const MAX_RETRIES = 3;
    let attempt = 0;
    let response: Response | null = null;

    while (attempt < MAX_RETRIES) {
      try {
        const userAgent = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${
          118 + attempt
        }.0.0.0 Safari/537.36`;
        response = await fetch('https://www.cazoo.co.uk/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': userAgent
          },
          body: JSON.stringify({ query, variables })
        });

        if (response.ok) break;
        const text = await response.text();
        console.warn(
          `[RETRY ${attempt + 1}] Cazoo API failed (status ${response.status}): ${text.slice(0, 200)}`
        );
      } catch (err) {
        console.error(`[RETRY ERROR ${attempt + 1}]`, err);
      }

      attempt++;
      // CHANGED: backoff delay
      await new Promise((r) => setTimeout(r, attempt * 1000));
    }

    if (!response || !response.ok) {
      throw new Error('Cazoo GraphQL request failed after retries');
    }

    // Parse and slice top 3
    const json = await response.json();
    const vehicles = json.data?.cars || [];
    const top3 = vehicles.slice(0, 3);

    console.log('[RESULT] Top 3 vehicles:', top3);

    return new Response(JSON.stringify({ success: true, data: top3 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('[ERROR] Cazoo scraper:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
