import React, { useState, useEffect, useRef } from 'react';
import { toast } from "@/components/ui/use-toast";
import { supabase, getMapboxToken } from "@/integrations/supabase/client";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { TrackedCar } from '@/hooks/use-tracked-cars';
import { CarLocation } from '@/types/car-types';
import { ScrapedListing } from '@/integrations/supabase/database.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Car, PlusCircle, Info, Key } from "lucide-react";
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';

interface RadiusMapProps {
  carId?: string;
  targetPrice?: string;
  dealerLocation?: CarLocation;
}

const RadiusMap = ({ carId = 'default-car-id', targetPrice = '0', dealerLocation }: RadiusMapProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [scrapedListings, setScrapedListings] = useState<ScrapedListing[]>([]);
  const [mapboxToken, setMapboxToken] = useState('');
  const [dealerLocationFromDB, setDealerLocationFromDB] = useState<CarLocation | null>(null);
  const [selectedCar, setSelectedCar] = useState<Partial<TrackedCar> | null>(null);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [lng, setLng] = useState(-0.128);
  const [lat, setLat] = useState(51.507);
  const [zoom, setZoom] = useState(9);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlCarId = searchParams.get('carId') || carId;

  useEffect(() => {
    const getUserData = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
      }
    };
    getUserData();
  }, []);

  useEffect(() => {
    const fetchToken = async () => {
      const token = await getMapboxToken();
      setMapboxToken(token);
      mapboxgl.accessToken = token;
    };
    fetchToken();
  }, []);

  useEffect(() => {
    const fetchDealerLocation = async () => {
      if (!user) return;
      
      try {
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .rpc('get_user_subscription', { user_uuid: user.id });

        if (subscriptionError) throw subscriptionError;
        
        if (subscriptionData && subscriptionData.length > 0 && subscriptionData[0].dealer_postcode) {
          const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${subscriptionData[0].dealer_postcode}.json?access_token=${mapboxToken}`);
          const data = await response.json();
          
          if (data.features && data.features.length > 0) {
            const coordinates = data.features[0].center;
            setDealerLocationFromDB({
              lng: coordinates[0],
              lat: coordinates[1],
              postcode: subscriptionData[0].dealer_postcode
            });
            
            setLng(coordinates[0]);
            setLat(coordinates[1]);
          }
        }
      } catch (error) {
        console.error('Error fetching dealer location:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch dealer location."
        });
      }
    };
    
    if (mapboxToken && user) {
      fetchDealerLocation();
    }
  }, [mapboxToken, user]);

  useEffect(() => {
    const fetchCarDetails = async () => {
      if (!urlCarId || urlCarId === 'default-car-id' || !user) return;
      
      try {
        const { data, error } = await supabase
          .from('tracked_urls')
          .select('*')
          .eq('id', urlCarId)
          .single();
          
        if (error) throw error;
        
        if (data) {
          const urlParts = data.url.split('/');
          const brand = urlParts[0] || 'Unknown Brand';
          const model = urlParts[1] || 'Unknown Model';
          const engineType = urlParts[2] || 'Unknown Engine';
          
          let mileage = undefined;
          let year = undefined;
          
          if (urlParts[3]) {
            const params = urlParts[3].split('&');
            params.forEach(param => {
              if (param.includes('mil=')) {
                mileage = param.split('mil=')[1];
              }
              if (param.includes('year=')) {
                year = param.split('year=')[1];
              }
            });
          }
          
          setSelectedCar({
            id: data.id,
            brand: brand,
            model: model, 
            engineType: engineType,
            mileage: mileage,
            year: year,
            last_price: data.last_price,
            last_checked: data.last_checked,
            created_at: data.created_at,
            tags: data.tags || []
          });
        }
      } catch (error) {
        console.error('Error fetching car details:', error);
      }
    };
    
    fetchCarDetails();
  }, [urlCarId, user]);

  useEffect(() => {
    if (!mapboxToken) return;
    if (map.current) return; // map already initialized
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [lng, lat],
      zoom: zoom
    });

    map.current.addControl(
      new mapboxgl.NavigationControl(),
      'top-right'
    );

    map.current.on('move', () => {
      if (map.current) {
        setLng(parseFloat(map.current.getCenter().lng.toFixed(4)));
        setLat(parseFloat(map.current.getCenter().lat.toFixed(4)));
        setZoom(parseFloat(map.current.getZoom().toFixed(2)));
      }
    });
  }, [mapboxToken]);

  useEffect(() => {
    if (map.current && (dealerLocation || dealerLocationFromDB)) {
      const location = dealerLocation || dealerLocationFromDB;
      if (location) {
        map.current.flyTo({
          center: [location.lng, location.lat],
          zoom: 10,
          essential: true
        });
      }
    }
  }, [dealerLocation, dealerLocationFromDB, map.current]);

  const addDealerMarkerAndCircles = (dealerLocation: CarLocation, cheapestListing: ScrapedListing) => {
    if (!map.current) return;

    // Clear previous layers and sources
    if (map.current.getLayer('dealer-marker')) map.current.removeLayer('dealer-marker');
    if (map.current.getSource('dealer')) map.current.removeSource('dealer');
    if (map.current.getLayer('radius-5k')) map.current.removeLayer('radius-5k');
    if (map.current.getSource('radius-5k')) map.current.removeSource('radius-5k');
    if (map.current.getLayer('radius-10k')) map.current.removeLayer('radius-10k');
    if (map.current.getSource('radius-10k')) map.current.removeSource('radius-10k');
    if (map.current.getLayer('cheapest-radius')) map.current.removeLayer('cheapest-radius');
    if (map.current.getSource('cheapest-radius')) map.current.removeSource('cheapest-radius');

    // Add dealer marker
    const markerEl = document.createElement('div');
    markerEl.className = 'flex items-center justify-center';
    markerEl.style.width = '30px';
    markerEl.style.height = '30px';
    
    const markerSvg = document.createElement('div');
    markerSvg.className = 'text-red-600';
    markerSvg.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
    markerEl.appendChild(markerSvg);
    
    new mapboxgl.Marker(markerEl)
      .setLngLat([dealerLocation.lng, dealerLocation.lat])
      .setPopup(
        new mapboxgl.Popup({ offset: 25 })
          .setHTML(`<h4>Dealer Location</h4><p>${dealerLocation.postcode}</p>`)
      )
      .addTo(map.current);

    // Function to add circle
    const addCircle = (id: string, center: [number, number], radiusKm: number, color: string) => {
      const radiusMeters = radiusKm * 1000;
      const steps = 64;
      const lat = center[1];
      const outerRadius = radiusMeters / (Math.cos(Math.PI * lat / 180) * 40075000 / 360);
      const innerRadius = outerRadius;

      const coordinates: number[][] = [];
      for (let i = 0; i < steps; i++) {
        const angle = (i / steps) * Math.PI * 2;
        const lng = center[0] + outerRadius * Math.cos(angle);
        const lat = center[1] + innerRadius * Math.sin(angle);
        coordinates.push([lng, lat]);
      }
      coordinates.push([...coordinates[0]]);

      const circleData: GeoJSON.FeatureCollection<GeoJSON.Geometry> = {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [coordinates]
          },
          properties: {}
        }]
      };

      map.current!.addSource(id, {
        type: 'geojson',
        data: circleData
      });

      map.current!.addLayer({
        id: id,
        type: 'fill',
        source: id,
        paint: {
          'fill-color': color,
          'fill-opacity': 0.1
        }
      });
    };

    // Add standard radius circles around dealer
    addCircle('radius-5k', [dealerLocation.lng, dealerLocation.lat], 5, '#00f');
    addCircle('radius-10k', [dealerLocation.lng, dealerLocation.lat], 10, '#0f0');

    // Add marker and radius for cheapest listing
    if (cheapestListing && cheapestListing.lat && cheapestListing.lng) {
      // Add marker for cheapest listing
      const el = document.createElement('div');
      el.className = 'marker';
      el.style.width = '24px';
      el.style.height = '24px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = '#f50057';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';

      new mapboxgl.Marker(el)
        .setLngLat([cheapestListing.lng, cheapestListing.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(
              `<h4>${cheapestListing.title}</h4>
               <p><strong>Price:</strong> £${cheapestListing.price.toLocaleString()}</p>
               <p><strong>Location:</strong> ${cheapestListing.location || 'Unknown'}</p>
               <p><a href="${cheapestListing.url}" target="_blank">View Listing</a></p>`
            )
        )
        .addTo(map.current!);
        
      // Add radius circle around cheapest listing (using different color)
      addCircle(
        'cheapest-radius', 
        [cheapestListing.lng, cheapestListing.lat], 
        5, 
        '#f50057'
      );
        
      // Adjust map bounds to show both dealer and cheapest listing
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend([dealerLocation.lng, dealerLocation.lat]);
      bounds.extend([cheapestListing.lng, cheapestListing.lat]);
      
      map.current.fitBounds(bounds, {
        padding: 100,
        maxZoom: 10
      });
    }
  };

  const fetchScrapedListings = async () => {
    try {
      setIsLoading(true);
      
      if (!urlCarId || urlCarId === 'default-car-id') {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No car ID provided. Please select a car first."
        });
        return;
      }
      
      // First trigger the scraper to get fresh listings
      const { error: scraperError } = await supabase.functions.invoke('car-dealer-scraper', {
        body: { vehicle_id: urlCarId }
      });
      
      if (scraperError) {
        console.error('Error running car scraper:', scraperError);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to scrape latest vehicle listings."
        });
      } else {
        toast({
          title: "Scraping Started",
          description: "We're searching for the cheapest similar vehicle. This may take a moment."
        });
      }
      
      // Wait a moment for scraping to complete
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Now fetch the scraped listings (should only be one now - the cheapest)
      const { data, error } = await supabase.rpc('get_scraped_listings_for_car', {
        car_id: urlCarId
      });
        
      if (error) throw error;
      
      setScrapedListings(data || []);
      
      const locationToUse = dealerLocation || dealerLocationFromDB;
      
      if (data && data.length > 0 && locationToUse) {
        console.log(`Found cheapest listing for car ${urlCarId}`);
        const cheapestListing = data[0]; // There should only be one listing now
        addDealerMarkerAndCircles(locationToUse, cheapestListing);
        
        toast({
          title: "Success",
          description: `Found the cheapest similar vehicle: £${cheapestListing.price.toLocaleString()}`
        });
      } else if (data && data.length > 0 && !locationToUse) {
        toast({
          title: "Warning",
          description: "Dealer location not provided. Map view may be limited.",
          variant: "destructive"
        });
      } else if (data && data.length === 0) {
        toast({
          title: "No Listings Found",
          description: "No similar vehicles found for this car."
        });
      }
    } catch (error) {
      console.error('Error fetching scraped listings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load scraped vehicle listings."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-1/3 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Selected Vehicle
                </CardTitle>
                {selectedCar && (
                  <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
                    Change
                  </Button>
                )}
              </div>
              <CardDescription>
                {selectedCar ? 'View price radius for this vehicle' : 'Please select a car to view price radius'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedCar ? (
                <div className="space-y-2">
                  <p className="font-medium">{selectedCar.year} {selectedCar.brand} {selectedCar.model}</p>
                  <p className="text-sm text-muted-foreground">
                    Engine: {selectedCar.engineType || 'N/A'} | 
                    Mileage: {selectedCar.mileage ? `${selectedCar.mileage.toLocaleString()} miles` : 'N/A'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    List Price: £{selectedCar.last_price ? parseFloat(selectedCar.last_price.toString()).toLocaleString() : 'N/A'}
                  </p>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Select a car
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl flex items-center gap-2">
                <Key className="h-5 w-5" />
                Map Legend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm">5km Radius (Inner Circle)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm">10km Radius (Outer Circle)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm">Competitor Listings</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-red-600" />
                  <span className="text-sm">Dealer Location</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button 
            onClick={fetchScrapedListings} 
            disabled={isLoading} 
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Info className="mr-2 h-4 w-4" />
                Load Listings
              </>
            )}
          </Button>
        </div>

        <div className="w-full lg:w-2/3">
          <Card className="overflow-hidden">
            <div 
              ref={mapContainer} 
              className="map-container w-full h-[600px] bg-gray-100 rounded-md" 
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RadiusMap;

