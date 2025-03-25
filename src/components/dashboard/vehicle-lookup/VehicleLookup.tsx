
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [mileage, setMileage] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [mileageError, setMileageError] = useState<string | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);
  const { addCar, trackedCars } = useTrackedCars(userId);

  const handleLookup = async (registration: string) => {
    setIsLoading(true);
    setError(null);
    setErrorCode(null);
    setVehicleDetails(null);
    setDiagnosticInfo(null);
    setMileageError(null);
    setPriceError(null);

    // Validate registration format
    const regPattern = /^[A-Z0-9]{2,8}$/i;
    const cleanRegistration = registration.replace(/\s+/g, '').toUpperCase();
    
    if (!regPattern.test(cleanRegistration)) {
      setError('Registration number format is invalid');
      setErrorCode('INVALID_REGISTRATION');
      setIsLoading(false);
      return;
    }

    // Check if the registration already exists as a tag for this user
    const regExists = trackedCars.some(car => 
      car.tags && car.tags.some(tag => tag.toUpperCase() === cleanRegistration)
    );

    if (regExists) {
      setError('This registration is already tracked in your account');
      setErrorCode('REGISTRATION_EXISTS');
      setIsLoading(false);
      toast({
        title: "Registration already exists",
        description: "You are already tracking a vehicle with this registration number.",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log("Starting vehicle lookup for registration:", registration);
      
      const { data, error } = await supabase.functions.invoke('vehicle-lookup', {
        method: 'POST',
        body: { registration: cleanRegistration }
      });

      console.log("Vehicle lookup response received:", data);
      
      if (error) {
        console.error("Supabase function error:", error);
        setError("Registration lookup failed. Please try again.");
        setErrorCode('LOOKUP_FAILED');
        return;
      }

      if (data.diagnostic) {
        console.log("Diagnostic information received:", data.diagnostic);
        setDiagnosticInfo(data.diagnostic);
      }

      if (data.error) {
        console.error("Error from Vehicle API:", data.error);
        
        // Handle specific error cases
        if (data.code === "API_ERROR" && data.apiResponse && 
            (data.apiResponse.StatusCode === "KeyInvalid" || 
             (data.error && data.error.includes("not recognised as a valid vehicle registration")))) {
          setError("Invalid registration provided.");
          setErrorCode("API_ERROR");
        } else {
          setError(data.error);
          if (data.code) {
            setErrorCode(data.code);
          } else {
            setErrorCode('LOOKUP_FAILED');
          }
        }
        return;
      }

      if (data.vehicle) {
        console.log("Vehicle data received:", data.vehicle);
        setVehicleDetails({
          ...data.vehicle,
          // Store the original registration for use as a tag
          originalRegistration: cleanRegistration
        });
        toast({
          title: "Vehicle Found",
          description: `Found details for ${data.vehicle.make} ${data.vehicle.model}`,
          variant: "default"
        });
      } else {
        console.error("No vehicle data in response");
        setError('Registration lookup failed. Please try again.');
        setErrorCode('LOOKUP_FAILED');
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
        setError("Registration lookup failed. Please try again.");
        setErrorCode('LOOKUP_FAILED');
        
        toast({
          title: "Lookup Failed",
          description: "Failed to lookup vehicle details. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      console.log("Vehicle lookup completed, resetting loading state");
      setIsLoading(false);
    }
  };

  const validateInputs = (): boolean => {
    let isValid = true;
    
    // Reset error states
    setMileageError(null);
    setPriceError(null);
    
    // Validate mileage
    if (!mileage || mileage.trim() === '') {
      setMileageError('Mileage is required');
      isValid = false;
    } else {
      const mileageNum = Number(mileage);
      if (isNaN(mileageNum) || mileageNum < 0) {
        setMileageError('Mileage must be a positive number');
        isValid = false;
      }
    }
    
    // Validate price
    if (!price || price.trim() === '') {
      setPriceError('Target price is required');
      isValid = false;
    } else {
      const priceNum = Number(price);
      if (isNaN(priceNum) || priceNum <= 0) {
        setPriceError('Price must be a positive number');
        isValid = false;
      }
    }
    
    return isValid;
  };

  const handleAddCar = async () => {
    if (!vehicleDetails) return;

    // Validate inputs before proceeding
    if (!validateInputs()) {
      toast({
        title: "Missing information",
        description: "Please check the required fields and try again",
        variant: "destructive"
      });
      return;
    }

    try {
      // Add registration as a tag
      const regTag = vehicleDetails.originalRegistration || vehicleDetails.registration.toUpperCase().replace(/\s+/g, '');
      
      // Get engine size from the vehicle details
      const engineSize = vehicleDetails.engineSize ? vehicleDetails.engineSize.toString() : undefined;
      
      const carParams: AddCarParams = {
        brand: vehicleDetails.make,
        model: vehicleDetails.model,
        engineType: vehicleDetails.fuelType,
        color: vehicleDetails.color,
        year: vehicleDetails.year,
        mileage: mileage,
        price: price,
        initialTags: [regTag], // Add registration as initial tag
        trim: vehicleDetails.trim, // Add trim
        engineSize: engineSize // Add engine size
      };

      const success = await addCar(carParams);
      
      if (success) {
        toast({
          title: "Vehicle Added",
          description: `${vehicleDetails.make} ${vehicleDetails.model} ${vehicleDetails.trim || ''} has been added to your tracked vehicles.`.trim()
        });
        
        // Reset form
        setVehicleDetails(null);
        setMileage('');
        setPrice('');
        setMileageError(null);
        setPriceError(null);
        
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
        <CardTitle>Add Vehicle by Registration</CardTitle>
        <CardDescription>
          Enter a UK registration number to automatically find and track the vehicle
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
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="mileage" className="flex items-center">
                    Mileage <span className="text-destructive ml-1">*</span>
                  </Label>
                  <Input
                    id="mileage"
                    placeholder="Enter current mileage"
                    type="number"
                    value={mileage}
                    onChange={(e) => setMileage(e.target.value)}
                    className={`mt-1 ${mileageError ? 'border-destructive' : ''}`}
                    required
                  />
                  {mileageError && (
                    <p className="text-destructive text-xs mt-1">{mileageError}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="price" className="flex items-center">
                    Target Price (£) <span className="text-destructive ml-1">*</span>
                  </Label>
                  <Input
                    id="price"
                    placeholder="Enter target price"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className={`mt-1 ${priceError ? 'border-destructive' : ''}`}
                    required
                  />
                  {priceError && (
                    <p className="text-destructive text-xs mt-1">{priceError}</p>
                  )}
                </div>
              </div>
              <VehicleResultCard 
                vehicleDetails={vehicleDetails} 
                onAddCar={handleAddCar} 
              />
            </>
          )}
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground border-t pt-4">
        Data provided by UKVehicleData. Registration should be a UK vehicle registration number.
      </CardFooter>
    </Card>
  );
};
