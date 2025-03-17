
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export interface TrackedCar {
  id: string;
  brand: string;
  model: string;
  engineType: string;
  registrationNumber?: string;
  mileage?: string;
  year?: string;
  color?: string;
  last_price: number | null;
  last_checked: string | null;
  created_at: string;
  tags: string[];
}

// Create an interface for adding cars to ensure consistent types
export interface AddCarParams {
  brand: string;
  model: string;
  engineType: string;
  registrationNumber?: string;
  mileage?: string;
  year?: string;
  color?: string;
}

export const useTrackedCars = (userId: string | undefined) => {
  const [trackedCars, setTrackedCars] = useState<TrackedCar[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      
      // Convert URL data to car data (in a real app, this would be a separate table)
      // Here we're adapting the existing data structure to our new car model
      const carsWithTags = data?.map(item => {
        // Try to extract car info from URL - this is just for demonstration
        // In real implementation we'd have proper car data stored
        const urlParts = item.url.split('/');
        const brand = urlParts[0] || 'Unknown Brand';
        const model = urlParts[1] || 'Unknown Model';
        const engineType = urlParts[2] || 'Unknown Engine';
        let registrationNumber;
        let mileage;
        let year;
        let color;
        
        // Check for params in the URL
        if (urlParts[3]) {
          const params = urlParts[3].split('&');
          params.forEach(param => {
            if (param.includes('reg=')) {
              registrationNumber = param.split('reg=')[1];
            }
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
          registrationNumber,
          mileage,
          year,
          color,
          tags: item.tags || []
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

  // Update the addCar function to use our new AddCarParams interface with all fields
  const addCar = async (car: AddCarParams) => {
    try {
      if (!userId) return false;
      
      // Format car data as a URL for storage in existing table
      // In a real implementation, we'd create a proper cars table
      const registrationParam = car.registrationNumber ? `reg=${car.registrationNumber}` : '';
      const mileageParam = car.mileage ? `mil=${car.mileage}` : '';
      const yearParam = car.year ? `year=${car.year}` : '';
      const colorParam = car.color ? `color=${car.color}` : '';
      
      const params = [registrationParam, mileageParam, yearParam, colorParam]
        .filter(Boolean)
        .join('&');
      
      const carUrl = `${car.brand}/${car.model}/${car.engineType}${params ? `/${params}` : ''}`;
      
      const { data, error } = await supabase
        .from('tracked_urls')
        .insert({
          user_id: userId,
          url: carUrl,
          tags: []
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
      
      // Find the car and its current tags
      const carToUpdate = trackedCars.find(car => car.id === carId);
      if (!carToUpdate) return false;
      
      // Add the new tag if it doesn't already exist
      const updatedTags = [...(carToUpdate.tags || [])];
      if (!updatedTags.includes(tag)) {
        updatedTags.push(tag);
      }
      
      // Update the car with the new tags
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
      
      // Find the car and its current tags
      const carToUpdate = trackedCars.find(car => car.id === carId);
      if (!carToUpdate) return false;
      
      // Filter out the tag to remove
      const updatedTags = (carToUpdate.tags || []).filter(tag => tag !== tagToRemove);
      
      // Update the car with the new tags
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
    refreshCars: () => userId && fetchTrackedCars(userId)
  };
};
