
import React, { useState, useEffect, useRef } from 'react';
import { toast } from "@/components/ui/use-toast";
import { supabase, getMapboxToken } from "@/integrations/supabase/client";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { TrackedCar } from '@/hooks/use-tracked-cars';
import { CarLocation } from '@/types/car-types';
import { ScrapedListing } from '@/integrations/supabase/database.types';

interface RadiusMapProps {
  carId: string;
  targetPrice: string;
  dealerLocation?: CarLocation;
}

const RadiusMap = ({ carId, targetPrice, dealerLocation }: RadiusMapProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [scrapedListings, setScrapedListings] = useState<ScrapedListing[]>([]);
  const [mapboxToken, setMapboxToken] = useState('');
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [lng, setLng] = useState(-70.9);
  const [lat, setLat] = useState(42.35);
  const [zoom, setZoom] = useState(9);

  useEffect(() => {
    const fetchToken = async () => {
      const token = await getMapboxToken();
      setMapboxToken(token);
      mapboxgl.accessToken = token;
    };
    fetchToken();
  }, []);

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

    map.current.on('move', () => {
      if (map.current) {
        setLng(parseFloat(map.current.getCenter().lng.toFixed(4)));
        setLat(parseFloat(map.current.getCenter().lat.toFixed(4)));
        setZoom(parseFloat(map.current.getZoom().toFixed(2)));
      }
    });
  }, [mapboxToken]);

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
      
      if (!carId) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No car ID provided. Please select a car first."
        });
        return;
      }
      
      const { data, error } = await supabase.rpc('get_scraped_listings_for_car', {
        car_id: carId
      });
        
      if (error) throw error;
      
      setScrapedListings(data || []);
      
      // If we have listings and dealer location, show them on the map
      if (data && data.length > 0 && dealerLocation) {
        console.log(`Found ${data.length} scraped listings for car ${carId}`);
        addDealerMarkerAndCircles(dealerLocation, parseFloat(targetPrice), data);
      } else if (data && data.length > 0 && !dealerLocation) {
        toast({
          title: "Warning",
          description: "Dealer location not provided. Map view may be limited.",
          variant: "destructive"
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
    <div>
      <div className="sidebar">
        Longitude: {lng} | Latitude: {lat} | Zoom: {zoom}
      </div>
      <div ref={mapContainer} className="map-container" style={{ height: '400px' }} />
      <div>
        <button onClick={fetchScrapedListings} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Load Scraped Listings'}
        </button>
      </div>
    </div>
  );
};

export default RadiusMap;
