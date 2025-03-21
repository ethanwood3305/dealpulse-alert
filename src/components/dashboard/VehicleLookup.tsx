
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Loader2, SearchIcon, AlertCircleIcon, Info, ServerCrash } from "lucide-react";
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
  const [isUsingMockData, setIsUsingMockData] = useState(false);
  const [diagnosticInfo, setDiagnosticInfo] = useState<any>(null);
  const [serverlessEnvironmentIssue, setServerlessEnvironmentIssue] = useState(false);
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
    setDiagnosticInfo(null);
    setServerlessEnvironmentIssue(false);

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

      if (data.serverless_environment) {
        setServerlessEnvironmentIssue(true);
      }

      if (data.diagnostic) {
        console.log("Diagnostic information:", data.diagnostic);
        setDiagnosticInfo(data.diagnostic);
        
        // Check if this is likely a serverless environment issue
        if (data.serverless_environment || 
            (data.diagnostic.is_network_error || data.diagnostic.is_tls_error) || 
            data.error?.includes('network restrictions')) {
          setServerlessEnvironmentIssue(true);
        }
      }

      if (data.error) {
        console.error("Error from Vehicle API:", data.error);
        setError(data.error);
        
        // If we still got vehicle data (mock data), show it despite the error
        if (data.vehicle && (data.source === 'mock_data' || data.warning)) {
          setVehicleDetails(data.vehicle);
          setIsUsingMockData(true);
          toast({
            title: "Using Demo Data",
            description: "API connection failed. Showing sample vehicle data instead.",
            variant: "default"
          });
        }
        return;
      }

      if (data.vehicle) {
        setVehicleDetails(data.vehicle);
        
        // Check if we're using mock data
        if (data.warning || data.source === 'mock_data' || data.serverless_environment) {
          setIsUsingMockData(true);
          toast({
            title: "Using Demo Data",
            description: "Using sample vehicle data due to API connection limitations.",
            variant: "default"
          });
        } else {
          toast({
            title: "Vehicle Found",
            description: `Found details for ${data.vehicle.make} ${data.vehicle.model}`,
            variant: "default"
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

          {serverlessEnvironmentIssue && (
            <Alert className="bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400">
              <ServerCrash className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertTitle>Demo Mode Active</AlertTitle>
              <AlertDescription className="text-blue-700 dark:text-blue-500">
                The vehicle lookup is currently running in demo mode. In this preview environment, 
                external API calls are restricted. Sample data is shown instead of live vehicle data.
              </AlertDescription>
            </Alert>
          )}

          {error && !serverlessEnvironmentIssue && (
            <Alert variant="destructive">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertTitle>Lookup failed</AlertTitle>
              <AlertDescription>
                {error.includes("forbidden") || error.includes("Forbidden") || error.includes("Authentication") || error.includes("API connection error") ? 
                  "The vehicle lookup API access is currently unavailable. This could be due to network restrictions in the serverless environment. The system will show demo data instead." : 
                  error}
              </AlertDescription>
            </Alert>
          )}

          {isUsingMockData && vehicleDetails && (
            <Alert className="bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-400">
              <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertTitle>Using demonstration data</AlertTitle>
              <AlertDescription className="text-amber-700 dark:text-amber-500">
                Showing sample vehicle data. In a production environment, this would display real vehicle data.
              </AlertDescription>
            </Alert>
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
                
                {/* Additional details */}
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
        Vehicle lookup powered by UKVehicleData API. In demo mode, sample data is displayed.
      </CardFooter>
    </Card>
  );
};
