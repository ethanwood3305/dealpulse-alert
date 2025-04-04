/// <reference lib="deno.ns" />
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.36.0';
import { DOMParser } from 'https://deno.land/x/deno_dom/deno-dom-wasm.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    console.log('[INIT] Supabase URL and Key loaded');
    if (!supabaseUrl || !supabaseKey)
      throw new Error('Missing Supabase environment variables');

    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('[INIT] Supabase client initialized');

    const requestData = await req.json().catch(() => ({}));
    const vehicleId = requestData.vehicle_id;
    console.log(`[INPUT] Vehicle ID received: ${vehicleId || 'ALL'}`);

    if (vehicleId) {
      await scrapeForVehicle(supabase, vehicleId);
      return new Response(
        JSON.stringify({ success: true, message: `Scraped vehicle ${vehicleId}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: trackedCars, error } = await supabase.from('tracked_urls').select('*');
    console.log('[DB] Tracked cars fetched');
    if (error) throw new Error(error.message);

    const carsToProcess = trackedCars?.slice(0, 50) || [];
    console.log(`[PROCESS] Cars to process: ${carsToProcess.length}`);
    for (const car of carsToProcess) {
      await scrapeForVehicle(supabase, car.id);
    }

    return new Response(
      JSON.stringify({ success: true, message: `Processed ${carsToProcess.length} vehicles` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[ERROR] Scraper error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function scrapeForVehicle(supabase, vehicleId) {
  try {
    if (!vehicleId) {
      console.error('Invalid vehicle ID provided');
      return;
    }

    const { data: vehicle, error } = await supabase
      .from('tracked_urls')
      .select('*')
      .eq('id', vehicleId)
      .single();
    if (error || !vehicle) {
      console.error(`Error fetching vehicle ${vehicleId}:`, error);
      return;
    }

    const { data: subscriptionData } = await supabase
      .from('subscriptions')
      .select('dealer_postcode')
      .eq('user_id', vehicle.user_id)
      .single();
    const dealerPostcode = subscriptionData?.dealer_postcode || 'b31 3xr';

    const carDetails = parseVehicleDetails(vehicle);
    console.log(
      `Scraping ${carDetails.brand} ${carDetails.model} ${carDetails.trim || ''} ${carDetails.year || ''}`
    );

    // Get listings from both sources
    const autoTraderListings = await getVehicleListings(carDetails, dealerPostcode);
    const motorsListings = await getMotorsListings(carDetails, dealerPostcode);
    const scrapedListings = [...autoTraderListings, ...motorsListings];
    console.log(`Found ${scrapedListings.length} total listings for vehicle ${vehicleId}`);

    // Delete previous listings
    const { error: deleteError } = await supabase
      .from('scraped_vehicle_listings')
      .delete()
      .eq('tracked_car_id', vehicleId);
    if (deleteError) {
      console.error(`Error deleting previous listings for vehicle ${vehicleId}:`, deleteError);
    }

    if (scrapedListings.length > 0) {
      const sortedListings = [...scrapedListings].sort((a, b) =>
        a.price !== b.price ? a.price - b.price : a.mileage - b.mileage
      );
      const cheapestListing = sortedListings[0];
      const top3Listings = sortedListings.slice(0, 3);
      const listingsToInsert = top3Listings.map(listing => ({
        ...listing,
        tracked_car_id: vehicleId,
        is_cheapest:
          listing.price === cheapestListing.price &&
          listing.mileage === cheapestListing.mileage
      }));

      const { error: insertError } = await supabase
        .from('scraped_vehicle_listings')
        .insert(listingsToInsert);
      if (insertError) {
        console.error(`Error inserting listings for vehicle ${vehicleId}:`, insertError);
      } else {
        console.log(`Successfully inserted ${listingsToInsert.length} listings for vehicle ${vehicleId}`);
      }

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
      await supabase
        .from('tracked_urls')
        .update({ last_checked: new Date().toISOString() })
        .eq('id', vehicleId);
    }
  } catch (err) {
    console.error(`Vehicle scrape error (${vehicleId}):`, err);
  }
}

/* 
  toProperCase function: Capitalizes the first letter and lowercases the rest.
*/
function toProperCase(text) {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/* 
  cleanTrim function: Removes unwanted substrings like "TDCI", "DCI", etc.
*/
function cleanTrim(trim) {
  if (!trim) return '';
  const blacklist = ['tdci', 'dci', 'dct', 'isg', 'mhev', 'phev', 'tgdi', 'gdi', 'crdi'];
  let cleaned = trim;
  for (const term of blacklist) {
    cleaned = cleaned.replace(new RegExp(`\\b${term}\\b`, 'gi'), '');
  }
  return cleaned.replace(/\s+/g, ' ').trim();
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
      if (param.includes('trim=')) {
        trim = cleanTrim(param.split('trim=')[1].trim());
      }
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
    const min = Math.max(0, carDetails.mileage - 4000);
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

  console.log("Payload being sent:", JSON.stringify(payload, null, 2));

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
      console.warn(
        `[RETRY] AutoTrader API failed (status ${response.status}): ${body.substring(0, 300)}`
      );
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
  let listings = json[0]?.data?.searchResults?.listings || [];

  if (listings.length === 0 && carDetails.trim) {
    const properCaseTrim = toProperCase(carDetails.trim);
    console.log("No listings found. Retrying with proper-case trim:", properCaseTrim);
    const newFilters = filters.map(filter => {
      if (filter.filter === "aggregated_trim") {
        return { ...filter, selected: [properCaseTrim] };
      }
      return filter;
    });

    const newPayload = [{
      operationName: "SearchResultsListingsGridQuery",
      variables: {
        filters: newFilters,
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

    console.log("Proper-case Payload being sent:", JSON.stringify(newPayload, null, 2));

    let retriesUpper = 0;
    let responseUpper;
    while (retriesUpper < MAX_RETRIES) {
      try {
        const userAgent = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${118 + retriesUpper}.0.0.0 Safari/537.36`;
        responseUpper = await fetch(`${baseUrl}/at-gateway?opname=SearchResultsListingsGridQuery`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': userAgent,
            'x-sauron-app-name': 'sauron-search-results-app',
            'x-sauron-app-version': '3157'
          },
          body: JSON.stringify(newPayload)
        });

        if (responseUpper.ok) break;

        const body = await responseUpper.text();
        console.warn(
          `[RETRY] Proper-case trim API failed (status ${responseUpper.status}): ${body.substring(0, 300)}`
        );
        retriesUpper++;
        await new Promise(r => setTimeout(r, retriesUpper * 1000));
      } catch (err) {
        console.error(`[RETRY ERROR] Proper-case trim`, err);
        retriesUpper++;
        await new Promise(r => setTimeout(r, retriesUpper * 1000));
      }
    }
    if (responseUpper && responseUpper.ok) {
      const jsonUpper = await responseUpper.json();
      listings = jsonUpper[0]?.data?.searchResults?.listings || [];
    }
  }

  return listings
    .filter(l => l.fpaLink && l.price)
    .map(l => {
      let price =
        typeof l.price === 'string'
          ? parseInt(l.price.replace(/[^0-9]/g, ''), 10)
          : l.price;
      if (isNaN(price)) price = 0;

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
        price,
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

// New function for scraping Motors.co.uk listings using a POST request with URL-encoded form data.
// This function sends the request to https://www.motors.co.uk/search/car/ using the "searchPanelParameters" key,
// then parses the returned HTML to extract listing details.
async function getMotorsListings(carDetails, postcode = 'b31 3xr') {
  const url = 'https://www.motors.co.uk/search/car/';

  // Build payload based on the observed Postman request.
  const payload = {
    "Doors": [],
    "Seats": [],
    "SafetyRatings": [],
    "DealerRating": [],
    "SelectedTopSpeed": null,
    "SelectedPower": null,
    "SelectedAcceleration": null,
    "MinPower": -1,
    "MaxPower": -1,
    "MinEngineSize": -1,
    "MaxEngineSize": -1,
    "IsULEZCompliant": false,
    "BodyStyles": [],
    "DriveTrains": [],
    "MakeModels": [
      {
        "Value": carDetails.brand,
        "Models": [carDetails.model],
        "Trims": carDetails.trim ? [carDetails.trim] : []
      }
    ],
    "FuelTypes": [],
    "Transmissions": [],
    "Colours": carDetails.color ? [carDetails.color] : [],
    "IsPaymentSearch": false,
    "IsReduced": false,
    "IsHot": false,
    "IsRecentlyAdded": false,
    "IsGroupStock": false,
    "PartExAvailable": false,
    "IsPriceAndGo": false,
    "IsPriceExcludeVATSearch": false,
    "IncludeOnlineOnlySearch": false,
    "IsAgeSearch": true,
    "IsPreReg": false,
    "IsExDemo": false,
    "ExcludeExFleet": false,
    "ExcludeExHire": false,
    "Keywords": [],
    "SelectedInsuranceGroup": null,
    "SelectedFuelEfficiency": null,
    "SelectedCostAnnualTax": null,
    "SelectedCO2Emission": null,
    "SelectedTowingBrakedMax": null,
    "SelectedTowingUnbrakedMax": null,
    "SelectedTankRange": null,
    "DealerId": 0,
    "Age": -1,
    "MinAge": -1,
    "MaxAge": carDetails.year ? String(carDetails.year) : "1",
    "MinYear": carDetails.year ? carDetails.year : -1,
    "MaxYear": carDetails.year ? carDetails.year : -1,
    "Mileage": -1,
    "MinMileage": -1,
    "MaxMileage": carDetails.mileage ? String(carDetails.mileage + 2000) : "10000",
    "MinPrice": -1,
    "MaxPrice": -1,
    "MinPaymentMonthlyCost": -1,
    "MaxPaymentMonthlyCost": -1,
    "PaymentTerm": 60,
    "PaymentMileage": carDetails.mileage ? carDetails.mileage + 2000 : 10000,
    "PaymentDeposit": 1000,
    "SelectedSoldStatusV2": "notsold",
    "SelectedBatteryRangeMiles": null,
    "SelectedBatteryFastChargeMinutes": null,
    "BatteryIsLeased": false,
    "BatteryIsWarrantyWhenNew": false,
    "ExcludeImports": false,
    "ExcludeHistoryCatNCatD": false,
    "ExcludeHistoryCatSCatC": false,
    "Type": 10,
    "PostCode": postcode,
    "Distance": 1000,
    "SortOrder": 0,
    "DealerGroupId": 0,
    "MinImageCountActive": false,
    "PaginationCurrentPage": 1
  };

  const formBody = new URLSearchParams();
  formBody.set("searchPanelParameters", JSON.stringify(payload));

  console.log("Fetching Motors.co.uk URL:", url);
  console.log("Payload:", JSON.stringify(payload));

  const MAX_RETRIES = 3;
  let retries = 0;
  let response;

  while (retries < MAX_RETRIES) {
    try {
      const userAgent = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36`;
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Upgrade-Insecure-Requests': '1'
        },
        body: formBody.toString()
      });
      if (response.ok) break;
      const bodyText = await response.text();
      console.warn(
        `[RETRY] Motors.co.uk request failed (status ${response.status}): ${bodyText.substring(0, 300)}`
      );
      retries++;
      await new Promise(r => setTimeout(r, retries * 1000));
    } catch (err) {
      console.error(`[RETRY ERROR] Motors.co.uk`, err);
      retries++;
      await new Promise(r => setTimeout(r, retries * 1000));
    }
  }

  if (!response || !response.ok) {
    console.error('[ERROR] Motors.co.uk request failed after all retries');
    return [];
  }

  let html;
  try {
    html = await response.text();
  } catch (err) {
    console.error('Error reading HTML from Motors.co.uk:', err);
    return [];
  }

  // Parse the returned HTML
  const dom = new DOMParser().parseFromString(html, "text/html");
  if (!dom) {
    console.error("Failed to parse Motors.co.uk HTML");
    return [];
  }

  // Adjust the selector based on the actual HTML structure.
  // For this example, assume each listing is within an element with the class "search-result-item".
  const listingElements = dom.querySelectorAll(".search-result-item");
  if (!listingElements || listingElements.length === 0) {
    console.warn("No listings found on Motors.co.uk page");
    return [];
  }

  const listings = [];
  listingElements.forEach(el => {
    // Extract details; adjust selectors to match the page structure.
    const titleEl = el.querySelector(".result-title");
    const priceEl = el.querySelector(".result-price");
    const mileageEl = el.querySelector(".result-mileage");
    const locationEl = el.querySelector(".result-location");
    const linkEl = el.querySelector("a");

    let price = priceEl ? parseInt(priceEl.textContent.replace(/[^0-9]/g, ''), 10) : 0;
    if (isNaN(price)) price = 0;
    let mileage = mileageEl ? parseInt(mileageEl.textContent.replace(/[^0-9]/g, ''), 10) : (carDetails.mileage || 0);
    const title = titleEl ? titleEl.textContent.trim() : `${carDetails.brand} ${carDetails.model}`;
    const listingUrl = linkEl ? linkEl.getAttribute("href") : url;

    listings.push({
      dealer_name: "Motors",
      url: listingUrl.startsWith('http') ? listingUrl : `https://www.motors.co.uk${listingUrl}`,
      title,
      price,
      mileage,
      year: carDetails.year ? parseInt(carDetails.year) : new Date().getFullYear(),
      color: carDetails.color || 'Unknown',
      location: locationEl ? locationEl.textContent.trim() : 'Unknown',
      lat: 51.5 + Math.random() * 3 - 1.5,
      lng: -0.9 + Math.random() * 3 - 1.5,
      is_cheapest: false
    });
  });

  return listings;
}
