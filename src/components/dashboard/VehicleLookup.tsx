import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Loader2, SearchIcon, AlertCircle, Info, AlertTriangle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTrackedCars, AddCarParams } from "@/hooks/use-tracked-cars";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

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
  doorCount?: string;
  bodyStyle?: string;
  transmission?: string;
  weight?: string;
}

export const VehicleLookup = ({ userId, onCarAdded }: VehicleLookupProps) => {
  const [registration, setRegistration] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [vehicleDetails, setVehicleDetails] = useState<VehicleDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [diagnosticInfo, setDiagnosticInfo] = useState<any>(null);
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
    setErrorCode(null);
    setVehicleDetails(null);
    setDiagnosticInfo(null);

    try {
      console.log("Starting vehicle lookup for registration:", registration.trim());
      
      const { data, error } = await supabase.functions.invoke('vehicle-lookup', {
        method: 'POST',
        body: { registration: registration.trim() }
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
          Quickly find vehicle details using UK registration number
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
              disabled={isLoading}
            />
            <Button 
              onClick={handleLookup} 
              disabled={isLoading || !registration.trim()}
              className={isLoading ? "bg-muted text-muted-foreground" : ""}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <SearchIcon className="h-4 w-4 mr-2" />
              )}
              {isLoading ? "Searching..." : "Lookup"}
            </Button>
          </div>

          {isLoading && (
            <div className="flex flex-col items-center justify-center p-6 space-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Searching for vehicle details...</p>
              <p className="text-xs text-muted-foreground">This may take a few moments</p>
            </div>
          )}

          {error && !isLoading && (
            <Alert variant={
              errorCode === "VEHICLE_NOT_FOUND" ? "default" : 
              errorCode === "TIMEOUT" ? "default" : "destructive"
            }>
              {errorCode === "VEHICLE_NOT_FOUND" ? (
                <AlertTriangle className="h-4 w-4" />
              ) : errorCode === "TIMEOUT" ? (
                <Clock className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertTitle>
                {errorCode === "VEHICLE_NOT_FOUND" 
                  ? "Vehicle not found" 
                  : errorCode === "SERVICE_UNAVAILABLE"
                  ? "Service unavailable"
                  : errorCode === "TIMEOUT"
                  ? "Service timed out"
                  : "Lookup failed"}
              </AlertTitle>
              <AlertDescription>
                {error}
                {errorCode === "VEHICLE_NOT_FOUND" && (
                  <p className="mt-2 text-sm">
                    Please check the registration number and try again. Make sure it's a valid UK registration.
                  </p>
                )}
                {errorCode === "SERVICE_UNAVAILABLE" && (
                  <p className="mt-2 text-sm">
                    The vehicle lookup service is currently unavailable. Please try again later.
                  </p>
                )}
                {errorCode === "TIMEOUT" && (
                  <p className="mt-2 text-sm">
                    The vehicle lookup service is taking too long to respond. Please try again in a few minutes.
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}

          {diagnosticInfo && !isLoading && (
            <div className="border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 rounded-md p-3 text-xs font-mono">
              <details>
                <summary className="cursor-pointer text-amber-800 dark:text-amber-400 font-medium">Debug information</summary>
                <pre className="mt-2 whitespace-pre-wrap overflow-auto max-h-40 text-amber-700 dark:text-amber-300">
                  {JSON.stringify(diagnosticInfo, null, 2)}
                </pre>
              </details>
            </div>
          )}

          {vehicleDetails && !isLoading && (
            <div className="border rounded-md p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">
                  {vehicleDetails.make} {vehicleDetails.model}
                </h3>
                <span className="bg-primary/10 text-primary font-mono px-2 py-1 rounded text-sm">
                  {vehicleDetails.registration}
                </span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
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
                
                {vehicleDetails.doorCount && (
                  <div>
                    <p className="text-muted-foreground">Doors</p>
                    <p className="font-medium">{vehicleDetails.doorCount}</p>
                  </div>
                )}
                {vehicleDetails.bodyStyle && (
                  <div>
                    <p className="text-muted-foreground">Body Style</p>
                    <p className="font-medium">{vehicleDetails.bodyStyle}</p>
                  </div>
                )}
                {vehicleDetails.transmission && (
                  <div>
                    <p className="text-muted-foreground">Transmission</p>
                    <p className="font-medium">{vehicleDetails.transmission}</p>
                  </div>
                )}
                {vehicleDetails.weight && (
                  <div>
                    <p className="text-muted-foreground">Weight (kg)</p>
                    <p className="font-medium">{vehicleDetails.weight}</p>
                  </div>
                )}
              </div>
              
              <Button onClick={handleAddCar} className="w-full">
                Add to Tracked Vehicles
              </Button>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground border-t pt-4">
        Data provided by UKVehicleData. Registration should be a UK vehicle registration number.
      </CardFooter>
    </Card>
  );
};
