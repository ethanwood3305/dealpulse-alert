
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

const engineTypes = [
  "Petrol", "Diesel", "Hybrid", "Electric", "Plug-in Hybrid", "CNG", "LPG"
];

// These would typically come from an API based on the selected brand
const getModelsByBrand = (brand: string) => {
  const modelMap: Record<string, string[]> = {
    "Audi": ["A1", "A3", "A4", "A6", "Q3", "Q5", "Q7", "e-tron"],
    "BMW": ["1 Series", "3 Series", "5 Series", "7 Series", "X1", "X3", "X5", "i3", "i8"],
    "Ford": ["Fiesta", "Focus", "Mustang", "Explorer", "F-150", "Ranger"],
    "Tesla": ["Model 3", "Model S", "Model X", "Model Y", "Cybertruck"],
    "Toyota": ["Corolla", "Camry", "RAV4", "Highlander", "Prius", "Land Cruiser"]
  };
  
  return modelMap[brand] || ["Other"];
};

// Engine types by brand and model
const getEngineTypesByBrandAndModel = (brand: string, model: string) => {
  if (brand === "Ford" && model === "Fiesta") {
    return [
      "EcoBoost 1.0 100PS", 
      "EcoBoost 1.0 125PS", 
      "EcoBoost 1.0 155PS", 
      "EcoBoost 1.5 200PS"
    ];
  }
  
  if (brand === "Ford" && model === "Focus") {
    return [
      "EcoBoost 1.0 125PS", 
      "EcoBoost 1.5 150PS", 
      "EcoBoost 1.5 182PS", 
      "EcoBlue 1.5 95PS", 
      "EcoBlue 1.5 120PS"
    ];
  }
  
  if (brand === "BMW" && model === "3 Series") {
    return [
      "318i 2.0L 156HP", 
      "320i 2.0L 184HP", 
      "330i 2.0L 258HP", 
      "320d 2.0L 190HP", 
      "330d 3.0L 286HP"
    ];
  }
  
  return engineTypes;
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
      // In a real application, you would call an API here to look up the details
      // For now, we'll simulate a call with a timeout and dummy data based on the reg number
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate different car data based on first character of reg number
      const firstChar = regNumber.trim().charAt(0).toLowerCase();
      
      if (firstChar === 'a') {
        form.setValue("brand", "Audi");
        form.setValue("model", "A4");
        form.setValue("engineType", "Petrol");
        form.setValue("mileage", "45000");
      } else if (firstChar === 'b') {
        form.setValue("brand", "BMW");
        form.setValue("model", "3 Series");
        form.setValue("engineType", "320d 2.0L 190HP");
        form.setValue("mileage", "32000");
      } else if (firstChar === 'f') {
        form.setValue("brand", "Ford");
        form.setValue("model", "Fiesta");
        form.setValue("engineType", "EcoBoost 1.0 125PS");
        form.setValue("mileage", "28500");
      } else if (firstChar === 't') {
        form.setValue("brand", "Tesla");
        form.setValue("model", "Model 3");
        form.setValue("engineType", "Electric");
        form.setValue("mileage", "15000");
      } else {
        form.setValue("brand", "Volkswagen");
        form.setValue("model", "Other");
        form.setValue("engineType", "Petrol");
        form.setValue("mileage", "50000");
      }
      
      toast({
        title: "Vehicle found",
        description: "Registration details have been loaded"
      });
      
      return true;
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
                    Enter the vehicle's registration number to automatically fetch details
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
                      onValueChange={field.onChange} 
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
                      onValueChange={field.onChange} 
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
                      disabled={isAddingCar || !canAddMoreCars || isLookingUp}
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
