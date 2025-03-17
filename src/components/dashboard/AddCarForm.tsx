
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "@/components/ui/use-toast";

// Define the car schema that ensures brand, model, and engineType are required
const carSchema = z.object({
  registrationNumber: z.string().optional(),
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  engineType: z.string().min(1, "Engine type is required"),
  mileage: z.string().optional(),
});

// Type for the props
interface AddCarFormProps {
  onSubmit: (values: z.infer<typeof carSchema>) => Promise<void>;
  isAddingCar: boolean;
  canAddMoreCars: boolean;
}

const carBrands = [
  "Audi", "BMW", "Chevrolet", "Dodge", "Ford", "Honda", "Hyundai", "Jaguar", 
  "Kia", "Lexus", "Mazda", "Mercedes-Benz", "Nissan", "Porsche", "Subaru", 
  "Tesla", "Toyota", "Volkswagen", "Volvo"
];

// Engine types map for each brand and model
const engineTypesMap: Record<string, Record<string, string[]>> = {
  "Ford": {
    "Fiesta": [
      "EcoBoost 1.0 100PS", 
      "EcoBoost 1.0 125PS", 
      "EcoBoost 1.0 155PS", 
      "EcoBoost 1.5 200PS"
    ],
    "Focus": [
      "EcoBoost 1.0 125PS", 
      "EcoBoost 1.5 150PS", 
      "EcoBoost 1.5 182PS", 
      "EcoBlue 1.5 95PS", 
      "EcoBlue 1.5 120PS"
    ],
    "Mustang": [
      "2.3L EcoBoost 310HP",
      "5.0L V8 460HP",
      "5.2L V8 760HP Shelby GT500"
    ]
  },
  "BMW": {
    "1 Series": [
      "118i 1.5L 136HP",
      "120i 2.0L 178HP",
      "M135i 2.0L 306HP"
    ],
    "3 Series": [
      "318i 2.0L 156HP", 
      "320i 2.0L 184HP", 
      "330i 2.0L 258HP", 
      "320d 2.0L 190HP", 
      "330d 3.0L 286HP"
    ],
    "5 Series": [
      "520i 2.0L 184HP",
      "530i 2.0L 252HP",
      "540i 3.0L 340HP",
      "520d 2.0L 190HP",
      "530d 3.0L 286HP"
    ]
  },
  "Audi": {
    "A1": [
      "30 TFSI 1.0L 110HP",
      "35 TFSI 1.5L 150HP",
      "40 TFSI 2.0L 200HP"
    ],
    "A3": [
      "30 TFSI 1.0L 110HP",
      "35 TFSI 1.5L 150HP",
      "40 TFSI 2.0L 190HP",
      "S3 2.0L 310HP"
    ],
    "A4": [
      "35 TFSI 2.0L 150HP",
      "40 TFSI 2.0L 190HP",
      "45 TFSI 2.0L 245HP",
      "35 TDI 2.0L 163HP",
      "S4 3.0L 347HP"
    ]
  },
  "Tesla": {
    "Model 3": [
      "Standard Range RWD 283HP",
      "Long Range AWD 346HP",
      "Performance AWD 455HP"
    ],
    "Model S": [
      "Long Range AWD 670HP",
      "Plaid AWD 1,020HP"
    ],
    "Model X": [
      "Long Range AWD 670HP",
      "Plaid AWD 1,020HP"
    ],
    "Model Y": [
      "Standard Range RWD 283HP",
      "Long Range AWD 384HP",
      "Performance AWD 455HP"
    ]
  }
};

// Default engine types if no specific ones are defined
const defaultEngineTypes = [
  "Petrol", "Diesel", "Hybrid", "Electric", "Plug-in Hybrid", "CNG", "LPG"
];

// Get models for a specific brand
const getModelsByBrand = (brand: string) => {
  if (engineTypesMap[brand]) {
    return Object.keys(engineTypesMap[brand]);
  }
  return ["Other"];
};

// Get engine types for a specific brand and model
const getEngineTypesByBrandAndModel = (brand: string, model: string) => {
  if (engineTypesMap[brand] && engineTypesMap[brand][model]) {
    return engineTypesMap[brand][model];
  }
  return defaultEngineTypes;
};

// Mock registration lookup service
const lookupRegistrationDetails = async (regNumber: string) => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Normalize registration to lowercase for matching
  const reg = regNumber.toLowerCase().trim();
  
  // Predefined registration patterns for demo
  if (reg.startsWith('f')) {
    return {
      success: true,
      data: {
        brand: "Ford",
        model: "Fiesta",
        engineType: "EcoBoost 1.0 125PS",
        mileage: "28500"
      }
    };
  } else if (reg.startsWith('b')) {
    return {
      success: true,
      data: {
        brand: "BMW",
        model: "3 Series",
        engineType: "320d 2.0L 190HP",
        mileage: "32000"
      }
    };
  } else if (reg.startsWith('a')) {
    return {
      success: true,
      data: {
        brand: "Audi",
        model: "A4",
        engineType: "35 TFSI 2.0L 150HP",
        mileage: "45000"
      }
    };
  } else if (reg.startsWith('t')) {
    return {
      success: true,
      data: {
        brand: "Tesla",
        model: "Model 3",
        engineType: "Standard Range RWD 283HP",
        mileage: "15000"
      }
    };
  } else if (reg.startsWith('v')) {
    return {
      success: true,
      data: {
        brand: "Volkswagen",
        model: "Golf",
        engineType: "Petrol",
        mileage: "50000"
      }
    };
  } else {
    // If no pattern matches, return a failed lookup
    return {
      success: false,
      error: "Vehicle not found"
    };
  }
};

