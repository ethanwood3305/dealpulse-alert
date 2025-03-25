
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
      // Find the top 3 cheapest listings (or all if less than 3)
      const listingsToInsert = scrapedListings
        .sort((a, b) => a.price - b.price)
        .slice(0, 3)
        .map((listing, index) => ({
          ...listing,
          tracked_car_id: vehicleId,
          is_cheapest: index === 0 // Only the first listing (cheapest) gets marked as is_cheapest
        }));
        
      // Insert the top 3 cheapest listings
      const { error: insertError } = await supabase
        .from('scraped_vehicle_listings')
        .insert(listingsToInsert);
      
      if (insertError) {
        console.error(`Error inserting listings for vehicle ${vehicleId}:`, insertError);
      } else {
        console.log(`Successfully inserted ${listingsToInsert.length} listings for vehicle ${vehicleId}`);
      }
      
      // Update vehicle with the cheapest price found from scraping
      const cheapestListing = listingsToInsert[0];
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
  
  // Skip scraping if required details are missing
  if (!carDetails.brand || !carDetails.model) {
    console.error('Missing required vehicle details for scraping:', carDetails);
    return [];
  }

  // Build search filters with less restrictive parameters
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
      selected: [postcode]
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
  
  // Make optional filters less restrictive to increase chances of finding vehicles
  if (carDetails.trim) {
    // Add trim as a filter but make it case-insensitive
    filters.push({
      filter: "aggregated_trim",
      selected: [carDetails.trim]
    });
  }
  
  if (carDetails.color) {
    filters.push({
      filter: "colour",
      selected: [carDetails.color]
    });
  }
  
  if (carDetails.year) {
    // Wider range for year - include one year before and after
    const yearInt = parseInt(carDetails.year);
    filters.push({
      filter: "min_year_manufactured",
      selected: [(yearInt - 1).toString()]
    });
    filters.push({
      filter: "max_year_manufactured",
      selected: [(yearInt + 1).toString()]
    });
  }
  
  if (carDetails.mileage && carDetails.mileage > 0) {
    // Significantly increase the mileage range to find more matches
    const min = Math.max(0, carDetails.mileage - 10000); 
    const max = carDetails.mileage + 15000;
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
    // Increase engine size range
    const minEngine = Math.max(0, (carDetails.engineSize - 0.3).toFixed(2));
    const maxEngine = (carDetails.engineSize + 0.3).toFixed(2);
    filters.push({
      filter: "min_engine_size",
      selected: [String(minEngine)]
    });
    filters.push({
      filter: "max_engine_size",
      selected: [String(maxEngine)]
    });
  }
  
  // Build payload for AutoTrader API
  const payload = [{
    operationName: "SearchResultsListingsGridQuery",
    variables: {
      filters,
      channel: "cars",
      page: 1,
      sortBy: "price_asc", // Sort by lowest price first
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
            mileage
          }
        }
      }
    }`
  }];
  
  console.log('[DEBUG] AutoTrader search with filters:', JSON.stringify(filters, null, 2));
  
  try {
    // Implement retry mechanism
    const MAX_RETRIES = 3;
    let retries = 0;
    let response;
    
    while (retries <= MAX_RETRIES) {
      try {
        response = await fetch(`${baseUrl}/at-gateway?opname=SearchResultsListingsGridQuery`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'x-sauron-app-name': 'sauron-search-results-app',
            'x-sauron-app-version': '3157'
          },
          body: JSON.stringify(payload)
        });
        
        if (response.ok) break;
        
        console.log(`[RETRY] AutoTrader API attempt ${retries + 1}/${MAX_RETRIES} failed with status: ${response.status}`);
        retries++;
        
        // Add exponential backoff
        if (retries <= MAX_RETRIES) {
          await new Promise(r => setTimeout(r, retries * 1500));
        }
      } catch (error) {
        console.error(`[RETRY ERROR] AutoTrader API attempt ${retries + 1}/${MAX_RETRIES}:`, error);
        retries++;
        
        if (retries <= MAX_RETRIES) {
          await new Promise(r => setTimeout(r, retries * 1500));
        } else {
          throw error;
        }
      }
    }
    
    if (!response || !response.ok) {
      console.error('[ERROR] AutoTrader API failed after retries');
      return [];
    }
    
    const json = await response.json();
    
    // Log the full response for debugging
    console.log('[DEBUG] AutoTrader API response:', JSON.stringify(json).slice(0, 1000) + '...');
    
    const listings = json[0]?.data?.searchResults?.listings || [];
    console.log('[DEBUG] Found results:', listings.length);
    
    // Map raw listings to our format
    return listings
      .filter(l => l.fpaLink && l.price)
      .map(l => {
        // Normalize price to ensure it's a number
        let price = l.price;
        if (typeof price === 'string') {
          // Remove £ symbol, commas, and other non-numeric characters
          price = parseInt(price.replace(/[^0-9.]/g, ''), 10);
        }
        
        if (isNaN(price)) {
          price = 0;
          console.log('[WARNING] Invalid price found in listing:', l);
        }
        
        // Extract mileage
        let mileage = carDetails.mileage || 30000;
        if (l.mileage) {
          if (typeof l.mileage === 'string') {
            // Extract numbers from string like "61,721 miles"
            const match = l.mileage.match(/(\d+,?\d*)/);
            if (match && match[1]) {
              mileage = parseInt(match[1].replace(/,/g, ''), 10);
            }
          } else if (typeof l.mileage === 'number') {
            mileage = l.mileage;
          }
        }
        
        // Extract location details
        const location = l.vehicleLocation || 'Unknown';
        
        return {
          dealer_name: "AutoTrader",
          url: `${baseUrl}${l.fpaLink}`,
          title: l.title || `${carDetails.brand} ${carDetails.model}`,
          price: price,
          mileage: mileage,
          year: parseInt(carDetails.year) || new Date().getFullYear(),
          color: carDetails.color || 'Unknown',
          location: location,
          lat: 51.5 + Math.random() * 3 - 1.5, // Generate random coordinates for map view
          lng: -0.9 + Math.random() * 3 - 1.5, // These should ideally be based on actual location
          is_cheapest: false // This will be set correctly before insertion
        };
      });
  } catch (error) {
    console.error('[ERROR] AutoTrader API:', error);
    return [];
  }
}
