import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.36.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const dealerSites = [
  { name: 'AutoTrader', baseUrl: 'https://www.autotrader.co.uk' },
  { name: 'Motors.co.uk', baseUrl: 'https://www.motors.co.uk' },
  { name: 'CarGurus', baseUrl: 'https://www.cargurus.co.uk' },
  { name: 'PistonHeads', baseUrl: 'https://www.pistonheads.com' },
  { name: 'Exchange And Mart', baseUrl: 'https://www.exchangeandmart.co.uk' },
  { name: 'Motorway', baseUrl: 'https://www.motorway.co.uk' },
  { name: 'Carsite', baseUrl: 'https://www.carsite.co.uk' },
  { name: 'Gumtree Motors', baseUrl: 'https://www.gumtree.com/cars' },
  { name: 'Parkers', baseUrl: 'https://www.parkers.co.uk' },
  { name: 'AA Cars', baseUrl: 'https://www.theaa.com/used-cars' },
];

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://wskiwwfgelypkrufsimz.supabase.co';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const requestData = await req.json().catch(() => ({}));
    const vehicleId = requestData.vehicle_id;
    
    console.log(`Car dealer scraper function called - Vehicle ID: ${vehicleId || 'ALL'}`);

    // If a specific vehicle ID is provided, only scrape for that vehicle
    if (vehicleId) {
      await scrapeForVehicle(supabase, vehicleId);
      return new Response(
        JSON.stringify({ success: true, message: `Successfully scraped for vehicle ${vehicleId}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Otherwise, scrape for all tracked vehicles (used by cron job)
    const { data: trackedCars, error } = await supabase
      .from('tracked_urls')
      .select('*');

    if (error) {
      throw new Error(`Failed to fetch tracked cars: ${error.message}`);
    }

    console.log(`Found ${trackedCars?.length || 0} tracked cars to process`);

    // Process each tracked car (limit to 50 for performance)
    const carsToProcess = trackedCars?.slice(0, 50) || [];
    for (const car of carsToProcess) {
      await scrapeForVehicle(supabase, car.id);
    }

    return new Response(
      JSON.stringify({ success: true, message: `Processed ${carsToProcess.length} vehicles` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in car dealer scraper:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function scrapeForVehicle(supabase, vehicleId) {
  try {
    // Get the vehicle details
    const { data: vehicle, error } = await supabase
      .from('tracked_urls')
      .select('*')
      .eq('id', vehicleId)
      .single();

    if (error || !vehicle) {
      console.error(`Error fetching vehicle ${vehicleId}:`, error);
      return;
    }

    // Parse vehicle details from URL format
    const carDetails = parseVehicleDetails(vehicle);
    console.log(`Processing ${carDetails.brand} ${carDetails.model} ${carDetails.year || ''}`);

    // Generate simulated scraped listings for demo purposes
    const scrapedListings = await simulateScrapedListings(carDetails);
    
    // Delete any existing listings for this vehicle
    await supabase
      .from('scraped_vehicle_listings')
      .delete()
      .eq('tracked_car_id', vehicleId);

    // Insert new listings
    if (scrapedListings.length > 0) {
      const { error: insertError } = await supabase
        .from('scraped_vehicle_listings')
        .insert(scrapedListings.map(listing => ({
          ...listing,
          tracked_car_id: vehicleId
        })));

      if (insertError) {
        console.error('Error inserting scraped listings:', insertError);
      } else {
        console.log(`Successfully inserted ${scrapedListings.length} listings for vehicle ${vehicleId}`);
      }

      // Update the cheapest price for the tracked car
      const cheapestListing = findCheapestListing(scrapedListings);
      if (cheapestListing) {
        const currentCheapestPrice = vehicle.cheapest_price || Infinity;
        const newCheapestPrice = cheapestListing.price;

        if (newCheapestPrice < currentCheapestPrice) {
          await supabase
            .from('tracked_urls')
            .update({ cheapest_price: newCheapestPrice })
            .eq('id', vehicleId);
          
          console.log(`Updated cheapest price for vehicle ${vehicleId} to ${newCheapestPrice}`);
        }
      }
    }
  } catch (error) {
    console.error(`Error processing vehicle ${vehicleId}:`, error);
  }
}

function parseVehicleDetails(vehicle) {
  const urlParts = vehicle.url.split('/');
  const brand = urlParts[0] || 'Unknown Brand';
  const model = urlParts[1] || 'Unknown Model';
  const engineType = urlParts[2] || '';
  
  let mileage;
  let year;
  let color;
  
  if (urlParts[3]) {
    const params = urlParts[3].split('&');
    params.forEach(param => {
      if (param.includes('mil=')) {
        mileage = param.split('mil=')[1];
      }
      if (param.includes('year=')) {
        year = param.split('year=')[1];
      }
      if (param.includes('color=')) {
        color = param.split('color=')[1];
      }
    });
  }
  
  return {
    brand,
    model,
    engineType,
    mileage: mileage ? parseInt(mileage) : null,
    year: year || null,
    color: color || null,
    lastPrice: vehicle.last_price
  };
}

function findCheapestListing(listings) {
  return listings.reduce((cheapest, current) => {
    return (!cheapest || current.price < cheapest.price) ? current : cheapest;
  }, null);
}

// In a real implementation, this would scrape actual websites
// For demo purposes, we're generating simulated results
async function simulateScrapedListings(carDetails) {
  const { brand, model, engineType, mileage, year, color } = carDetails;
  
  // Generate between 5-20 results
  const resultCount = Math.floor(Math.random() * 15) + 5;
  const results = [];
  
  for (let i = 0; i < resultCount; i++) {
    const dealerSite = dealerSites[Math.floor(Math.random() * dealerSites.length)];
    
    // Calculate mileage variation (±20%)
    const baseMileage = mileage || 30000;
    const mileageVariation = Math.floor(baseMileage * (Math.random() * 0.4 - 0.2));
    const resultMileage = Math.max(1000, baseMileage + mileageVariation);
    
    // Calculate price based on mileage and random variation
    const basePrice = (carDetails.lastPrice || 10000);
    const priceVariation = basePrice * (Math.random() * 0.3 - 0.15); // ±15%
    const resultPrice = Math.round(basePrice + priceVariation);
    
    // Generate random UK postcode
    const postcodes = ['B31 3XR', 'M1 1AE', 'EC1A 1BB', 'W1A 1AB', 'G1 1AA', 'L1 8JQ', 'NE1 1AD', 'CF10 1DD', 'BS1 1AD'];
    const postcode = postcodes[Math.floor(Math.random() * postcodes.length)];
    
    // Generate random coordinates around UK
    const lat = 51.5 + (Math.random() * 3) - 1.5;
    const lng = -0.9 + (Math.random() * 3) - 1.5;
    
    // Mark as cheapest if it's more than 10% below the original price
    const isCheapest = resultPrice < (basePrice * 0.9);
    
    // Generate vehicle colors if not specified
    const colors = ['Red', 'Blue', 'Black', 'White', 'Silver', 'Grey', 'Green'];
    const resultColor = color || colors[Math.floor(Math.random() * colors.length)];
    
    results.push({
      dealer_name: `${dealerSite.name} ${Math.floor(Math.random() * 1000)}`,
      url: `${dealerSite.baseUrl}/cars/${brand}/${model}/${Math.floor(Math.random() * 100000)}`,
      title: `${year || ''} ${brand} ${model} ${engineType} ${resultColor}`,
      price: resultPrice,
      mileage: resultMileage,
      year: year ? parseInt(year) : (2010 + Math.floor(Math.random() * 12)),
      color: resultColor,
      location: postcode,
      lat,
      lng,
      is_cheapest: isCheapest
    });
  }
  
  return results;
}
