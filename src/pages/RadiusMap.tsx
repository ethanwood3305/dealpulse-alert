
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, MapPin, Car, X, ChevronDown, ChevronUp, Info } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TrackedCarWithLocation } from '@/types/car-types';
import { useTrackedCars } from '@/hooks/use-tracked-cars';
import { useTheme } from '@/hooks/use-theme';
import 'mapbox-gl/dist/mapbox-gl.css';

// You'll need to add mapbox-gl as a dependency
// <lov-add-dependency>mapbox-gl@latest</lov-add-dependency>
// <lov-add-dependency>framer-motion@latest</lov-add-dependency>

const RadiusMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [selectedCar, setSelectedCar] = useState<string | null>(null);
  const [postcode, setPostcode] = useState<string>('');
  const [targetPrice, setTargetPrice] = useState<string>('');
  const [showMapTokenInput, setShowMapTokenInput] = useState(true);
  const [carsWithLocation, setCarsWithLocation] = useState<TrackedCarWithLocation[]>([]);
  const navigate = useNavigate();
  const { theme } = useTheme();
  
  const { trackedCars, isLoading: isLoadingCars } = useTrackedCars(user?.id);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        navigate('/login');
        return;
      }
      setUser(data.user);
    };
    
    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate('/login');
      }
    });
    
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [navigate]);

  // Initialize map when token is set
  useEffect(() => {
    if (mapboxToken && mapContainer.current && !map.current) {
      const initializeMap = async () => {
        const mapboxgl = await import('mapbox-gl');
        mapboxgl.default.accessToken = mapboxToken;
        
        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: theme === 'dark' 
            ? 'mapbox://styles/mapbox/dark-v11' 
            : 'mapbox://styles/mapbox/light-v11',
          center: [-0.118092, 51.509865], // London center by default
          zoom: 9
        });

        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
        
        // Initialize map controls and handlers
        map.current.on('load', () => {
          setShowMapTokenInput(false);
          toast({
            title: "Map initialized",
            description: "The map has been successfully loaded."
          });
        });
      };

      initializeMap();
    }
    
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapboxToken, theme]);

  // Update car locations on the map
  useEffect(() => {
    const updateMap = async () => {
      if (!map.current || carsWithLocation.length === 0) return;
      
      // Clear existing markers
      const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
      existingMarkers.forEach(marker => marker.remove());
      
      // Remove existing layers
      if (map.current.getLayer('green-radius')) map.current.removeLayer('green-radius');
      if (map.current.getLayer('orange-radius')) map.current.removeLayer('orange-radius');
      if (map.current.getSource('green-radius')) map.current.removeSource('green-radius');
      if (map.current.getSource('orange-radius')) map.current.removeSource('orange-radius');
      
      const selectedCarData = carsWithLocation.find(car => car.id === selectedCar);
      
      if (selectedCarData?.location) {
        // Center map on selected car
        map.current.flyTo({
          center: [selectedCarData.location.lng, selectedCarData.location.lat],
          zoom: 10,
          speed: 0.8
        });
        
        // Add car marker
        const mapboxgl = await import('mapbox-gl');
        const el = document.createElement('div');
        el.className = 'car-marker';
        el.innerHTML = `<div class="p-2 bg-primary text-white rounded-full"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-car"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg></div>`;
        
        new mapboxgl.Marker(el)
          .setLngLat([selectedCarData.location.lng, selectedCarData.location.lat])
          .setPopup(new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <div class="p-2">
                <h3 class="font-bold">${selectedCarData.brand} ${selectedCarData.model}</h3>
                <p>${selectedCarData.engineType}</p>
                ${selectedCarData.priceComparison ? 
                  `<p class="mt-2">Your price: £${selectedCarData.priceComparison.targetPrice.toLocaleString()}</p>
                   <p>Market price: £${selectedCarData.priceComparison.marketPrice.toLocaleString()}</p>
                   <p class="${selectedCarData.priceComparison.difference > 0 ? 'text-green-500' : 'text-red-500'}">
                     Difference: £${Math.abs(selectedCarData.priceComparison.difference).toLocaleString()} 
                     (${selectedCarData.priceComparison.difference > 0 ? '+' : '-'}${Math.abs(selectedCarData.priceComparison.percentageDifference).toFixed(1)}%)
                   </p>` 
                : ''}
              </div>
            `))
          .addTo(map.current);
        
        // If we have price comparison data, add radius circles
        if (selectedCarData.priceComparison) {
          // Green circle - Where you're the cheapest (5km radius as an example)
          const greenRadius = {
            'type': 'Feature',
            'geometry': {
              'type': 'Point',
              'coordinates': [selectedCarData.location.lng, selectedCarData.location.lat]
            }
          };
          
          map.current.addSource('green-radius', {
            'type': 'geojson',
            'data': greenRadius
          });
          
          map.current.addLayer({
            'id': 'green-radius',
            'type': 'circle',
            'source': 'green-radius',
            'paint': {
              'circle-radius': {
                'stops': [
                  [0, 0],
                  [10, 5000 / (map.current.getZoom() * 50)] // 5km radius at zoom level 10
                ],
                'base': 2
              },
              'circle-color': 'green',
              'circle-opacity': 0.2,
              'circle-stroke-width': 2,
              'circle-stroke-color': 'green',
              'circle-stroke-opacity': 0.5
            }
          });
          
          // Orange circle - Where you're competitive (10km radius as an example)
          const orangeRadius = {
            'type': 'Feature',
            'geometry': {
              'type': 'Point',
              'coordinates': [selectedCarData.location.lng, selectedCarData.location.lat]
            }
          };
          
          map.current.addSource('orange-radius', {
            'type': 'geojson',
            'data': orangeRadius
          });
          
          map.current.addLayer({
            'id': 'orange-radius',
            'type': 'circle',
            'source': 'orange-radius',
            'paint': {
              'circle-radius': {
                'stops': [
                  [0, 0],
                  [10, 10000 / (map.current.getZoom() * 50)] // 10km radius at zoom level 10
                ],
                'base': 2
              },
              'circle-color': 'orange',
              'circle-opacity': 0.2,
              'circle-stroke-width': 2,
              'circle-stroke-color': 'orange',
              'circle-stroke-opacity': 0.5
            }
          });
        }
      }
    };
    
    updateMap();
  }, [carsWithLocation, selectedCar]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCar || !postcode) {
      toast({
        title: "Missing information",
        description: "Please select a car and enter a postcode.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // In a real app, you would use a geocoding API to convert the postcode to coordinates
      // For this example, we'll use a mock API response
      const response = await fetch(`https://api.postcodes.io/postcodes/${postcode}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to geocode postcode");
      }
      
      const { latitude, longitude } = data.result;
      
      // Update the car with location and price comparison data
      const selectedCarData = trackedCars.find(car => car.id === selectedCar);
      
      if (selectedCarData) {
        const marketPrice = selectedCarData.last_price || 25000; // Example value if none exists
        const userTargetPrice = parseInt(targetPrice) || marketPrice;
        
        const priceDifference = userTargetPrice - marketPrice;
        const percentageDiff = (priceDifference / marketPrice) * 100;
        
        const updatedCar: TrackedCarWithLocation = {
          ...selectedCarData,
          location: {
            postcode,
            lat: latitude,
            lng: longitude
          },
          priceComparison: {
            targetPrice: userTargetPrice,
            marketPrice: marketPrice,
            difference: priceDifference,
            percentageDifference: percentageDiff
          }
        };
        
        // Update the cars array
        const updatedCars = carsWithLocation.filter(car => car.id !== selectedCar);
        setCarsWithLocation([...updatedCars, updatedCar]);
        
        toast({
          title: "Location updated",
          description: `The location for ${selectedCarData.brand} ${selectedCarData.model} has been set.`
        });
      }
    } catch (error) {
      console.error("Error geocoding postcode:", error);
      toast({
        title: "Error",
        description: "Failed to geocode the postcode. Please check it and try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle map token submission
  const handleMapTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapboxToken) {
      toast({
        title: "Token required",
        description: "Please enter your Mapbox access token.",
        variant: "destructive"
      });
      return;
    }
    
    // Token is already set in state and will trigger map initialization
    toast({
      title: "Initializing map",
      description: "Please wait while we set up the map..."
    });
  };

  if (isLoadingCars) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading your data...</span>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow py-16 container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Radius Price Map</h1>
            <p className="text-muted-foreground">
              Visualize your competitive pricing radius based on location and price comparison.
            </p>
          </div>
          
          {showMapTokenInput ? (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Mapbox Access Token Required</CardTitle>
                <CardDescription>
                  To use the map feature, please enter your Mapbox access token. 
                  You can get one by signing up at <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">mapbox.com</a>.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleMapTokenSubmit} className="space-y-4">
                  <div>
                    <Input
                      type="text"
                      placeholder="Enter your Mapbox access token"
                      value={mapboxToken}
                      onChange={(e) => setMapboxToken(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Button type="submit">Initialize Map</Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle>Car Location</CardTitle>
                  <CardDescription>
                    Set the location and target price for your vehicle.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Select Car</label>
                      <Select 
                        value={selectedCar || ""} 
                        onValueChange={setSelectedCar}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a car" />
                        </SelectTrigger>
                        <SelectContent>
                          {trackedCars.map(car => (
                            <SelectItem key={car.id} value={car.id}>
                              {car.brand} {car.model} ({car.year || 'N/A'})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Postcode</label>
                      <Input
                        type="text"
                        placeholder="e.g. SW1A 1AA"
                        value={postcode}
                        onChange={(e) => setPostcode(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Your Target Price (£)</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Info className="h-4 w-4" />
                              <span className="sr-only">Info</span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <div className="space-y-2">
                              <h4 className="font-medium">About Target Price</h4>
                              <p className="text-sm text-muted-foreground">
                                This is the price you want to sell the car for. We'll compare it with the estimated market price to show you your competitive positioning.
                              </p>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <Input
                        type="number"
                        placeholder="e.g. 25000"
                        value={targetPrice}
                        onChange={(e) => setTargetPrice(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Leave blank to use the current market price.
                      </p>
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <MapPin className="mr-2 h-4 w-4" />
                          Update Location
                        </>
                      )}
                    </Button>
                  </form>
                  
                  {carsWithLocation.length > 0 && (
                    <div className="mt-6 pt-6 border-t">
                      <h3 className="text-lg font-medium mb-3">Tracked Locations</h3>
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {carsWithLocation.map(car => (
                          <div 
                            key={car.id}
                            className={`p-3 rounded-md cursor-pointer ${
                              selectedCar === car.id ? 'bg-primary/10 border border-primary/30' : 'bg-muted'
                            }`}
                            onClick={() => setSelectedCar(car.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <Car className="h-4 w-4 mr-2 text-primary" />
                                <span className="font-medium">{car.brand} {car.model}</span>
                              </div>
                              {selectedCar === car.id ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </div>
                            
                            {selectedCar === car.id && car.location && (
                              <div className="mt-2 pl-6 text-sm space-y-1">
                                <p className="flex items-center">
                                  <MapPin className="h-3 w-3 mr-1 text-muted-foreground" />
                                  {car.location.postcode}
                                </p>
                                {car.priceComparison && (
                                  <div className="space-y-1 pt-1">
                                    <p>
                                      Your: <span className="font-medium">£{car.priceComparison.targetPrice.toLocaleString()}</span>
                                    </p>
                                    <p>
                                      Market: <span className="font-medium">£{car.priceComparison.marketPrice.toLocaleString()}</span>
                                    </p>
                                    <p className={car.priceComparison.difference > 0 ? 'text-red-500' : 'text-green-500'}>
                                      {car.priceComparison.difference > 0 ? 'Above' : 'Below'} market: 
                                      <span className="font-medium"> {Math.abs(car.priceComparison.percentageDifference).toFixed(1)}%</span>
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Price Radius Visualization</CardTitle>
                  <CardDescription>
                    Green area shows where your price is the cheapest, orange area shows where you're competitive.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div ref={mapContainer} className="h-[600px] rounded-md overflow-hidden border" />
                  <div className="mt-4 flex items-center gap-4 text-sm">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                      <span>Best price radius</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
                      <span>Competitive radius</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default RadiusMap;
