import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Define the car schema that ensures brand, model, and engineType are required
const carSchema = z.object({
  registrationNumber: z.string().optional(),
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  engineType: z.string().min(1, "Engine type is required"),
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

export const AddCarForm = ({ onSubmit, isAddingCar, canAddMoreCars }: AddCarFormProps) => {
  const form = useForm<z.infer<typeof carSchema>>({
    resolver: zodResolver(carSchema),
    defaultValues: {
      registrationNumber: "",
      brand: "",
      model: "",
      engineType: ""
    }
  });

  // Get the selected brand to show relevant models
  const selectedBrand = form.watch("brand");
  const models = getModelsByBrand(selectedBrand);

  // Function to look up car details from registration number
  const lookupCarDetails = async (regNumber: string) => {
    // In a real application, you would call an API here to look up the details
    // For now, we'll simulate with a timeout and dummy data
    try {
      form.setValue("brand", "BMW");
      form.setValue("model", "3 Series");
      form.setValue("engineType", "Petrol");
      
      // Let the user know the lookup was successful
      return true;
    } catch (error) {
      console.error("Error looking up car details:", error);
      return false;
    }
  };

  return (
    <Card className="mb-10">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Add a Car to Track</CardTitle>
          <CardDescription>Enter car details or registration number to monitor</CardDescription>
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
                        disabled={isAddingCar || !canAddMoreCars} 
                      />
                    </FormControl>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => lookupCarDetails(field.value || "")}
                      disabled={!field.value || isAddingCar || !canAddMoreCars}
                    >
                      Lookup
                    </Button>
                  </div>
                  <FormDescription>
                    Enter the car's registration number to automatically fetch details
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )} 
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField 
                control={form.control} 
                name="brand" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand</FormLabel>
                    <Select 
                      disabled={isAddingCar || !canAddMoreCars}
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
                      disabled={!selectedBrand || isAddingCar || !canAddMoreCars}
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
                      disabled={isAddingCar || !canAddMoreCars}
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select engine type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {engineTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} 
              />
            </div>

            <Button type="submit" className="w-full mt-4" disabled={isAddingCar || !canAddMoreCars}>
              {isAddingCar ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>Add Car</>
              )}
            </Button>
          </form>
        </Form>
        {!canAddMoreCars && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-400">
            <p className="text-sm">
              You've reached your car tracking limit. Please remove some cars or upgrade your plan to add more.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
