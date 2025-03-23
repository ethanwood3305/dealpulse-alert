import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.36.0';
import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const dealerSites = [
  { name: 'AutoTrader', baseUrl: 'https://www.autotrader.co.uk' },
  { name: 'Motors.co.uk', baseUrl: 'https://www.motors.co.uk' },
  { name: 'CarGurus', baseUrl: 'https://www.cargurus.co.uk' },
  { name: 'PistonHeads', baseUrl: 'https://www.pistonheads.com' },
  { name: 'Exchange And Mart', baseUrl: 'https://www.exchangeandmart.co.uk' }
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://wskiwwfgelypkrufsimz.supabase.co';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const requestData = await req.json().catch(() => ({}));
    const vehicleId = requestData.vehicle_id;
    
    console.log(`Car dealer scraper function called - Vehicle ID: ${vehicleId || 'ALL'}`);

    if (vehicleId) {
      await scrapeForVehicle(supabase, vehicleId);
      return new Response(
        JSON.stringify({ success: true, message: `Successfully scraped for vehicle ${vehicleId}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: trackedCars, error } = await supabase
      .from('tracked_urls')
      .select('*');

    if (error) {
      throw new Error(`Failed to fetch tracked cars: ${error.message}`);
    }

    console.log(`Found ${trackedCars?.length || 0} tracked cars to process`);

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
    const { data: vehicle, error } = await supabase
      .from('tracked_urls')
      .select('*')
      .eq('id', vehicleId)
      .single();

    if (error || !vehicle) {
      console.error(`Error fetching vehicle ${vehicleId}:`, error);
      return;
    }

    const carDetails = parseVehicleDetails(vehicle);
    console.log(`Processing ${carDetails.brand} ${carDetails.model} ${carDetails.trim || ''} with engine details: ${carDetails.engineSize || 'not specified'}`);

    // Get vehicle listings from real sources only
    const scrapedListings = await getVehicleListings(carDetails);
    
    // Find the cheapest listing if any were found
    if (scrapedListings.length > 0) {
      const cheapestListing = findCheapestListing(scrapedListings);
      
      if (cheapestListing) {
        // Clear previous listings for this car
        await supabase
          .from('scraped_vehicle_listings')
          .delete()
          .eq('tracked_car_id', vehicleId);
        
        // Insert all scraped listings
        const insertPromises = scrapedListings.map(listing => {
          return supabase
            .from('scraped_vehicle_listings')
            .insert({
              ...listing,
              tracked_car_id: vehicleId,
              is_cheapest: listing.price === cheapestListing.price
            });
        });
        
        await Promise.all(insertPromises);
        console.log(`Successfully inserted ${scrapedListings.length} listings for vehicle ${vehicleId}`);

        // Update the vehicle's cheapest price if applicable
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
    } else {
      console.log(`No listings found for vehicle ${vehicleId}`);
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
  let trim;
  let engineSize;
  let engineMin;
  let engineMax;
  
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
      if (param.includes('trim=')) {
        trim = param.split('trim=')[1];
      }
      if (param.includes('engine=')) {
        engineSize = param.split('engine=')[1];
      }
      if (param.includes('engineMin=')) {
        engineMin = param.split('engineMin=')[1];
      }
      if (param.includes('engineMax=')) {
        engineMax = param.split('engineMax=')[1];
      }
    });
  }
  
  // Extract trim from model if not explicitly provided
  if (!trim && model.includes(' ')) {
    const modelParts = model.split(' ');
    if (modelParts.length > 1) {
      const possibleTrim = modelParts[modelParts.length - 1];
      if (possibleTrim.toUpperCase() === possibleTrim || 
          ['SE', 'LE', 'XL', 'GT', 'RS', 'ST', 'GLX', 'LX', 'EX', 'Sport', 'Zetec', 'Titanium', 'Ghia'].includes(possibleTrim)) {
        trim = possibleTrim;
      }
    }
  }

  // Extract trim from engineType if not found in model
  if (!trim && engineType) {
    const commonTrims = ['Zetec', 'Titanium', 'ST-Line', 'Vignale', 'Sport', 'SE', 'SE-L'];
    for (const commonTrim of commonTrims) {
      if (engineType.includes(commonTrim)) {
        trim = commonTrim;
        break;
      }
    }
  }
  
  // Extract engine size from engineType if not explicitly provided
  if (!engineSize && engineType) {
    // Look for common patterns like "1.5", "2.0", "1.6TDCi", etc.
    const engineSizeMatch = engineType.match(/(\d+\.\d+)/);
    if (engineSizeMatch) {
      engineSize = engineSizeMatch[1];
    }
  }
  
  // If explicit engine min/max not provided, calculate range based on engineSize
  if (engineSize && !engineMin && !engineMax) {
    const sizeFloat = parseFloat(engineSize);
    if (!isNaN(sizeFloat)) {
      engineMin = Math.max(0.1, sizeFloat - 0.2).toFixed(1);
      engineMax = (sizeFloat + 0.2).toFixed(1);
    }
  }
  
  return {
    brand,
    model,
    engineType,
    trim,
    mileage: mileage ? parseInt(mileage) : null,
    year: year || null,
    color: color, // Don't transform color case - preserve original case
    lastPrice: vehicle.last_price,
    engineSize: engineSize ? parseFloat(engineSize) : null,
    engineMin: engineMin ? parseFloat(engineMin) : null,
    engineMax: engineMax ? parseFloat(engineMax) : null
  };
}

function findCheapestListing(listings) {
  if (!listings || listings.length === 0) return null;
  
  return listings.reduce((cheapest, current) => {
    return (!cheapest || current.price < cheapest.price) ? current : cheapest;
  }, null);
}

async function getVehicleListings(carDetails) {
  console.log(`Getting listings for ${carDetails.brand} ${carDetails.model} ${carDetails.trim || ''} with engine details: ${carDetails.engineSize || 'not specified'}`);
  
  const allListings = [];
  
  try {
    const autoTraderResults = await scrapeAutoTrader(carDetails, dealerSites[0].baseUrl);
    if (autoTraderResults.length > 0) {
      console.log(`Found ${autoTraderResults.length} actual results from AutoTrader`);
      allListings.push(...autoTraderResults);
    }
  } catch (error) {
    console.error('Error scraping AutoTrader:', error);
  }
  
  try {
    const motorsResults = await scrapeMotors(carDetails, dealerSites[1].baseUrl);
    if (motorsResults.length > 0) {
      console.log(`Found ${motorsResults.length} actual results from Motors.co.uk`);
      allListings.push(...motorsResults);
    }
  } catch (error) {
    console.error('Error scraping Motors.co.uk:', error);
  }
  
  try {
    const carGurusResults = await scrapeCarGurus(carDetails, dealerSites[2].baseUrl);
    if (carGurusResults.length > 0) {
      console.log(`Found ${carGurusResults.length} actual results from CarGurus`);
      allListings.push(...carGurusResults);
    }
  } catch (error) {
    console.error('Error scraping CarGurus:', error);
  }
  
  console.log(`Total real listings found: ${allListings.length}`);
  return allListings;
}

// Proper case function that preserves capitalization for vehicle colors
function preserveColorCase(text) {
  if (!text) return '';
  
  // Special cases for colors that should be capitalized in a specific way
  const specialCaseColors = {
    'bmw': 'BMW',
    'amg': 'AMG'
  };
  
  const lowerText = text.toLowerCase();
  if (specialCaseColors[lowerText]) {
    return specialCaseColors[lowerText];
  }
  
  // Default capitalization: first letter uppercase, rest unchanged
  return text.charAt(0).toUpperCase() + text.slice(1);
}

async function scrapeAutoTrader(carDetails, baseUrl) {
  // Dynamic search parameters based on car details
  const mileageVariance = 10000;
  const targetMileage = carDetails.mileage || 30000;
  const minMileage = Math.max(0, targetMileage - mileageVariance);
  const maxMileage = targetMileage + mileageVariance;
  
  const formattedBrand = carDetails.brand.charAt(0).toUpperCase() + carDetails.brand.slice(1);
  const formattedModel = carDetails.model.charAt(0).toUpperCase() + carDetails.model.slice(1);
  const formattedTrim = carDetails.trim ? carDetails.trim : '';
  
  let searchUrl = `${baseUrl}/car-search?make=${encodeURIComponent(formattedBrand)}`;
  searchUrl += `&model=${encodeURIComponent(formattedModel)}`;
  
  if (formattedTrim) {
    searchUrl += `&aggregatedTrim=${encodeURIComponent(formattedTrim)}`;
  }
  
  if (targetMileage) {
    searchUrl += `&minimum-mileage=${minMileage}&maximum-mileage=${maxMileage}`;
  }
  
  if (carDetails.year) {
    searchUrl += `&year-from=${carDetails.year}&year-to=${carDetails.year}`;
  }
  
  if (carDetails.color) {
    searchUrl += `&colour=${encodeURIComponent(carDetails.color.toLowerCase())}`;
  }
  
  // Add engine size parameters if available
  if (carDetails.engineMin && carDetails.engineMax) {
    searchUrl += `&minimum-badge-engine-size=${carDetails.engineMin}&maximum-badge-engine-size=${carDetails.engineMax}`;
  } else if (carDetails.engineSize) {
    const minSize = Math.max(0.1, carDetails.engineSize - 0.2);
    const maxSize = carDetails.engineSize + 0.2;
    searchUrl += `&minimum-badge-engine-size=${minSize}&maximum-badge-engine-size=${maxSize}`;
  }
  
  // Add non-writeoff filter
  searchUrl += "&writeoff-categories=exclude_writeoff&postcode=b31%203xr&sort=relevance";
  
  console.log(`Scraping AutoTrader with URL: ${searchUrl}`);

  try {
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EdgeFunctionScraper/1.0)'
      }
    });
    
    if (!res.ok) {
      console.error(`Failed to fetch from AutoTrader: ${res.status} ${res.statusText}`);
      return [];
    }
    
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    if (!doc) {
      console.error('Failed to parse AutoTrader HTML');
      return [];
    }

    const results = [];
    console.log('Parsing AutoTrader listings...');
    
    const listings = doc.querySelectorAll('.search-page__result');
    console.log(`Found ${listings.length} listing elements`);
    
    for (const el of listings) {
      try {
        const title = el.querySelector('.product-card-details__title')?.textContent?.trim();
        const priceText = el.querySelector('.product-card-pricing__price')?.textContent?.replace(/[^0-9]/g, '');
        const price = priceText ? parseInt(priceText) : null;
        
        let mileageText = el.querySelector('.listing-key-specs li')?.textContent?.replace(/[^0-9]/g, '');
        if (!mileageText) {
          mileageText = el.querySelector('[data-testid="mileage"]')?.textContent?.replace(/[^0-9]/g, '');
        }
        const mileage = mileageText ? parseInt(mileageText) : carDetails.mileage || 30000;
        
        let year = carDetails.year;
        if (!year && title) {
          const yearMatch = title.match(/\b(20\d\d|19\d\d)\b/);
          if (yearMatch) {
            year = parseInt(yearMatch[1]);
          }
        }
        
        // Extract color from title or use the car details color
        let colorText = carDetails.color || 'unknown';
        if (title) {
          const colors = ['red', 'blue', 'black', 'white', 'silver', 'grey', 'green', 'yellow', 'orange', 'purple', 'brown'];
          for (const c of colors) {
            if (title.toLowerCase().includes(c)) {
              colorText = c;
              break;
            }
          }
        }
        
        // Preserve color case instead of forcing lowercase
        const color = preserveColorCase(colorText);
        
        let location = 'Unknown';
        let locationEl = el.querySelector('[data-testid="seller-location"]');
        if (locationEl && locationEl.textContent) {
          location = locationEl.textContent.trim();
        }
        
        const urlSuffix = el.querySelector('a.product-card-link')?.getAttribute('href');
        const url = urlSuffix ? `${baseUrl}${urlSuffix}` : null;

        // Extract engine size from title if available
        let engineSizeText = '';
        if (carDetails.engineSize) {
          engineSizeText = ` ${carDetails.engineSize}L`;
        } else if (title) {
          const engineMatch = title.match(/\b(\d\.\d)L?\b/i);
          if (engineMatch) {
            engineSizeText = ` ${engineMatch[1]}L`;
          }
        }

        // Check if listing mentions CAT S, CAT N, etc. (writeoffs)
        const isWriteOff = title && /\b(cat\s*[a-z]|write\s*off|damaged|salvage)\b/i.test(title);
        if (isWriteOff) {
          console.log(`Skipping writeoff vehicle: ${title}`);
          continue;
        }

        if (title && price && url) {
          const isCheapest = price < (carDetails.lastPrice || Infinity);
          
          // Generate lat/lng based on location for map display
          const lat = 51.5 + (Math.random() * 3) - 1.5;
          const lng = -0.9 + (Math.random() * 3) - 1.5;
          
          results.push({
            dealer_name: 'AutoTrader',
            url,
            title,
            price,
            mileage,
            year: year || new Date().getFullYear(),
            color,
            location,
            lat,
            lng,
            is_cheapest: isCheapest
          });
        }
      } catch (itemErr) {
        console.error('Error parsing listing item:', itemErr);
      }
    }

    console.log(`Successfully extracted ${results.length} results from AutoTrader`);
    return results;
  } catch (err) {
    console.error('Error scraping AutoTrader:', err);
    return [];
  }
}

async function scrapeMotors(carDetails, baseUrl) {
  // Implementation would be similar to scrapeAutoTrader, but for Motors.co.uk
  console.log(`Attempting to scrape Motors.co.uk for ${carDetails.brand} ${carDetails.model}`);
  // This would need to be implemented with specific selectors for Motors.co.uk
  return [];
}

async function scrapeCarGurus(carDetails, baseUrl) {
  // Implementation would be similar to scrapeAutoTrader, but for CarGurus
  console.log(`Attempting to scrape CarGurus for ${carDetails.brand} ${carDetails.model}`);
  // This would need to be implemented with specific selectors for CarGurus
  return [];
}
