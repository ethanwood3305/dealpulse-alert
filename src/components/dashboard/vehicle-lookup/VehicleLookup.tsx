
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTrackedCars, AddCarParams } from "@/hooks/use-tracked-cars";
import { VehicleDetails, VehicleLookupProps } from "@/types/vehicle-lookup-types";
import { VehicleLookupForm } from "./VehicleLookupForm";
import { VehicleLoadingState } from "./VehicleLoadingState";
import { VehicleErrorAlert } from "./VehicleErrorAlert";
import { DiagnosticInfo } from "./DiagnosticInfo";
import { VehicleResultCard } from "./VehicleResultCard";

export const VehicleLookup = ({ userId, onCarAdded }: VehicleLookupProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [vehicleDetails, setVehicleDetails] = useState<VehicleDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [diagnosticInfo, setDiagnosticInfo] = useState<any>(null);
  const { addCar } = useTrackedCars(userId);

  const handleLookup = async (registration: string) => {
    setIsLoading(true);
    setError(null);
    setErrorCode(null);
    setVehicleDetails(null);
    setDiagnosticInfo(null);

    try {
      console.log("Starting vehicle lookup for registration:", registration);
      
      const { data, error } = await supabase.functions.invoke('vehicle-lookup', {
        method: 'POST',
        body: { registration }
      });

      console.log("Vehicle lookup response received:", data);
      
      if (error) {
        console.error("Supabase function error:", error);
        throw new Error(error.message || 'Failed to lookup vehicle');
      }

      if (data.diagnostic) {
        console.log("Diagnostic information received:", data.diagnostic);
        setDiagnosticInfo(data.diagnostic);
      }

      if (data.error) {
        console.error("Error from Vehicle API:", data.error);
        setError(data.error);
        if (data.code) {
          setErrorCode(data.code);
        }
        return;
      }

      if (data.vehicle) {
        console.log("Vehicle data received:", data.vehicle);
        setVehicleDetails(data.vehicle);
        toast({
          title: "Vehicle Found",
          description: `Found details for ${data.vehicle.make} ${data.vehicle.model}`,
          variant: "default"
        });
      } else {
        console.error("No vehicle data in response");
        setError('No vehicle data returned');
      }
    } catch (err: any) {
      console.error('Vehicle lookup error:', err);
      
      if (err.message && (err.message.includes('timeout') || err.message.includes('timed out'))) {
        setError('The vehicle lookup service timed out. Please try again later.');
        setErrorCode('TIMEOUT');
        
        toast({
          title: "Lookup Timed Out",
          description: "The vehicle lookup service is taking too long to respond. Please try again later.",
          variant: "destructive"
        });
      } else {
        setError(err.message || 'An error occurred during vehicle lookup');
        
        toast({
          title: "Lookup Failed",
          description: err.message || "Failed to lookup vehicle details",
          variant: "destructive"
        });
      }
    } finally {
      console.log("Vehicle lookup completed, resetting loading state");
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
        mileage: vehicleDetails.weight
      };

      const success = await addCar(carParams);
      
      if (success) {
        toast({
          title: "Vehicle Added",
          description: `${vehicleDetails.make} ${vehicleDetails.model} has been added to your tracked vehicles.`
        });
        
        // Reset form
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
          Quickly find vehicle details using UK registration number
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <VehicleLookupForm 
            onSubmit={handleLookup}
            isLoading={isLoading}
          />

          {isLoading && <VehicleLoadingState />}

          {error && !isLoading && (
            <VehicleErrorAlert error={error} errorCode={errorCode} />
          )}

          {diagnosticInfo && !isLoading && (
            <DiagnosticInfo diagnosticInfo={diagnosticInfo} />
          )}

          {vehicleDetails && !isLoading && (
            <VehicleResultCard 
              vehicleDetails={vehicleDetails} 
              onAddCar={handleAddCar} 
            />
          )}
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground border-t pt-4">
        Data provided by UKVehicleData. Registration should be a UK vehicle registration number.
      </CardFooter>
    </Card>
  );
};
