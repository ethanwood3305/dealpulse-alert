
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.36.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    // Validate environment variables
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Parse request data
    const requestData = await req.json().catch(() => ({}));
    const vehicleId = requestData.vehicle_id;
    
    console.log(`Scraper triggered for Vehicle ID: ${vehicleId || 'ALL'}`);
    
    // Process single vehicle if ID provided
    if (vehicleId) {
      await scrapeForVehicle(supabase, vehicleId);
      return new Response(JSON.stringify({
        success: true,
        message: `Scraped vehicle ${vehicleId}`
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Batch process vehicles if no ID provided
    const { data: trackedCars, error } = await supabase.from('tracked_urls').select('*');
    if (error) throw new Error(error.message);
    
    // Limit batch size to prevent timeouts
    const carsToProcess = trackedCars?.slice(0, 50) || [];
    for (const car of carsToProcess) {
      await scrapeForVehicle(supabase, car.id);
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: `Processed ${carsToProcess.length} vehicles`
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Scraper error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error occurred'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});

async function scrapeForVehicle(supabase, vehicleId) {
  try {
    // Validate input
    if (!vehicleId) {
      console.error('Invalid vehicle ID provided');
      return;
    }

    // Fetch vehicle details
    const { data: vehicle, error } = await supabase.from('tracked_urls').select('*').eq('id', vehicleId).single();
    if (error || !vehicle) {
      console.error(`Error fetching vehicle ${vehicleId}:`, error);
      return;
    }
    
    // Get dealer postcode from user's subscription for location-based search
    const { data: subscriptionData } = await supabase
      .from('subscriptions')
      .select('dealer_postcode')
      .eq('user_id', vehicle.user_id)
      .single();
    
    // Default postcode if not found
    const dealerPostcode = subscriptionData?.dealer_postcode || 'b31 3xr';
    
    // Parse vehicle details from URL
    const carDetails = parseVehicleDetails(vehicle);
    console.log(`Scraping ${carDetails.brand} ${carDetails.model} ${carDetails.trim || ''} ${carDetails.year || ''}`);
    
    // Get scraped listings using user's preferred location
    const scrapedListings = await getVehicleListings(carDetails, dealerPostcode);
    console.log(`Found ${scrapedListings.length} listings for vehicle ${vehicleId}`);
    
    // Clear previous listings
    const { error: deleteError } = await supabase.from('scraped_vehicle_listings').delete().eq('tracked_car_id', vehicleId);
    if (deleteError) {
      console.error(`Error deleting previous listings for vehicle ${vehicleId}:`, deleteError);
    }
    
    if (scrapedListings.length > 0) {
      // Sort listings by price first, then by mileage for same price (lowest miles first)
      const sortedListings = [...scrapedListings].sort((a, b) => {
        // First sort by price (ascending)
        if (a.price !== b.price) {
          return a.price - b.price;
        }
        // If prices are equal, sort by mileage (ascending)
        return a.mileage - b.mileage;
      });
      
      // Find the cheapest listing (first in sorted array)
      const cheapestListing = sortedListings[0];
      
      // Take the top 3 listings (or all if less than 3)
      const top3Listings = sortedListings.slice(0, Math.min(3, sortedListings.length));
      
      // Mark the absolute cheapest as is_cheapest=true
      const listingsToInsert = top3Listings.map(listing => ({
        ...listing,
        tracked_car_id: vehicleId,
        is_cheapest: listing.price === cheapestListing.price && listing.mileage === cheapestListing.mileage
      }));
      
      // Insert the top 3 listings
      const { error: insertError } = await supabase
        .from('scraped_vehicle_listings')
        .insert(listingsToInsert);
      
      if (insertError) {
        console.error(`Error inserting listings for vehicle ${vehicleId}:`, insertError);
      } else {
        console.log(`Successfully inserted ${listingsToInsert.length} listings for vehicle ${vehicleId}`);
      }
      
      // Always update vehicle with the cheapest price found from scraping
      // regardless of the user's price (this ensures the "Cheapest" tag is accurate)
      const { error: updateError } = await supabase
        .from('tracked_urls')
        .update({ 
          cheapest_price: cheapestListing.price,
          last_checked: new Date().toISOString()
        })
        .eq('id', vehicleId);
      
      if (updateError) {
        console.error(`Error updating cheapest price for vehicle ${vehicleId}:`, updateError);
      } else {
        console.log(`Updated cheapest price for vehicle ${vehicleId} to £${cheapestListing.price}`);
      }
    } else {
      console.log(`No listings found for vehicle ${vehicleId}`);
      // Update last_checked timestamp even if no listings found
      await supabase
        .from('tracked_urls')
        .update({ last_checked: new Date().toISOString() })
        .eq('id', vehicleId);
    }
  } catch (err) {
    console.error(`Vehicle scrape error (${vehicleId}):`, err);
  }
}

function parseVehicleDetails(vehicle) {
  if (!vehicle || !vehicle.url) {
    console.error('Invalid vehicle data:', vehicle);
    return {
      brand: 'Unknown',
      model: 'Unknown',
      engineType: '',
      trim: '',
      mileage: 0,
      year: new Date().getFullYear(),
      color: '',
      lastPrice: null,
      engineSize: null
    };
  }

  const urlParts = vehicle.url.split('/');
  const brand = toProperCase(urlParts[0] || '');
  const model = toProperCase(urlParts[1] || '');
  const engineType = urlParts[2] || '';
  let mileage, year, color, trim, engineSize;
  
  if (urlParts[3]) {
    const params = urlParts[3].split('&');
    for (const param of params) {
      if (param.includes('mil=')) mileage = parseInt(param.split('mil=')[1]);
      if (param.includes('year=')) year = param.split('year=')[1];
      if (param.includes('color=')) color = toProperCase(param.split('color=')[1]);
      if (param.includes('trim=')) trim = toProperCase(param.split('trim=')[1]);
      if (param.includes('engine=')) {
        const cc = parseInt(param.split('engine=')[1]);
        engineSize = cc ? (cc / 1000).toFixed(2) : null;
      }
    }
  }
  
  return {
    brand,
    model,
    engineType,
    trim,
    mileage: mileage || 0,
    year: year || new Date().getFullYear().toString(),
    color: color || '',
    lastPrice: vehicle.last_price,
    engineSize: engineSize ? parseFloat(engineSize) : null
  };
}

function toProperCase(text) {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

async function getVehicleListings(carDetails, postcode = 'b31 3xr') {
  const baseUrl = 'https://www.autotrader.co.uk';

  if (!carDetails.brand || !carDetails.model) {
    console.error('Missing required vehicle details for scraping:', carDetails);
    return [];
  }

  const filters = [
    { filter: "make", selected: [carDetails.brand] },
    { filter: "model", selected: [carDetails.model] },
    { filter: "postcode", selected: [postcode] },
    { filter: "price_search_type", selected: ["total"] },
    { filter: "is_writeoff", selected: ["false"] }
  ];

  if (carDetails.trim) {
    filters.push({ filter: "aggregated_trim", selected: [carDetails.trim] });
  }

  if (carDetails.color) {
    filters.push({ filter: "colour", selected: [carDetails.color] });
  }

  if (carDetails.year) {
    filters.push({ filter: "min_year_manufactured", selected: [carDetails.year] });
    filters.push({ filter: "max_year_manufactured", selected: [carDetails.year] });
  }

  if (carDetails.mileage) {
    const min = Math.max(0, carDetails.mileage - 6000);
    const max = carDetails.mileage + 2000;
    filters.push({ filter: "min_mileage", selected: [String(min)] });
    filters.push({ filter: "max_mileage", selected: [String(max)] });
  }

  if (carDetails.engineSize) {
    const minEngine = (carDetails.engineSize - 0.02).toFixed(2);
    const maxEngine = (carDetails.engineSize + 0.02).toFixed(2);
    filters.push({ filter: "min_engine_size", selected: [minEngine] });
    filters.push({ filter: "max_engine_size", selected: [maxEngine] });
  }

  const payload = [{
    operationName: "SearchResultsListingsGridQuery",
    variables: {
      filters,
      channel: "cars",
      page: 1,
      sortBy: "price_asc",
      listingType: null,
      searchId: crypto.randomUUID()
    },
    query: `query SearchResultsListingsGridQuery(
      $filters: [FilterInput!]!,
      $channel: Channel!,
      $page: Int,
      $sortBy: SearchResultsSort,
      $listingType: [ListingType!],
      $searchId: String!
    ) {
      searchResults(input: {
        facets: [],
        filters: $filters,
        channel: $channel,
        page: $page,
        sortBy: $sortBy,
        listingType: $listingType,
        searchId: $searchId
      }) {
        listings {
          ... on SearchListing {
            title
            price
            vehicleLocation
            fpaLink
            badges {
              type
              displayText
            }
          }
        }
      }
    }`
  }];

  const MAX_RETRIES = 3;
  let retries = 0;
  let response;

  while (retries < MAX_RETRIES) {
    try {
      const userAgent = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${118 + retries}.0.0.0 Safari/537.36`;

      response = await fetch(`${baseUrl}/at-gateway?opname=SearchResultsListingsGridQuery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': userAgent,
          'x-sauron-app-name': 'sauron-search-results-app',
          'x-sauron-app-version': '3157'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) break;

      const body = await response.text();
      console.warn(`[RETRY] AutoTrader API failed (status ${response.status}): ${body.substring(0, 300)}`);
      retries++;
      await new Promise(r => setTimeout(r, retries * 1000));
    } catch (err) {
      console.error(`[RETRY ERROR]`, err);
      retries++;
      await new Promise(r => setTimeout(r, retries * 1000));
    }
  }

  if (!response || !response.ok) {
    console.error('[ERROR] AutoTrader API failed after all retries');
    return [];
  }

  const json = await response.json();
  const listings = json[0]?.data?.searchResults?.listings || [];

  return listings
    .filter(l => l.fpaLink && l.price)
    .map(l => {
      // Parse price
      let price = typeof l.price === 'string'
        ? parseInt(l.price.replace(/[^0-9]/g, ''), 10)
        : l.price;

      if (isNaN(price)) price = 0;

      // Extract mileage from badges
      let mileage = 0;
      const mileageBadge = l.badges?.find(b => b.type === 'MILEAGE');
      if (mileageBadge?.displayText) {
        const match = mileageBadge.displayText.match(/[\d,]+/);
        if (match) mileage = parseInt(match[0].replace(/,/g, ''), 10);
      }

      return {
        dealer_name: "AutoTrader",
        url: `${baseUrl}${l.fpaLink}`,
        title: l.title || `${carDetails.brand} ${carDetails.model}`,
        price: price,
        mileage: mileage || carDetails.mileage || 0,
        year: carDetails.year ? parseInt(carDetails.year) : new Date().getFullYear(),
        color: carDetails.color || 'Unknown',
        location: l.vehicleLocation || 'Unknown',
        lat: 51.5 + Math.random() * 3 - 1.5,
        lng: -0.9 + Math.random() * 3 - 1.5,
        is_cheapest: false
      };
    });
}
