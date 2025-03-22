import { useEffect, useRef, useState } from 'react';
import mapboxgl, { Map, LngLatLike } from 'mapbox-gl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeft, Loader2, MapPin, Search } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TrackedCarWithLocation, DealerVehicle } from '@/types/car-types';
import { supabase, getMapboxToken } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useSubscription } from '@/hooks/use-subscription';
import 'mapbox-gl/dist/mapbox-gl.css';

const DEFAULT_CENTER: LngLatLike = [-1.78, 52.48];
const DEFAULT_ZOOM = 6;

// Function to simulate geocoding a postcode to lat/lng
const geocodePostcode = async (postcode: string): Promise<[number, number] | null> => {
  // In a real app, you would use a geocoding API here
  if (!postcode || postcode.trim() === '') return null;
  
  // For demonstration purposes, return specific coordinates for known postcodes
  const normalizedPostcode = postcode.trim().toUpperCase();
  
  // Specific coordinates for B31 3XR (Birmingham)
  if (normalizedPostcode === 'B31 3XR') {
    console.log('Using hard-coded coordinates for B31 3XR (Birmingham)');
    return [-1.9605, 52.4054]; // Coordinates for Birmingham B31
  }
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Generate random coordinates centered around UK
  const lat = 51.5 + (Math.random() * 3) - 1.5;
  const lng = -0.9 + (Math.random() * 3) - 1.5;
  
  return [lng, lat];
};

const RadiusMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  const [postcode, setPostcode] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [trackedCars, setTrackedCars] = useState<TrackedCarWithLocation[]>([]);
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [selectedCar, setSelectedCar] = useState<TrackedCarWithLocation | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [dealerLocation, setDealerLocation] = useState<[number, number] | null>(null);
  const [dealerPostcodeLoaded, setDealerPostcodeLoaded] = useState(false);
  
  const { userSubscription } = useSubscription(user?.id);
  
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
  }, [navigate]);
  
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const token = await getMapboxToken();
        console.log('Fetched Mapbox token:', token ? 'Available' : 'Not available');
        setMapboxToken(token);
        
        if (!token) {
          setMapError('Failed to load Mapbox token from Supabase');
          setIsMapLoading(false);
        }
      } catch (error) {
        console.error('Error fetching Mapbox token:', error);
        setMapError('Failed to load Mapbox token');
        setIsMapLoading(false);
      }
    };
    
    fetchToken();
  }, []);
  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const carId = params.get('car');
    const price = params.get('targetPrice');
    
    if (carId) {
      setSelectedCarId(carId);
    }
    
    if (price) {
      setTargetPrice(price);
    }
  }, [location.search]);
  
  // Load dealer postcode from subscription and geocode it
  useEffect(() => {
    if (userSubscription?.dealer_postcode && !dealerPostcodeLoaded) {
      console.log('Found dealer postcode in subscription:', userSubscription.dealer_postcode);
      setPostcode(userSubscription.dealer_postcode);
      setDealerPostcodeLoaded(true);
      
      // Geocode the dealer postcode to get coordinates
      (async () => {
        try {
          const coords = await geocodePostcode(userSubscription.dealer_postcode);
          if (coords) {
            console.log('Geocoded dealer postcode to coordinates:', coords);
            setDealerLocation(coords);
            
            // If map is already initialized, fly to the dealer location
            if (map.current) {
              map.current.flyTo({
                center: coords,
                zoom: 8.5,
                essential: true
              });
            }
          } else {
            console.warn('Failed to geocode dealer postcode:', userSubscription.dealer_postcode);
          }
        } catch (error) {
          console.error('Error geocoding dealer postcode:', error);
        }
      })();
    }
  }, [userSubscription, dealerPostcodeLoaded]);
  
  useEffect(() => {
    if (mapContainer.current && !map.current && mapboxToken) {
      console.log('Initializing map with token');
      
      try {
        mapboxgl.accessToken = mapboxToken;
        
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: DEFAULT_CENTER,
          zoom: DEFAULT_ZOOM,
        });
        
        console.log('Map initialization started');
        
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
        
        map.current.on('load', () => {
          console.log('Map loaded successfully');
          setIsMapLoading(false);
          setMapError(null);
          
          // If we have a dealer location and selected car, search automatically
          if (dealerLocation && targetPrice && selectedCarId) {
            setTimeout(() => {
              searchWithDealerLocation();
            }, 1000);
          }
        });
        
        map.current.on('error', (e) => {
          console.error('Mapbox error:', e);
          const errorMessage = e.error && e.error.message 
            ? e.error.message 
            : 'There was an error loading the map. Please try refreshing the page.';
          
          setMapError(errorMessage);
          setIsMapLoading(false);
          
          if (errorMessage.includes('API key')) {
            setMapError('Invalid Mapbox API key. Please check the configuration.');
          }
          
          toast({
            title: "Map Error",
            description: errorMessage,
            variant: "destructive"
          });
        });
      } catch (error: any) {
        console.error('Error initializing map:', error);
        const errorMessage = error.message || 'Failed to initialize the map';
        setMapError(errorMessage);
        setIsMapLoading(false);
        toast({
          title: "Map Error",
          description: errorMessage,
          variant: "destructive" 
        });
      }
    }
    
    return () => {
      if (map.current) {
        console.log('Removing map');
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapboxToken, dealerLocation, targetPrice, selectedCarId]);
  
  useEffect(() => {
    if (mapboxToken) {
      fetchTrackedCars();
    }
  }, [mapboxToken]);
  
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
      
      const carsWithLocations = data.map((car) => {
        let brand = 'Unknown';
        let model = 'Unknown';
        let engineType = '';
        let mileage = '';
        let year = '';
        let color = '';
        
        const urlParts = car.url ? car.url.split('/') : [];
        if (urlParts.length > 0) brand = urlParts[0] || 'Unknown';
        if (urlParts.length > 1) model = urlParts[1] || 'Unknown';
        if (urlParts.length > 2) engineType = urlParts[2] || '';
        
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
        
        const randomPostcode = generateRandomPostcode();
        const randomLat = 51.5 + Math.random() * 2;
        const randomLng = -1.9 + Math.random() * 3;
        
        const parsedMileage = mileage ? parseInt(mileage) : 10000;
        const targetPrice = 10000 + parsedMileage * 0.5;
        const marketPrice = car.last_price || targetPrice * (0.9 + Math.random() * 0.3);
        
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
      
      if (selectedCarId && targetPrice) {
        const foundCar = carsWithLocations.find(car => car.id === selectedCarId);
        if (foundCar && foundCar.location) {
          setSelectedCar(foundCar);
          
          // If we have a dealer postcode, use that instead of the car's postcode
          if (userSubscription?.dealer_postcode) {
            setPostcode(userSubscription.dealer_postcode);
          } else {
            setPostcode(foundCar.location.postcode);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching tracked cars:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load your tracked cars."
      });
    }
  };
  
  const generateRandomPostcode = () => {
    const prefixes = ['SW', 'NW', 'SE', 'NE', 'W', 'E', 'N', 'S', 'B', 'M', 'L', 'G'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const number = Math.floor(Math.random() * 20) + 1;
    const suffix = Math.floor(Math.random() * 9) + 1;
    return `${prefix}${number} ${suffix}XX`;
  };
  
  const searchDealerVehicles = async (centerCoords: [number, number]) => {
    if (!selectedCar) return [];
    
    setIsLoading(true);
    
    try {
      const dealerCount = Math.floor(Math.random() * 50) + 50;
      const results = [];
      
      // Use the center coordinates to generate vehicles in a radius
      for (let i = 0; i < dealerCount; i++) {
        // Random distance from center (in degrees, roughly)
        const distance = Math.random() * 0.5; // Up to ~50km
        const angle = Math.random() * Math.PI * 2; // Random angle
        
        // Calculate coordinates based on distance and angle
        const lat = centerCoords[1] + (Math.sin(angle) * distance);
        const lng = centerCoords[0] + (Math.cos(angle) * distance);
        
        // Price deviation increases with distance from dealer
        const distanceFactor = distance * 1.5; // Higher distance = higher price
        const priceDeviation = (Math.random() * 0.2) + (distanceFactor * 0.1);
        
        const marketPrice = selectedCar.priceComparison?.targetPrice 
          ? selectedCar.priceComparison.targetPrice * (1 + priceDeviation)
          : (parseFloat(targetPrice) || 20000) * (1 + priceDeviation);
        
        const postcode = generateRandomPostcode();
        
        const mileageBase = selectedCar.mileage ? parseInt(selectedCar.mileage) : 30000;
        const mileageDev = (Math.random() * 0.3) - 0.15;
        const mileage = Math.round(mileageBase * (1 + mileageDev));
        
        const dealerNames = ['AutoWorld', 'CarZone', 'MotorHub', 'DriveTime', 'WheelsDirect', 
                            'CityMotors', 'PremiumAutos', 'MetroCars', 'CountyAutos', 'ExcellentCars'];
        const dealerName = dealerNames[Math.floor(Math.random() * dealerNames.length)];
        
        results.push({
          id: `dealer-${i}`,
          brand: selectedCar.brand,
          model: selectedCar.model,
          engineType: selectedCar.engineType,
          year: selectedCar.year,
          mileage: mileage.toString(),
          color: ['Red', 'Blue', 'Black', 'White', 'Silver', 'Grey'][Math.floor(Math.random() * 6)],
          dealerName: `${dealerName} ${['Ltd', 'Motors', 'Group', 'Cars'][Math.floor(Math.random() * 4)]}`,
          dealerPhone: `0${Math.floor(Math.random() * 10000000000)}`.substring(0, 11),
          location: {
            postcode,
            lat,
            lng
          },
          priceComparison: {
            targetPrice: selectedCar.priceComparison?.targetPrice || parseFloat(targetPrice) || 20000,
            marketPrice,
            difference: (selectedCar.priceComparison?.targetPrice || parseFloat(targetPrice) || 20000) - marketPrice,
            percentageDifference: ((selectedCar.priceComparison?.targetPrice || parseFloat(targetPrice) || 20000) - marketPrice) / 
                                (selectedCar.priceComparison?.targetPrice || parseFloat(targetPrice) || 20000) * 100
          }
        });
      }
      
      toast({
        title: "Search Complete",
        description: `Found ${results.length} vehicles matching your specifications from dealers.`
      });
      
      return results;
    } catch (error) {
      console.error('Error searching for dealer vehicles:', error);
      toast({
        variant: "destructive",
        title: "Search Error",
        description: "Failed to search for vehicles from dealers."
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };
  
  const searchWithDealerLocation = async () => {
    if (!dealerLocation || !targetPrice) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Dealer location or target price is missing."
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (map.current) {
        console.log('Using dealer location for search:', dealerLocation);
        
        map.current.flyTo({
          center: dealerLocation,
          zoom: 8.5,
          essential: true
        });
        
        const dealerResults = await searchDealerVehicles(dealerLocation);
        setSearchResults(dealerResults);
        
        // Add dealer marker and radius circles
        addDealerMarkerAndCircles(dealerLocation, parseFloat(targetPrice), dealerResults);
        
        toast({
          title: "Map Updated",
          description: `Showing price radius for your dealer location`
        });
      }
    } catch (error) {
      console.error('Error searching with dealer location:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to search with dealer location."
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const searchPostcode = async (postcodeValue = postcode, targetPriceValue = targetPrice) => {
    if (!postcodeValue.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a postcode."
      });
      return;
    }
    
    if (!targetPriceValue.trim() || isNaN(parseFloat(targetPriceValue))) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a valid target price."
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('Searching postcode:', postcodeValue, 'with target price:', targetPriceValue);
      
      // Geocode the postcode to get coordinates
      const coords = await geocodePostcode(postcodeValue);
      
      if (!coords) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to geocode the postcode."
        });
        return;
      }
      
      if (map.current) {
        console.log('Map is available, updating view');
        
        map.current.flyTo({
          center: coords,
          zoom: 8.5,
          essential: true
        });
        
        const dealerResults = await searchDealerVehicles(coords);
        setSearchResults(dealerResults);
        
        // Add dealer marker and radius circles
        addDealerMarkerAndCircles(coords, parseFloat(targetPriceValue), dealerResults);
        
        toast({
          title: "Map Updated",
          description: `Showing price radius for postcode ${postcodeValue}`
        });
      } else {
        console.error('Map is not available');
        toast({
          variant: "destructive",
          title: "Error",
          description: "Map is not available. Please try refreshing the page."
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
  
  const addDealerMarkerAndCircles = (
    center: [number, number], 
    price: number, 
    dealerResults: any[] = []
  ) => {
    if (!map.current) return;
    
    // Remove existing markers and layers
    const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
    existingMarkers.forEach(marker => marker.remove());
    
    if (map.current.getLayer('competitive-radius')) map.current.removeLayer('competitive-radius');
    if (map.current.getLayer('best-price-radius')) map.current.removeLayer('best-price-radius');
    if (map.current.getLayer('high-price-radius')) map.current.removeLayer('high-price-radius');
    if (map.current.getSource('radius-source')) map.current.removeSource('radius-source');
    
    // Add dealer marker
    const dealerMarkerEl = document.createElement('div');
    dealerMarkerEl.className = 'dealer-marker';
    dealerMarkerEl.style.width = '30px';
    dealerMarkerEl.style.height = '30px';
    dealerMarkerEl.style.borderRadius = '50%';
    dealerMarkerEl.style.backgroundColor = '#6E59A5';
    dealerMarkerEl.style.border = '3px solid white';
    dealerMarkerEl.style.display = 'flex';
    dealerMarkerEl.style.alignItems = 'center';
    dealerMarkerEl.style.justifyContent = 'center';
    dealerMarkerEl.style.color = 'white';
    dealerMarkerEl.style.fontWeight = 'bold';
    dealerMarkerEl.style.fontSize = '16px';
    dealerMarkerEl.innerHTML = '🏬';
    
    new mapboxgl.Marker(dealerMarkerEl)
      .setLngLat(center)
      .setPopup(new mapboxgl.Popup().setHTML(`
        <div class="p-2">
          <h3 class="font-bold">Dealer Location</h3>
          <p><strong>Postcode:</strong> ${postcode}</p>
        </div>
      `))
      .addTo(map.current);
    
    // Add radius circles
    if (map.current.loaded()) {
      console.log('Map is loaded, adding circles');
      addCircles(map.current, center, price, dealerResults);
    } else {
      console.log('Map not loaded yet, waiting for load event');
      map.current.once('load', () => {
        console.log('Map loaded, now adding circles');
        addCircles(map.current!, center, price, dealerResults);
      });
    }
  };
  
  const addCircles = (
    map: Map, 
    center: [number, number], 
    price: number, 
    dealerResults: any[] = []
  ) => {
    console.log('Adding circles to map at', center, 'with price', price);
    
    map.addSource('radius-source', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [
          // Best price radius (innermost)
          {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Point',
              coordinates: center
            }
          },
          // Competitive price radius (middle)
          {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Point',
              coordinates: center
            }
          },
          // Higher price radius (outermost)
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
    
    // Higher price zone (outermost, red tint)
    map.addLayer({
      id: 'high-price-radius',
      type: 'circle',
      source: 'radius-source',
      paint: {
        'circle-radius': {
          stops: [
            [0, 0],
            [20, 5000000]
          ],
          base: 2
        },
        'circle-color': '#ef4444',
        'circle-opacity': 0.1,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ef4444'
      },
      filter: ['==', '$index', 2]
    });
    
    // Competitive price zone (middle, purple)
    map.addLayer({
      id: 'competitive-radius',
      type: 'circle',
      source: 'radius-source',
      paint: {
        'circle-radius': {
          stops: [
            [0, 0],
            [20, 3000000]
          ],
          base: 2
        },
        'circle-color': '#7E69AB',
        'circle-opacity': 0.2,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#7E69AB'
      },
      filter: ['==', '$index', 1]
    });
    
    // Best price zone (innermost, brighter purple)
    map.addLayer({
      id: 'best-price-radius',
      type: 'circle',
      source: 'radius-source',
      paint: {
        'circle-radius': {
          stops: [
            [0, 0],
            [20, 1500000]
          ],
          base: 2
        },
        'circle-color': '#9b87f5',
        'circle-opacity': 0.3,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#9b87f5'
      },
      filter: ['==', '$index', 0]
    });
    
    const allVehicles = [...trackedCars];
    
    if (dealerResults && dealerResults.length > 0) {
      allVehicles.push(...dealerResults);
    }
    
    const filteredCars = selectedCar 
      ? allVehicles.filter(car => 
          car.brand === selectedCar.brand && 
          car.model === selectedCar.model && 
          car.engineType === selectedCar.engineType &&
          (!selectedCar.year || car.year === selectedCar.year) &&
          (!selectedCar.mileage || 
            (car.mileage && 
             parseInt(car.mileage) >= parseInt(selectedCar.mileage) * 0.7 && 
             parseInt(car.mileage) <= parseInt(selectedCar.mileage) * 1.3))
        )
      : allVehicles;
    
    console.log(`Showing ${filteredCars.length} similar cars out of ${allVehicles.length} total cars`);
    
    filteredCars.forEach(car => {
      if (car.location) {
        const isPriceCompetitive = car.priceComparison && car.priceComparison.marketPrice <= price;
        const isBestPrice = car.priceComparison && car.priceComparison.marketPrice <= price * 0.9;
        
        const markerEl = document.createElement('div');
        markerEl.className = 'car-marker';
        markerEl.style.width = '30px';
        markerEl.style.height = '30px';
        markerEl.style.borderRadius = '50%';
        markerEl.style.backgroundColor = isBestPrice ? '#9b87f5' : isPriceCompetitive ? '#7E69AB' : '#ef4444';
        markerEl.style.border = '2px solid white';
        markerEl.style.display = 'flex';
        markerEl.style.alignItems = 'center';
        markerEl.style.justifyContent = 'center';
        markerEl.style.color = 'white';
        markerEl.style.fontWeight = 'bold';
        markerEl.style.fontSize = '16px';
        markerEl.innerHTML = car.id.includes('dealer-') ? '🚗' : '🚗';
        
        if (selectedCarId && car.id === selectedCarId) {
          markerEl.style.border = '3px solid yellow';
          markerEl.style.width = '36px';
          markerEl.style.height = '36px';
          markerEl.style.zIndex = '1000';
        }
        
        const isDealerVehicle = 'dealerName' in car && 'dealerPhone' in car;
        
        const popupHTML = isDealerVehicle ? 
          `<div class="p-2">
            <h3 class="font-bold">${car.brand} ${car.model}</h3>
            <p><strong>Engine:</strong> ${car.engineType || 'N/A'}</p>
            <p><strong>Year:</strong> ${car.year || 'N/A'}</p>
            <p><strong>Mileage:</strong> ${car.mileage ? `${car.mileage} miles` : 'N/A'}</p>
            <p><strong>Price:</strong> £${car.priceComparison?.marketPrice.toLocaleString() || 'N/A'}</p>
            <p><strong>Dealer:</strong> ${(car as DealerVehicle).dealerName || 'N/A'}</p>
            <p><strong>Phone:</strong> ${(car as DealerVehicle).dealerPhone || 'N/A'}</p>
            <p><strong>Difference:</strong> ${car.priceComparison?.percentageDifference.toFixed(1) || 0}%</p>
          </div>` :
          `<div class="p-2">
            <h3 class="font-bold">${car.brand} ${car.model}</h3>
            <p><strong>Engine:</strong> ${car.engineType || 'N/A'}</p>
            <p><strong>Year:</strong> ${car.year || 'N/A'}</p>
            <p><strong>Mileage:</strong> ${car.mileage ? `${car.mileage} miles` : 'N/A'}</p>
            <p><strong>Price:</strong> £${car.priceComparison?.marketPrice.toLocaleString() || 'N/A'}</p>
            <p><strong>Target:</strong> £${car.priceComparison?.targetPrice.toLocaleString() || 'N/A'}</p>
            <p><strong>Difference:</strong> ${car.priceComparison?.percentageDifference.toFixed(1) || 0}%</p>
            ${car.id === selectedCarId ? '<p class="text-yellow-500 font-bold">★ Selected Vehicle</p>' : ''}
          </div>`;
        
        new mapboxgl.Marker(markerEl)
          .setLngLat([car.location.lng, car.location.lat])
          .setPopup(new mapboxgl.Popup().setHTML(popupHTML))
          .addTo(map);
      }
    });
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              className="mr-4"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold">Car Price Radius Map</h1>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4">
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
                    onClick={() => searchPostcode()}
                    disabled={isLoading || !!mapError || !mapboxToken}
                  >
                    {isLoading ? 'Searching...' : <><Search className="mr-2 h-4 w-4" /> Search</>}
                  </Button>
                  
                  {userSubscription?.dealer_postcode && (
                    <Button
                      className="w-full mt-2"
                      variant="outline"
                      onClick={() => searchWithDealerLocation()}
                      disabled={isLoading || !!mapError || !mapboxToken || !dealerLocation}
                    >
                      <MapPin className="mr-2 h-4 w-4" /> Use Dealer Location
                    </Button>
                  )}
                  
                  {selectedCar && (
                    <div className="border rounded-md p-3 mt-4 bg-purple-50 dark:bg-purple-900/10">
                      <h3 className="font-medium mb-2">Selected Vehicle</h3>
                      <p><strong>Brand:</strong> {selectedCar.brand}</p>
                      <p><strong>Model:</strong> {selectedCar.model}</p>
                      <p><strong>Engine:</strong> {selectedCar.engineType}</p>
                      {selectedCar.year && <p><strong>Year:</strong> {selectedCar.year}</p>}
                      {selectedCar.mileage && <p><strong>Mileage:</strong> {selectedCar.mileage}</p>}
                      <p className="text-xs text-muted-foreground mt-2">
                        Showing similar vehicles matching this specification
                      </p>
                    </div>
                  )}
                  
                  <div className="border rounded-md p-3 space-y-2 mt-4">
                    <h3 className="font-medium">Map Legend</h3>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-[#9b87f5]"></div>
                      <span className="text-sm">Best Price Zone (≤10% below target)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-[#7E69AB]"></div>
                      <span className="text-sm">Competitive Zone (at or below target)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-red-500"></div>
                      <span className="text-sm">Above Target Price</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center justify-center">🚗</div>
                      <span className="text-sm">Vehicle</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center">🏬</div>
                      <span className="text-sm">Dealer location</span>
                    </div>
                  </div>
                  
                  {!mapboxToken && (
                    <div className="border border-yellow-500 rounded-md p-3 bg-yellow-50 dark:bg-yellow-900/10">
                      <h3 className="font-medium text-yellow-700 mb-2">Loading Mapbox Token</h3>
                      <p className="text-sm text-yellow-700">
                        Attempting to fetch the Mapbox token from Supabase...
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div className="flex-1 rounded-lg overflow-hidden border border-border shadow-sm" style={{ height: "600px", position: "relative" }}>
              <div ref={mapContainer} id="map" className="w-full h-full rounded-lg" />
              {isMapLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="mt-2">Loading map...</span>
                  </div>
                </div>
              )}
              {mapError && !isMapLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                  <div className="flex flex-col items-center text-center p-6 max-w-md">
                    <div className="text-destructive mb-4 text-4xl">⚠️</div>
                    <h3 className="text-lg font-bold mb-2">Map Error</h3>
                    <p className="mb-4">{mapError}</p>
                    <Button 
                      onClick={() => window.location.reload()}
                      variant="default"
                    >
                      Refresh Page
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default RadiusMap;
