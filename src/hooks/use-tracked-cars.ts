import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export interface TrackedCar {
  id: string;
  brand: string;
  model: string;
  engineType: string;
  mileage?: string;
  year?: string;
  color?: string;
  last_price: number | null;
  cheapest_price?: number | null;
  last_checked: string | null;
  created_at: string;
  tags: string[];
  url: string;
}

export interface AddCarParams {
  brand: string;
  model: string;
  engineType: string;
  mileage?: string;
  year?: string;
  color?: string;
  price?: string;
  initialTags?: string[];
}

export interface ScrapedListing {
  id: string;
  tracked_car_id: string;
  dealer_name: string;
  url: string;
  title: string;
  price: number;
  mileage: number;
  year: number;
  color: string;
  location: string;
  lat: number;
  lng: number;
  is_cheapest: boolean;
  created_at: string;
}

export const useTrackedCars = (userId: string | undefined) => {
  const [trackedCars, setTrackedCars] = useState<TrackedCar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scrapedListings, setScrapedListings] = useState<Record<string, ScrapedListing[]>>({});
  const [isScrapingCar, setIsScrapingCar] = useState(false);

  const fetchTrackedCars = async (userId: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('tracked_urls')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      const carsWithTags = data?.map(item => {
        const urlParts = item.url.split('/');
        const brand = urlParts[0] || 'Unknown Brand';
        const model = urlParts[1] || 'Unknown Model';
        const engineType = urlParts[2] || 'Unknown Engine';
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
          ...item,
          brand,
          model, 
          engineType,
          mileage,
          year,
          color,
          tags: item.tags || [],
          cheapest_price: item.cheapest_price || item.last_price
        };
      }) || [];
      
      setTrackedCars(carsWithTags);
    } catch (error) {
      console.error("Error fetching tracked cars:", error);
      toast({
        title: "Error",
        description: "Failed to load your tracked vehicles. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchScrapedListings = async (carId: string) => {
    try {
      const { data, error } = await supabase
        .from('scraped_vehicle_listings')
        .select('*')
        .eq('tracked_car_id', carId)
        .order('price', { ascending: true });
        
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error("Error fetching scraped listings:", error);
      return [];
    }
  };

  const triggerScraping = async (carId: string) => {
    try {
      setIsScrapingCar(true);
      
      const { error } = await supabase.functions.invoke('car-dealer-scraper', {
        body: { vehicle_id: carId }
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Scraping Started",
        description: "We're searching for similar vehicles. This may take a moment."
      });
      
      // Wait a bit to allow scraping to complete
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Fetch the scraped listings
      const listings = await fetchScrapedListings(carId);
      
      setScrapedListings(prev => ({
        ...prev,
        [carId]: listings
      }));
      
      // Refresh the car data to get the updated cheapest price
      if (userId) {
        await fetchTrackedCars(userId);
      }
      
      toast({
        title: "Vehicle Search Complete",
        description: `Found ${listings.length} similar vehicles from dealers.`
      });
      
      return listings;
    } catch (error: any) {
      console.error("Error triggering car scraping:", error);
      toast({
        title: "Error",
        description: "Failed to search for similar vehicles. Please try again later.",
        variant: "destructive"
      });
      return [];
    } finally {
      setIsScrapingCar(false);
    }
  };

  const addCar = async (car: AddCarParams) => {
    try {
      if (!userId) return false;
      
      const mileageParam = car.mileage ? `mil=${car.mileage}` : '';
      const yearParam = car.year ? `year=${car.year}` : '';
      const colorParam = car.color ? `color=${car.color}` : '';
      const priceParam = car.price ? `price=${car.price}` : '';
      
      const params = [mileageParam, yearParam, colorParam, priceParam]
        .filter(Boolean)
        .join('&');
      
      const carUrl = `${car.brand}/${car.model}/${car.engineType}${params ? `/${params}` : ''}`;
      
      let lastPrice = null;
      if (car.price) {
        lastPrice = parseInt(car.price, 10);
        if (isNaN(lastPrice)) {
          lastPrice = null;
        }
      }
      
      const { data, error } = await supabase
        .from('tracked_urls')
        .insert({
          user_id: userId,
          url: carUrl,
          tags: car.initialTags || [],
          last_price: lastPrice,
          cheapest_price: lastPrice
        })
        .select();
        
      if (error) {
        throw error;
      }
      
      await fetchTrackedCars(userId);
      return true;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add vehicle. Please try again later.",
        variant: "destructive"
      });
      return false;
    }
  };

  const updateCarDetails = async (carId: string, mileage: string, price: string) => {
    try {
      if (!userId) return false;
      
      const carToUpdate = trackedCars.find(car => car.id === carId);
      if (!carToUpdate) return false;
      
      const urlParts = carToUpdate.url.split('/');
      const brand = urlParts[0];
      const model = urlParts[1];
      const engineType = urlParts[2];
      
      const mileageParam = mileage ? `mil=${mileage}` : '';
      const yearParam = carToUpdate.year ? `year=${carToUpdate.year}` : '';
      const colorParam = carToUpdate.color ? `color=${carToUpdate.color}` : '';
      const priceParam = price ? `price=${price}` : '';
      
      const params = [mileageParam, yearParam, colorParam, priceParam]
        .filter(Boolean)
        .join('&');
      
      const newUrl = `${brand}/${model}/${engineType}${params ? `/${params}` : ''}`;
      
      let lastPrice = null;
      if (price) {
        lastPrice = parseFloat(price);
        if (isNaN(lastPrice)) {
          lastPrice = null;
        }
      }
      
      let cheapestPrice = carToUpdate.cheapest_price;
      if (lastPrice !== null) {
        if (cheapestPrice === null || lastPrice < cheapestPrice) {
          cheapestPrice = lastPrice;
        }
      }
      
      const { error } = await supabase
        .from('tracked_urls')
        .update({
          url: newUrl,
          last_price: lastPrice,
          cheapest_price: cheapestPrice
        })
        .eq('id', carId);
        
      if (error) {
        throw error;
      }
      
      await fetchTrackedCars(userId);
      return true;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update vehicle. Please try again later.",
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteCar = async (id: string) => {
    try {
      if (!userId) return false;
      
      const { error } = await supabase
        .from('tracked_urls')
        .delete()
        .eq('id', id);
        
      if (error) {
        throw error;
      }
      
      await fetchTrackedCars(userId);
      toast({
        title: "Vehicle removed",
        description: "The vehicle has been removed from your tracking list."
      });
      
      return true;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove vehicle. Please try again later.",
        variant: "destructive"
      });
      return false;
    }
  };

  const addTag = async (carId: string, tag: string) => {
    try {
      if (!userId) return false;
      
      const carToUpdate = trackedCars.find(car => car.id === carId);
      if (!carToUpdate) return false;
      
      const updatedTags = [...(carToUpdate.tags || [])];
      if (!updatedTags.includes(tag)) {
        updatedTags.push(tag);
      }
      
      const { error } = await supabase
        .from('tracked_urls')
        .update({ tags: updatedTags })
        .eq('id', carId);
        
      if (error) {
        throw error;
      }
      
      await fetchTrackedCars(userId);
      return true;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add tag. Please try again later.",
        variant: "destructive"
      });
      return false;
    }
  };

  const removeTag = async (carId: string, tagToRemove: string) => {
    try {
      if (!userId) return false;
      
      const carToUpdate = trackedCars.find(car => car.id === carId);
      if (!carToUpdate) return false;
      
      const updatedTags = (carToUpdate.tags || []).filter(tag => tag !== tagToRemove);
      
      const { error } = await supabase
        .from('tracked_urls')
        .update({ tags: updatedTags })
        .eq('id', carId);
        
      if (error) {
        throw error;
      }
      
      await fetchTrackedCars(userId);
      return true;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove tag. Please try again later.",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    if (userId) {
      fetchTrackedCars(userId);
    }
  }, [userId]);

  return {
    trackedCars,
    isLoading,
    addCar,
    deleteCar,
    addTag,
    removeTag,
    updateCarDetails,
    refreshCars: () => userId && fetchTrackedCars(userId),
    scrapedListings,
    triggerScraping,
    isScrapingCar,
    getListingsForCar: (carId: string) => scrapedListings[carId] || []
  };
};