export const AddCarForm = ({ onSubmit, isAddingCar, canAddMoreCars }: AddCarFormProps) => {
  const [isLookingUp, setIsLookingUp] = useState(false);
  
  const form = useForm<z.infer<typeof carSchema>>({
    resolver: zodResolver(carSchema),
    defaultValues: {
      registrationNumber: "",
      brand: "",
      model: "",
      engineType: "",
      mileage: ""
    }
  });

  // Get the selected brand to show relevant models
  const selectedBrand = form.watch("brand");
  const selectedModel = form.watch("model");
  const models = getModelsByBrand(selectedBrand);
  const specificEngineTypes = getEngineTypesByBrandAndModel(selectedBrand, selectedModel);

  // Function to look up car details from registration number
  const lookupCarDetails = async (regNumber: string) => {
    if (!regNumber.trim()) {
      toast({
        title: "Registration required",
        description: "Please enter a valid registration number",
        variant: "destructive"
      });
      return false;
    }
    
    setIsLookingUp(true);
    
    try {
      const result = await lookupRegistrationDetails(regNumber);
      
      if (result.success) {
        const { brand, model, engineType, mileage } = result.data;
        
        // Set form values using the retrieved data
        form.setValue("brand", brand);
        form.setValue("model", model);
        form.setValue("engineType", engineType);
        form.setValue("mileage", mileage);
        
        toast({
          title: "Vehicle found",
          description: "Registration details have been loaded"
        });
        
        return true;
      } else {
        toast({
          title: "Vehicle not found",
          description: result.error || "Could not find vehicle with that registration",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error("Error looking up car details:", error);
      toast({
        title: "Lookup failed",
        description: "Could not retrieve vehicle information. Please enter details manually.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLookingUp(false);
    }
  };

  return (
    <Card className="mb-10">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Add a Vehicle to Track</CardTitle>
          <CardDescription>Enter vehicle details or registration number to monitor</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form id="add-car-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField 
              control={form.control} 
              name="registrationNumber" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registration Number (Optional)</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input 
                        placeholder="Enter registration number" 
                        {...field} 
                        disabled={isAddingCar || !canAddMoreCars || isLookingUp} 
                      />
                    </FormControl>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => lookupCarDetails(field.value || "")}
                      disabled={!field.value || isAddingCar || !canAddMoreCars || isLookingUp}
                    >
                      {isLookingUp ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Looking up...
                        </>
                      ) : (
                        "Lookup"
                      )}
                    </Button>
                  </div>
                  <FormDescription>
                    Enter the vehicle's registration number to automatically fetch details (try numbers starting with A, B, F, T, or V)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )} 
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <FormField 
                control={form.control} 
                name="brand" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand</FormLabel>
                    <Select 
                      disabled={isAddingCar || !canAddMoreCars || isLookingUp}
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Reset model and engine type when brand changes
                        form.setValue("model", "");
                        form.setValue("engineType", "");
                      }} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select brand" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {carBrands.map(brand => (
                          <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} 
              />

              <FormField 
                control={form.control} 
                name="model" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model</FormLabel>
                    <Select 
                      disabled={!selectedBrand || isAddingCar || !canAddMoreCars || isLookingUp}
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Reset engine type when model changes
                        form.setValue("engineType", "");
                      }} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {models.map(model => (
                          <SelectItem key={model} value={model}>{model}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} 
              />

              <FormField 
                control={form.control} 
                name="engineType" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Engine Type</FormLabel>
                    <Select 
                      disabled={!selectedModel || isAddingCar || !canAddMoreCars || isLookingUp}
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select engine type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {specificEngineTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} 
              />

              <FormField 
                control={form.control} 
                name="mileage" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mileage</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="e.g. 45000" 
                        {...field} 
                        disabled={isAddingCar || !canAddMoreCars || isLookingUp} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} 
              />
            </div>

            <Button type="submit" className="w-full mt-4" disabled={isAddingCar || !canAddMoreCars || isLookingUp}>
              {isAddingCar ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>Add Vehicle</>
              )}
            </Button>
          </form>
        </Form>
        {!canAddMoreCars && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-400">
            <p className="text-sm">
              You've reached your vehicle tracking limit. Please remove some vehicles or upgrade your plan to add more.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
