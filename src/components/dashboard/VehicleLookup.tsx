
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Loader2, SearchIcon, AlertCircleIcon, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTrackedCars, AddCarParams } from "@/hooks/use-tracked-cars";

interface VehicleLookupProps {
  userId: string;
  onCarAdded?: () => void;
}

interface VehicleDetails {
  registration: string;
  make: string;
  model: string;
  color: string;
  fuelType: string;
  year: string;
  engineSize: string;
  motStatus: string;
  motExpiryDate: string | null;
  taxStatus: string;
  taxDueDate: string | null;
}

export const VehicleLookup = ({ userId, onCarAdded }: VehicleLookupProps) => {
  const [registration, setRegistration] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [vehicleDetails, setVehicleDetails] = useState<VehicleDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUsingMockData, setIsUsingMockData] = useState(false);
  const { addCar } = useTrackedCars(userId);

  const handleLookup = async () => {
    if (!registration.trim()) {
      toast({
        title: "Error",
        description: "Please enter a registration number",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setVehicleDetails(null);
    setIsUsingMockData(false);

    try {
      console.log("Calling vehicle-lookup function with registration:", registration.trim());
      
      const { data, error } = await supabase.functions.invoke('vehicle-lookup', {
        method: 'POST',
        body: { registration: registration.trim() }
      });

      console.log("Vehicle lookup response:", data);
      
      if (error) {
        console.error("Supabase function error:", error);
        throw new Error(error.message || 'Failed to lookup vehicle');
      }

      if (data.error) {
        setError(data.error);
        return;
      }

      if (data.vehicle) {
        setVehicleDetails(data.vehicle);
        
        // Check if we're using mock data
        if (data.warning || data.source === 'mock_data') {
          setIsUsingMockData(true);
          toast({
            title: "Using Mock Data",
            description: "We couldn't connect to the DVLA API, so we're showing sample data instead.",
            variant: "warning"
          });
        }
      } else {
        setError('No vehicle data returned');
      }
    } catch (err: any) {
      console.error('Vehicle lookup error:', err);
      setError(err.message || 'An error occurred during vehicle lookup');
      toast({
        title: "Lookup Failed",
        description: err.message || "Failed to lookup vehicle details",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCar = async () => {
    if (!vehicleDetails) return;

    try {
      const carParams: AddCarParams = {
        brand: vehicleDetails.make,
        model: vehicleDetails.model,
        engineType: vehicleDetails.fuelType,
        color: vehicleDetails.color,
        year: vehicleDetails.year,
        mileage: vehicleDetails.engineSize
      };

      const success = await addCar(carParams);
      
      if (success) {
        toast({
          title: "Vehicle Added",
          description: `${vehicleDetails.make} ${vehicleDetails.model} has been added to your tracked vehicles.`
        });
        
        setRegistration('');
        setVehicleDetails(null);
        
        if (onCarAdded) {
          onCarAdded();
        }
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to add vehicle to tracking",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vehicle Lookup</CardTitle>
        <CardDescription>
          Quickly find vehicle details using registration number
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Enter registration (e.g., AB12CDE)"
              value={registration}
              onChange={(e) => setRegistration(e.target.value)}
              className="flex-1"
              maxLength={8}
            />
            <Button onClick={handleLookup} disabled={isLoading || !registration.trim()}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <SearchIcon className="h-4 w-4 mr-2" />
              )}
              Lookup
            </Button>
          </div>

          {isLoading && (
            <div className="flex justify-center p-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 p-4 rounded-md flex items-start space-x-2">
              <AlertCircleIcon className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Lookup failed</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
          )}

          {isUsingMockData && vehicleDetails && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex items-start space-x-2 dark:bg-amber-900/30 dark:border-amber-800">
              <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5 dark:text-amber-400" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-400">Using demonstration data</p>
                <p className="text-sm text-amber-700 dark:text-amber-500">
                  The actual DVLA API couldn't be reached. Mock data is being shown instead.
                </p>
              </div>
            </div>
          )}

          {vehicleDetails && (
            <div className="border rounded-md p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">
                  {vehicleDetails.make} {vehicleDetails.model}
                </h3>
                <span className="bg-primary/10 text-primary font-mono px-2 py-1 rounded text-sm">
                  {vehicleDetails.registration}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Year</p>
                  <p className="font-medium">{vehicleDetails.year}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Color</p>
                  <p className="font-medium">{vehicleDetails.color}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fuel Type</p>
                  <p className="font-medium">{vehicleDetails.fuelType}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Engine Size</p>
                  <p className="font-medium">{vehicleDetails.engineSize}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">MOT Status</p>
                  <p className="font-medium">{vehicleDetails.motStatus}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tax Status</p>
                  <p className="font-medium">{vehicleDetails.taxStatus}</p>
                </div>
              </div>
              
              <Button onClick={handleAddCar} className="w-full">
                Add to Tracked Vehicles
              </Button>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground border-t pt-4">
        Data provided by DVLA Vehicle Enquiry Service. Registration should be a UK vehicle registration number.
      </CardFooter>
    </Card>
  );
};
