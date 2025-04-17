import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { ScrapedListing } from '@/integrations/supabase/database.types';

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
  trim?: string;
  engineSize?: string;
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
  trim?: string;
  engineSize?: string;
}

export { type ScrapedListing };

export const useTrackedCars = (userId: string | undefined) => {
  const [trackedCars, setTrackedCars] = useState<TrackedCar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scrapedListings, setScrapedListings] = useState<Record<string, ScrapedListing[]>>({});
  const [isScrapingCar, setIsScrapingCar] = useState(false);
  const [scrapingError, setScrapingError] = useState<string | null>(null);

  const fetchTrackedCars = useCallback(async (userId: string) => {
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
        let trim;
        let engineSize;
        
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
          trim,
          engineSize,
          tags: item.tags || [],
          cheapest_price: item.cheapest_price || item.last_price
        };
      }) || [];
      
      setTrackedCars(carsWithTags);
      
      for (const car of carsWithTags) {
        try {
          const listings = await fetchScrapedListings(car.id);
          setScrapedListings(prev => ({
            ...prev,
            [car.id]: listings
          }));
        } catch (err) {
          console.error(`Error fetching listings for car ${car.id}:`, err);
        }
      }
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
  }, []);

  const fetchScrapedListings = async (carId: string): Promise<ScrapedListing[]> => {
    try {
      console.log(`Fetching scraped listings for car ID: ${carId}`);
      const { data, error } = await supabase.rpc('get_scraped_listings_for_car', {
        car_id: carId
      });
        
      if (error) {
        console.error("Error fetching scraped listings:", error);
        return [];
      }
      
      console.log(`Found ${data?.length || 0} listings for car ID: ${carId}`);
      return data || [];
    } catch (error) {
      console.error("Error fetching scraped listings:", error);
      return [];
    }
  };

  const triggerScraping = async (carId: string): Promise<ScrapedListing[]> => {
    try {
      setIsScrapingCar(true);
      setScrapingError(null);
      
      if (!carId) {
        throw new Error("Invalid car ID");
      }
      
      const car = trackedCars.find(c => c.id === carId);
      if (!car) {
        throw new Error("Car not found");
      }
      
      console.log(`Starting scraping for car ID: ${carId} (${car.brand} ${car.model})`);
      
      toast({
        title: "Search Started",
        description: `Searching for the cheapest ${car.brand} ${car.model}. This may take a moment.`
      });
      
      const promises = [
        supabase.functions.invoke('car-dealer-scraper', {
          body: { vehicle_id: carId }
        }),
        
        car.year && car.mileage ? 
          supabase.functions.invoke('cazoo', {
            body: { 
              make: car.brand, 
              model: car.model,
              trim: car.trim || '',
              colour: car.color || '',
              year: parseInt(car.year, 10),
              mileage: parseInt(car.mileage, 10)
            }
          }) : 
          Promise.resolve({ data: { success: true, data: [] }, error: null })
      ];
      
      const [dealerResult, cazooResult] = await Promise.all(promises);
      
      if (dealerResult.error) {
        console.error("Error invoking car-dealer-scraper:", dealerResult.error);
        throw dealerResult.error;
      }
      
      if (cazooResult.error) {
        console.warn("Error invoking cazoo scraper:", cazooResult.error);
      }
      
      console.log("Scraper functions response:", { dealerResult, cazooResult });
      
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      console.log("Fetching updated listings after scraping");
      const listings = await fetchScrapedListings(carId);
      
      setScrapedListings(prev => ({
        ...prev,
        [carId]: listings
      }));
      
      if (userId) {
        await fetchTrackedCars(userId);
      }
      
      if (listings.length > 0) {
        const cheapestListing = listings[0];
        toast({
          title: "Search Complete",
          description: `Found ${listings.length} similar ${car.brand} ${car.model} vehicles, cheapest: £${cheapestListing.price.toLocaleString()}`
        });
      } else {
        toast({
          title: "Search Complete",
          description: "No similar vehicles found at this time. Try again later."
        });
      }
      
      return listings;
    } catch (error: any) {
      console.error("Error triggering car scraping:", error);
      setScrapingError(error.message || "Unknown error");
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
      
      if (!car.mileage || car.mileage.trim() === '') {
        toast({
          title: "Missing information",
          description: "Please enter the vehicle mileage",
          variant: "destructive"
        });
        return false;
      }

      if (!car.price || car.price.trim() === '') {
        toast({
          title: "Missing information",
          description: "Please enter a target price",
          variant: "destructive"
        });
        return false;
      }
      
      const mileageParam = car.mileage ? `mil=${car.mileage}` : '';
      const yearParam = car.year ? `year=${car.year}` : '';
      const colorParam = car.color ? `color=${car.color}` : '';
      const priceParam = car.price ? `price=${car.price}` : '';
      const trimParam = car.trim ? `trim=${car.trim}` : '';
      const engineParam = car.engineSize ? `engine=${car.engineSize}` : '';
      
      const params = [mileageParam, yearParam, colorParam, priceParam, trimParam, engineParam]
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
          cheapest_price: null
        })
        .select();
        
      if (error) {
        throw error;
      }
      
      let newCarId = null;
      if (data && data.length > 0) {
        newCarId = data[0].id;
        
        await fetchTrackedCars(userId);
        
        if (newCarId) {
          setTimeout(async () => {
            try {
              console.log("Auto-triggering scraping for newly added car:", newCarId);
              await triggerScraping(newCarId);
              
              if (userId) {
                await fetchTrackedCars(userId);
              }
            } catch (e) {
              console.error("Error auto-triggering scraping for new car:", e);
            }
          }, 1000);
        }
      } else {
        await fetchTrackedCars(userId);
      }
      
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
      const trimParam = carToUpdate.trim ? `trim=${carToUpdate.trim}` : '';
      const engineParam = carToUpdate.engineSize ? `engine=${carToUpdate.engineSize}` : '';
      
      const params = [mileageParam, yearParam, colorParam, priceParam, trimParam, engineParam]
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
      
      console.log(`Attempting to delete car with ID: ${id} using database function`);
      
      const { data, error } = await supabase.rpc('delete_car_completely', {
        car_id: id
      });
      
      if (error) {
        console.error('Error deleting car using database function:', error);
        throw error;
      }
      
      console.log('Successfully deleted car and all associated listings');
      
      await fetchTrackedCars(userId);
      
      setScrapedListings(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
      
      toast({
        title: "Vehicle removed",
        description: "The vehicle has been removed from your tracking list."
      });
      
      return true;
    } catch (error: any) {
      console.error('Full error details:', error);
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
  }, [userId, fetchTrackedCars]);

  return {
    trackedCars,
    isLoading,
    addCar: useCallback(async (car: AddCarParams) => {
      try {
        if (!userId) return false;
        
        if (!car.mileage || car.mileage.trim() === '') {
          toast({
            title: "Missing information",
            description: "Please enter the vehicle mileage",
            variant: "destructive"
          });
          return false;
        }

        if (!car.price || car.price.trim() === '') {
          toast({
            title: "Missing information",
            description: "Please enter a target price",
            variant: "destructive"
          });
          return false;
        }
        
        const mileageParam = car.mileage ? `mil=${car.mileage}` : '';
        const yearParam = car.year ? `year=${car.year}` : '';
        const colorParam = car.color ? `color=${car.color}` : '';
        const priceParam = car.price ? `price=${car.price}` : '';
        const trimParam = car.trim ? `trim=${car.trim}` : '';
        const engineParam = car.engineSize ? `engine=${car.engineSize}` : '';
        
        const params = [mileageParam, yearParam, colorParam, priceParam, trimParam, engineParam]
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
            cheapest_price: null
          })
          .select();
          
        if (error) {
          throw error;
        }
        
        let newCarId = null;
        if (data && data.length > 0) {
          newCarId = data[0].id;
          
          await fetchTrackedCars(userId);
          
          if (newCarId) {
            setTimeout(async () => {
              try {
                console.log("Auto-triggering scraping for newly added car:", newCarId);
                await triggerScraping(newCarId);
                
                if (userId) {
                  await fetchTrackedCars(userId);
                }
              } catch (e) {
                console.error("Error auto-triggering scraping for new car:", e);
              }
            }, 1000);
          }
        } else {
          await fetchTrackedCars(userId);
        }
        
        return true;
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to add vehicle. Please try again later.",
          variant: "destructive"
        });
        return false;
      }
    }, [userId, fetchTrackedCars, triggerScraping]),
    deleteCar: useCallback(async (id: string) => {
      try {
        if (!userId) return false;
        
        console.log(`Attempting to delete car with ID: ${id} using database function`);
        
        const { data, error } = await supabase.rpc('delete_car_completely', {
          car_id: id
        });
        
        if (error) {
          console.error('Error deleting car using database function:', error);
          throw error;
        }
        
        console.log('Successfully deleted car and all associated listings');
        
        await fetchTrackedCars(userId);
        
        setScrapedListings(prev => {
          const updated = { ...prev };
          delete updated[id];
          return updated;
        });
        
        toast({
          title: "Vehicle removed",
          description: "The vehicle has been removed from your tracking list."
        });
        
        return true;
      } catch (error: any) {
        console.error('Full error details:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to remove vehicle. Please try again later.",
          variant: "destructive"
        });
        return false;
      }
    }, [userId, fetchTrackedCars]),
    addTag: useCallback(async (carId: string, tag: string) => {
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
    }, [userId, trackedCars, fetchTrackedCars]),
    removeTag: useCallback(async (carId: string, tagToRemove: string) => {
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
    }, [userId, trackedCars, fetchTrackedCars]),
    updateCarDetails: useCallback(async (carId: string, mileage: string, price: string) => {
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
        const trimParam = carToUpdate.trim ? `trim=${carToUpdate.trim}` : '';
        const engineParam = carToUpdate.engineSize ? `engine=${carToUpdate.engineSize}` : '';
        
        const params = [mileageParam, yearParam, colorParam, priceParam, trimParam, engineParam]
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
    }, [userId, trackedCars, fetchTrackedCars]),
    refreshCars: useCallback(() => userId && fetchTrackedCars(userId), [userId, fetchTrackedCars]),
    scrapedListings,
    triggerScraping,
    isScrapingCar,
    scrapingError,
    getListingsForCar: useCallback((carId: string) => scrapedListings[carId] || [], [scrapedListings])
  };
};
