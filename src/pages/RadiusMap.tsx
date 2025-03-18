
import { useEffect, useRef, useState } from 'react';
import mapboxgl, { Map, LngLatLike } from 'mapbox-gl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TrackedCarWithLocation } from '@/types/car-types';
import { supabase } from '@/integrations/supabase/client';
import 'mapbox-gl/dist/mapbox-gl.css';

// Replace with your Mapbox access token
const MAPBOX_TOKEN = 'pk.eyJ1IjoiZGVhbHB1bHNlIiwiYSI6ImNsbXg1cHdrOTAxZWwycW50bmNjNnF0aW4ifQ.GSIBL15yI1TQ_ElD3Ll0YQ';
mapboxgl.accessToken = MAPBOX_TOKEN;

// Set the center of the UK as the default map center
const DEFAULT_CENTER: LngLatLike = [-1.78, 52.48];
const DEFAULT_ZOOM = 6;

const RadiusMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const navigate = useNavigate();
  const [postcode, setPostcode] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [trackedCars, setTrackedCars] = useState<TrackedCarWithLocation[]>([]);
  
  useEffect(() => {
    if (mapContainer.current && !map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
      });
      
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    }
    
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);
  
  useEffect(() => {
    const fetchTrackedCars = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }
        
        const { data, error } = await supabase
          .from('tracked_urls')
          .select('*')
          .eq('user_id', user.id);
          
        if (error) throw error;
        
        // Parse data from URL field and add required fields for TrackedCarWithLocation
        const carsWithLocations = data.map((car) => {
          // Extract car info from URL and fill required TrackedCar properties
          let brand = 'Unknown';
          let model = 'Unknown';
          let engineType = '';
          let mileage = '';
          let year = '';
          let color = '';
          
          // Parse URL to extract car details (similar to how it's done in useTrackedCars)
          const urlParts = car.url ? car.url.split('/') : [];
          if (urlParts.length > 0) brand = urlParts[0] || 'Unknown';
          if (urlParts.length > 1) model = urlParts[1] || 'Unknown';
          if (urlParts.length > 2) engineType = urlParts[2] || '';
          
          // Parse parameters if available
          if (urlParts.length > 3) {
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
          
          // Generate random postcode and coordinates for demo
          const randomPostcode = generateRandomPostcode();
          const randomLat = 51.5 + Math.random() * 2;
          const randomLng = -1.9 + Math.random() * 3;
          
          // Calculate a target price based on mileage or use a default
          const parsedMileage = mileage ? parseInt(mileage) : 10000;
          const targetPrice = 10000 + parsedMileage * 0.5;
          const marketPrice = car.last_price || targetPrice * (0.9 + Math.random() * 0.3);
          
          // Calculate price differences
          const difference = targetPrice - marketPrice;
          const percentageDifference = (difference / targetPrice) * 100;
          
          return {
            id: car.id,
            brand,
            model,
            engineType,
            mileage,
            year,
            color,
            last_price: car.last_price,
            last_checked: car.last_checked,
            created_at: car.created_at,
            tags: car.tags || [],
            location: {
              postcode: randomPostcode,
              lat: randomLat,
              lng: randomLng
            },
            priceComparison: {
              targetPrice,
              marketPrice,
              difference,
              percentageDifference
            }
          };
        });
        
        setTrackedCars(carsWithLocations);
      } catch (error) {
        console.error('Error fetching tracked cars:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load your tracked cars."
        });
      }
    };
    
    fetchTrackedCars();
  }, [navigate]);
  
  const generateRandomPostcode = () => {
    const prefixes = ['SW', 'NW', 'SE', 'NE', 'W', 'E', 'N', 'S', 'B', 'M', 'L', 'G'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const number = Math.floor(Math.random() * 20) + 1;
    const suffix = Math.floor(Math.random() * 9) + 1;
    return `${prefix}${number} ${suffix}XX`;
  };
  
  const searchPostcode = async () => {
    if (!postcode.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a postcode."
      });
      return;
    }
    
    if (!targetPrice.trim() || isNaN(parseFloat(targetPrice))) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a valid target price."
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Geocode the postcode (in a real app this would call an API)
      // For demo, we'll use a random UK location
      const lat = 51.5 + Math.random() * 2;
      const lng = -1.9 + Math.random() * 3;
      
      if (map.current) {
        map.current.flyTo({
          center: [lng, lat],
          zoom: 10,
          essential: true
        });
        
        // Clear existing markers
        const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
        existingMarkers.forEach(marker => marker.remove());
        
        // Remove existing circles if any
        if (map.current.getLayer('competitive-radius')) map.current.removeLayer('competitive-radius');
        if (map.current.getLayer('best-price-radius')) map.current.removeLayer('best-price-radius');
        if (map.current.getSource('radius-source')) map.current.removeSource('radius-source');
        
        // Add a marker for the searched postcode
        const markerEl = document.createElement('div');
        markerEl.className = 'marker';
        markerEl.style.width = '20px';
        markerEl.style.height = '20px';
        markerEl.style.borderRadius = '50%';
        markerEl.style.backgroundColor = '#3b82f6';
        markerEl.style.border = '2px solid white';
        
        new mapboxgl.Marker(markerEl)
          .setLngLat([lng, lat])
          .setPopup(new mapboxgl.Popup().setHTML(`<p><strong>Postcode:</strong> ${postcode}</p>`))
          .addTo(map.current);
          
        // Add radius circles
        // First, ensure the map has a source
        if (map.current.loaded()) {
          addCircles(map.current, [lng, lat], parseFloat(targetPrice));
        } else {
          map.current.once('load', () => {
            addCircles(map.current!, [lng, lat], parseFloat(targetPrice));
          });
        }
        
        toast({
          title: "Map Updated",
          description: `Showing price radius for postcode ${postcode}`
        });
      }
    } catch (error) {
      console.error('Error searching postcode:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to search for the postcode."
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const addCircles = (map: Map, center: [number, number], price: number) => {
    // Add a source for the circles
    map.addSource('radius-source', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [
          // Best price radius (inner circle) - green
          {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Point',
              coordinates: center
            }
          },
          // Competitive radius (outer circle) - orange
          {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Point',
              coordinates: center
            }
          }
        ]
      }
    });
    
    // Add a transparent fill layer for the competitive radius
    map.addLayer({
      id: 'competitive-radius',
      type: 'circle',
      source: 'radius-source',
      paint: {
        'circle-radius': {
          stops: [
            [0, 0],
            [20, 3000000] // Scaled for zoom level
          ],
          base: 2
        },
        'circle-color': '#f97316',
        'circle-opacity': 0.2,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#f97316'
      },
      filter: ['==', '$index', 1]
    });
    
    // Add a transparent fill layer for the best price radius
    map.addLayer({
      id: 'best-price-radius',
      type: 'circle',
      source: 'radius-source',
      paint: {
        'circle-radius': {
          stops: [
            [0, 0],
            [20, 1500000] // Scaled for zoom level, smaller than competitive radius
          ],
          base: 2
        },
        'circle-color': '#22c55e',
        'circle-opacity': 0.2,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#22c55e'
      },
      filter: ['==', '$index', 0]
    });
    
    // Add car markers
    trackedCars.forEach(car => {
      if (car.location) {
        const isPriceCompetitive = car.priceComparison && car.priceComparison.marketPrice <= price;
        const isBestPrice = car.priceComparison && car.priceComparison.marketPrice <= price * 0.9;
        
        const markerEl = document.createElement('div');
        markerEl.className = 'car-marker';
        markerEl.style.width = '30px';
        markerEl.style.height = '30px';
        markerEl.style.borderRadius = '50%';
        markerEl.style.backgroundColor = isBestPrice ? '#22c55e' : isPriceCompetitive ? '#f97316' : '#ef4444';
        markerEl.style.border = '2px solid white';
        markerEl.style.display = 'flex';
        markerEl.style.alignItems = 'center';
        markerEl.style.justifyContent = 'center';
        markerEl.style.color = 'white';
        markerEl.style.fontWeight = 'bold';
        markerEl.style.fontSize = '16px';
        markerEl.innerHTML = '🚗';
        
        const popupHTML = `
          <div class="p-2">
            <h3 class="font-bold">${car.brand} ${car.model}</h3>
            <p><strong>Price:</strong> £${car.priceComparison?.marketPrice.toLocaleString() || 'N/A'}</p>
            <p><strong>Target:</strong> £${car.priceComparison?.targetPrice.toLocaleString() || 'N/A'}</p>
            <p><strong>Difference:</strong> ${car.priceComparison?.percentageDifference.toFixed(1) || 0}%</p>
          </div>
        `;
        
        new mapboxgl.Marker(markerEl)
          .setLngLat([car.location.lng, car.location.lat])
          .setPopup(new mapboxgl.Popup().setHTML(popupHTML))
          .addTo(map);
      }
    });
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-primary text-primary-foreground py-4 px-6 flex items-center">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mr-4 hover:bg-primary-foreground/10"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
        <h1 className="text-xl font-bold">Car Price Radius Map</h1>
      </div>
      
      <div className="flex-1 flex flex-col md:flex-row p-4 gap-4">
        <div className="w-full md:w-96">
          <Card>
            <CardHeader>
              <CardTitle>Price Radius Search</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="postcode">Postcode</Label>
                <Input 
                  id="postcode" 
                  placeholder="e.g. SW1A 1AA" 
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="targetPrice">Target Price (£)</Label>
                <Input 
                  id="targetPrice" 
                  type="number" 
                  placeholder="e.g. 25000" 
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                />
              </div>
              
              <Button 
                className="w-full" 
                onClick={searchPostcode}
                disabled={isLoading}
              >
                {isLoading ? 'Searching...' : 'Search'}
              </Button>
              
              <div className="border rounded-md p-3 space-y-2 mt-6">
                <h3 className="font-medium">Map Legend</h3>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500"></div>
                  <span className="text-sm">Best Price Zone (≤10% below target)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                  <span className="text-sm">Competitive Zone (at or below target)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500"></div>
                  <span className="text-sm">Above Target Price</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="flex-1 bg-muted rounded-lg overflow-hidden min-h-[500px]" ref={mapContainer} />
      </div>
    </div>
  );
};

export default RadiusMap;
