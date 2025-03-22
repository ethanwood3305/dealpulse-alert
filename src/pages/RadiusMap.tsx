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

  // Get the current user
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
        // Get dealer postcode from user subscription
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .rpc('get_user_subscription', { user_uuid: user.id });

        if (subscriptionError) throw subscriptionError;
        
        if (subscriptionData && subscriptionData.length > 0 && subscriptionData[0].dealer_postcode) {
          // We have the dealer postcode, now convert it to coordinates
          const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${subscriptionData[0].dealer_postcode}.json?access_token=${mapboxToken}`);
          const data = await response.json();
          
          if (data.features && data.features.length > 0) {
            const coordinates = data.features[0].center;
            setDealerLocationFromDB({
              lng: coordinates[0],
              lat: coordinates[1],
              postcode: subscriptionData[0].dealer_postcode
            });
            
            // Update the map center
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
        
        // Transform tracked_urls data into TrackedCar format
        if (data) {
          const urlParts = data.url.split('/');
          const brand = urlParts[0] || 'Unknown Brand';
          const model = urlParts[1] || 'Unknown Model';
          const engineType = urlParts[2] || 'Unknown Engine';
          
          // Extract mileage, year, and other parameters from URL
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

    // Add navigation controls
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

  // Update map when dealer location changes
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

  const addDealerMarkerAndCircles = (location: CarLocation, targetPrice: number, listings: ScrapedListing[]) => {
    if (!map.current) return;

    // Remove existing sources and layers
    if (map.current.getLayer('dealer-marker')) {
      map.current.removeLayer('dealer-marker');
    }
    if (map.current.getSource('dealer')) {
      map.current.removeSource('dealer');
    }
    if (map.current.getLayer('radius-5k')) {
      map.current.removeLayer('radius-5k');
    }
    if (map.current.getSource('radius-5k')) {
      map.current.removeSource('radius-5k');
    }
    if (map.current.getLayer('radius-10k')) {
      map.current.removeLayer('radius-10k');
    }
    if (map.current.getSource('radius-10k')) {
      map.current.removeSource('radius-10k');
    }

    // Add dealer marker
    map.current.addSource('dealer', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [location.lng, location.lat]
          },
          properties: {
            title: 'Dealer Location',
            icon: 'shop'
          }
        }]
      } as GeoJSON.FeatureCollection<GeoJSON.Geometry>
    });

    map.current.addLayer({
      id: 'dealer-marker',
      type: 'symbol',
      source: 'dealer',
      layout: {
        'icon-image': 'shop',
        'icon-size': 1.5,
        'text-field': ['get', 'title'],
        'text-font': [
          'Open Sans Semibold',
          'Arial Unicode MS Bold'
        ],
        'text-offset': [0, 0.9],
        'text-anchor': 'top'
      },
      paint: {
        'text-color': '#f00'
      }
    });

    // Add radius circles
    const addCircle = (id: string, radiusKm: number, color: string) => {
      const radiusMeters = radiusKm * 1000;
      const steps = 64;
      const outerRadius = radiusMeters / (Math.cos(Math.PI * location.lat / 180) * 40075000 / 360);
      const innerRadius = outerRadius;

      const coordinates: number[][] = [];
      for (let i = 0; i < steps; i++) {
        const angle = (i / steps) * Math.PI * 2;
        const lng = location.lng + outerRadius * Math.cos(angle);
        const lat = location.lat + innerRadius * Math.sin(angle);
        coordinates.push([lng, lat]);
      }
      // Close the polygon by repeating the first point
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

    addCircle('radius-5k', 5, '#00f');
    addCircle('radius-10k', 10, '#0f0');

    // Add scraped listings as markers
    listings.forEach(listing => {
      if (listing.lat && listing.lng) {
        const el = document.createElement('div');
        el.className = 'marker';
        el.style.width = '10px';
        el.style.height = '10px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = 'red';

        new mapboxgl.Marker(el)
          .setLngLat([listing.lng, listing.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }) // add popups
              .setHTML(
                `<h4>${listing.title}</h4><p>Price: $${listing.price}</p>`
              )
          )
          .addTo(map.current!);
      }
    });
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
      
      const { data, error } = await supabase.rpc('get_scraped_listings_for_car', {
        car_id: urlCarId
      });
        
      if (error) throw error;
      
      setScrapedListings(data || []);
      
      // Determine which location to use
      const locationToUse = dealerLocation || dealerLocationFromDB;
      
      // If we have listings and a location, show them on the map
      if (data && data.length > 0 && locationToUse) {
        console.log(`Found ${data.length} scraped listings for car ${urlCarId}`);
        addDealerMarkerAndCircles(locationToUse, parseFloat(targetPrice), data);
      } else if (data && data.length > 0 && !locationToUse) {
        toast({
          title: "Warning",
          description: "Dealer location not provided. Map view may be limited.",
          variant: "destructive"
        });
      } else if (data && data.length === 0) {
        toast({
          title: "No Listings Found",
          description: "No scraped listings found for this car."
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
        {/* Left side - Map info and controls */}
        <div className="w-full lg:w-1/3 space-y-4">
          {/* Car details card */}
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
                    Target Price: £{parseFloat(targetPrice).toLocaleString() || '0'}
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

          {/* Map legend card */}
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

          {/* Action button */}
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

        {/* Right side - Map */}
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
