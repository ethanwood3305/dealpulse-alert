
import { Car, SearchIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VehicleLookupForm } from './vehicle-lookup/VehicleLookupForm';
import { useTrackedCars } from '@/hooks/use-tracked-cars';
import { VehicleLookupProps } from '@/types/vehicle-lookup-types';
import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from '@/hooks/use-organization';

export function VehicleLookup({ userId, onCarAdded, addCar }: VehicleLookupProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { addCar: defaultAddCar } = useTrackedCars(userId);
  const { currentOrganization } = useOrganization(userId);

  // Use the passed in addCar function if provided, otherwise use the default
  const handleAddCar = addCar || defaultAddCar;

  const handleLookup = async (registration: string) => {
    setIsLoading(true);
    
    try {
      console.log("Starting vehicle lookup for registration:", registration);
      
      const { data, error } = await supabase.functions.invoke('vehicle-lookup', {
        method: 'POST',
        body: { registration: registration.trim() }
      });

      console.log("Vehicle lookup response received:", data);
      
      if (error) {
        console.error("Supabase function error:", error);
        toast({
          title: "Error",
          description: "Registration lookup failed. Please try again.",
          variant: "destructive"
        });
        return;
      }

      if (data.error) {
        console.error("Error from Vehicle API:", data.error);
        toast({
          title: "Lookup Failed",
          description: data.error || "Failed to find vehicle details.",
          variant: "destructive"
        });
        return;
      }

      if (data.vehicle) {
        console.log("Vehicle data received:", data.vehicle);
        toast({
          title: "Vehicle Found",
          description: `Found details for ${data.vehicle.make} ${data.vehicle.model}`,
          variant: "default"
        });
        
        if (!currentOrganization) {
          console.warn("No current organization found");
          toast({
            title: "Warning",
            description: "Could not determine your dealership. The vehicle will be added without a dealership association.",
            variant: "destructive"
          });
        }
        
        // Auto-add the vehicle if we have all the required information
        const success = await handleAddCar({
          brand: data.vehicle.make,
          model: data.vehicle.model,
          engineType: data.vehicle.fuelType,
          color: data.vehicle.color,
          year: data.vehicle.year,
          mileage: "0",
          price: "0",
          initialTags: [registration.toUpperCase().replace(/\s+/g, '')],
          trim: data.vehicle.trim,
          engineSize: data.vehicle.engineSize?.toString(),
          organization_id: currentOrganization?.id || ''
        });
        
        if (success) {
          toast({
            title: "Vehicle Added",
            description: `${data.vehicle.make} ${data.vehicle.model} has been added to your tracked vehicles.`
          });
          
          if (onCarAdded) {
            onCarAdded();
          }
        }
      } else {
        console.error("No vehicle data in response");
        toast({
          title: "Error",
          description: 'Registration lookup failed. Please try again.',
          variant: "destructive"
        });
      }
    } catch (err: any) {
      console.error('Vehicle lookup error:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to lookup vehicle details. Please try again.",
        variant: "destructive"
      });
    } finally {
      console.log("Vehicle lookup completed, resetting loading state");
      setIsLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden border-none shadow-lg">
      <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">Add a Vehicle</CardTitle>
            <CardDescription className="text-muted-foreground mt-1">
              Track a vehicle by searching for UK registration details
            </CardDescription>
          </div>
          <div className="bg-primary/10 p-3 rounded-full">
            <Car className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <VehicleLookupForm 
          onSubmit={handleLookup} 
          isLoading={isLoading}
          onCarAdded={onCarAdded} 
          addCar={handleAddCar} 
        />
      </CardContent>
    </Card>
  );
}
