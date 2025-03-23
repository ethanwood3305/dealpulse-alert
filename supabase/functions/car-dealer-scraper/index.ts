
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.36.0';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const requestData = await req.json().catch(() => ({}));
    const vehicleId = requestData.vehicle_id;
    
    console.log(`Scraper triggered for Vehicle ID: ${vehicleId || 'ALL'}`);
    
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
    
    const { data: trackedCars, error } = await supabase.from('tracked_urls').select('*');
    if (error) throw new Error(error.message);
    
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
      error: error.message
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
    const { data: vehicle, error } = await supabase.from('tracked_urls').select('*').eq('id', vehicleId).single();
    if (error || !vehicle) {
      console.error(`Error fetching vehicle ${vehicleId}:`, error);
      return;
    }
    
    const carDetails = parseVehicleDetails(vehicle);
    console.log(`Scraping ${carDetails.brand} ${carDetails.model} ${carDetails.trim || ''} ${carDetails.year || ''}`);
    
    // Get scraped listings
    const scrapedListings = await getVehicleListings(carDetails);
    console.log(`Found ${scrapedListings.length} listings for vehicle ${vehicleId}`);
    
    // Clear previous listings
    const { error: deleteError } = await supabase.from('scraped_vehicle_listings').delete().eq('tracked_car_id', vehicleId);
    if (deleteError) {
      console.error(`Error deleting previous listings for vehicle ${vehicleId}:`, deleteError);
    }
    
    if (scrapedListings.length > 0) {
      // Find the cheapest listing
      const cheapestListing = scrapedListings.reduce((a, b) => a.price < b.price ? a : b);
      
      // Mark the cheapest listing
      const listingsToInsert = scrapedListings.map(listing => ({
        ...listing,
        tracked_car_id: vehicleId,
        is_cheapest: listing.price === cheapestListing.price
      }));
      
      // Insert all listings
      const { data: insertedData, error: insertError } = await supabase
        .from('scraped_vehicle_listings')
        .insert(listingsToInsert)
        .select();
      
      if (insertError) {
        console.error(`Error inserting listings for vehicle ${vehicleId}:`, insertError);
      } else {
        console.log(`Successfully inserted ${insertedData?.length || 0} listings for vehicle ${vehicleId}`);
      }
      
      // Update vehicle's cheapest price if found a better deal
      if (cheapestListing && cheapestListing.price < (vehicle.cheapest_price || Infinity)) {
        const { error: updateError } = await supabase
          .from('tracked_urls')
          .update({ cheapest_price: cheapestListing.price })
          .eq('id', vehicleId);
        
        if (updateError) {
          console.error(`Error updating cheapest price for vehicle ${vehicleId}:`, updateError);
        } else {
          console.log(`Updated cheapest price for vehicle ${vehicleId} to £${cheapestListing.price}`);
        }
      }
    } else {
      console.log(`No listings found for vehicle ${vehicleId}`);
    }
  } catch (err) {
    console.error(`Vehicle scrape error (${vehicleId}):`, err);
  }
}

function parseVehicleDetails(vehicle) {
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
    mileage,
    year,
    color,
    lastPrice: vehicle.last_price,
    engineSize: engineSize ? parseFloat(engineSize) : null
  };
}

function toProperCase(text) {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

async function getVehicleListings(carDetails) {
  const baseUrl = 'https://www.autotrader.co.uk';
  const filters = [
    {
      filter: "make",
      selected: [carDetails.brand]
    },
    {
      filter: "model",
      selected: [carDetails.model]
    },
    {
      filter: "postcode",
      selected: ["b31 3xr"]
    },
    {
      filter: "price_search_type",
      selected: ["total"]
    },
    {
      filter: "is_writeoff",
      selected: ["false"]
    }
  ];
  
  if (carDetails.trim) filters.push({
    filter: "aggregated_trim",
    selected: [carDetails.trim]
  });
  
  if (carDetails.color) filters.push({
    filter: "colour",
    selected: [carDetails.color]
  });
  
  if (carDetails.year) {
    filters.push({
      filter: "min_year_manufactured",
      selected: [carDetails.year]
    });
    filters.push({
      filter: "max_year_manufactured",
      selected: [carDetails.year]
    });
  }
  
  if (carDetails.mileage) {
    const min = Math.max(0, carDetails.mileage - 2000);
    const max = carDetails.mileage + 2000;
    filters.push({
      filter: "min_mileage",
      selected: [String(min)]
    });
    filters.push({
      filter: "max_mileage",
      selected: [String(max)]
    });
  }
  
  if (carDetails.engineSize) {
    const minEngine = (carDetails.engineSize - 0.01).toFixed(2); // 1.24 becomes 1.23
    const maxEngine = (carDetails.engineSize + 0.01).toFixed(2); // 1.24 becomes 1.25
    filters.push({
      filter: "min_engine_size",
      selected: [String(minEngine)]
    });
    filters.push({
      filter: "max_engine_size",
      selected: [String(maxEngine)]
    });
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
    query: `query SearchResultsListingsGridQuery($filters: [FilterInput!]!, $channel: Channel!, $page: Int, $sortBy: SearchResultsSort, $listingType: [ListingType!], $searchId: String!) {
      searchResults(input: {facets: [], filters: $filters, channel: $channel, page: $page, sortBy: $sortBy, listingType: $listingType, searchId: $searchId}) {
        listings {
          ... on SearchListing {
            title
            price
            vehicleLocation
            fpaLink
          }
        }
      }
    }`
  }];
  
  console.log('[DEBUG] Payload:', JSON.stringify(payload, null, 2));
  
  try {
    const response = await fetch(`${baseUrl}/at-gateway?opname=SearchResultsListingsGridQuery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0',
        'x-sauron-app-name': 'sauron-search-results-app',
        'x-sauron-app-version': '3157'
      },
      body: JSON.stringify(payload)
    });
    
    const json = await response.json();
    console.log('[DEBUG] Found results:', json[0]?.data?.searchResults?.listings?.length || 0);
    
    const listings = json[0]?.data?.searchResults?.listings || [];
    
    return listings
      .filter(l => l.fpaLink && l.price)
      .map(l => ({
        dealer_name: "AutoTrader",
        url: `${baseUrl}${l.fpaLink}`,
        title: l.title,
        price: l.price,
        mileage: carDetails.mileage || 30000,
        year: carDetails.year || new Date().getFullYear(),
        color: carDetails.color || 'Unknown',
        location: l.vehicleLocation || 'Unknown',
        lat: 51.5 + Math.random() * 3 - 1.5,
        lng: -0.9 + Math.random() * 3 - 1.5,
        is_cheapest: false // This will be set correctly before insertion
      }));
  } catch (error) {
    console.error('[ERROR] AutoTrader API:', error);
    return [];
  }
}
