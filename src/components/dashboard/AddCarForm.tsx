
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Define the car schema that ensures brand, model, and engineType are required
const carSchema = z.object({
  registrationNumber: z.string().optional(),
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  engineType: z.string().min(1, "Engine type is required"),
  mileage: z.string().optional(),
  year: z.string().optional(),
  color: z.string().optional(),
});

// Type for the props
interface AddCarFormProps {
  onSubmit: (values: z.infer<typeof carSchema>) => Promise<void>;
  isAddingCar: boolean;
  canAddMoreCars: boolean;
}

// Default engine types map to ensure we always have fallback data
const defaultEngineTypesMap: Record<string, Record<string, string[]>> = {
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
  },
  "Volkswagen": {
    "Golf": [
      "1.0 TSI 110HP",
      "1.5 TSI 130HP",
      "1.5 TSI 150HP",
      "2.0 TSI 245HP GTI",
      "2.0 TSI 320HP R"
    ],
    "Polo": [
      "1.0 80HP",
      "1.0 TSI 95HP",
      "1.0 TSI 110HP",
      "2.0 TSI 200HP GTI"
    ]
  },
  "Mercedes-Benz": {
    "A-Class": [
      "A180 1.3L 136HP",
      "A200 1.3L 163HP",
      "A250 2.0L 224HP",
      "A35 AMG 2.0L 306HP"
    ],
    "C-Class": [
      "C180 1.5L 156HP",
      "C200 1.5L 184HP",
      "C300 2.0L 258HP",
      "C220d 2.0L 194HP"
    ]
  },
  "Honda": {
    "Civic": [
      "1.0 VTEC Turbo 126HP",
      "1.5 VTEC Turbo 182HP",
      "2.0 VTEC Turbo 320HP Type R"
    ]
  },
  "Land Rover": {
    "Discovery": [
      "2.0 SD4 240HP",
      "3.0 SD6 306HP",
      "3.0 Si6 340HP"
    ]
  }
};

// Default common engine types for any model not specifically defined
const defaultCommonEngineTypes = [
  "Petrol",
  "Diesel",
  "Hybrid",
  "Electric",
  "Plug-in Hybrid"
];

export const AddCarForm = ({ onSubmit, isAddingCar, canAddMoreCars }: AddCarFormProps) => {
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [brands, setBrands] = useState<{id: string, name: string}[]>([]);
  const [models, setModels] = useState<{id: string, name: string}[]>([]);
  const [engineTypes, setEngineTypes] = useState<{id: string, name: string, fuel_type: string, capacity?: string, power?: string}[]>([]);
  const [isLoadingBrands, setIsLoadingBrands] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isLoadingEngineTypes, setIsLoadingEngineTypes] = useState(false);
  const [lookupAttempted, setLookupAttempted] = useState(false);
  
  const form = useForm<z.infer<typeof carSchema>>({
    resolver: zodResolver(carSchema),
    defaultValues: {
      registrationNumber: "",
      brand: "",
      model: "",
      engineType: "",
      mileage: "",
      year: "",
      color: ""
    }
  });

  // Get the selected brand to show relevant models
  const selectedBrand = form.watch("brand");
  const selectedModel = form.watch("model");

  // Load car brands on component mount
  useEffect(() => {
    const fetchBrands = async () => {
      setIsLoadingBrands(true);
      try {
        console.log("Fetching car brands...");
        const { data, error } = await supabase
          .from('car_brands')
          .select('id, name')
          .order('name');
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          console.log("Found brands from database:", data.length);
          setBrands(data);
        } else {
          console.log("No brands in database, using hardcoded list");
          // If no brands in the database yet, use our hardcoded list
          const defaultBrands = [
            "Audi", "BMW", "Chevrolet", "Dodge", "Ford", "Honda", "Hyundai", "Jaguar", 
            "Kia", "Lexus", "Mazda", "Mercedes-Benz", "Nissan", "Porsche", "Subaru", 
            "Tesla", "Toyota", "Volkswagen", "Volvo"
          ];
          setBrands(defaultBrands.map(name => ({ id: name, name })));
        }
      } catch (error) {
        console.error('Error fetching car brands:', error);
        toast({
          title: "Could not load car brands",
          description: "We couldn't retrieve the list of car brands. Using default list instead.",
          variant: "destructive"
        });
        
        // Fallback to default list
        const defaultBrands = [
          "Audi", "BMW", "Chevrolet", "Dodge", "Ford", "Honda", "Hyundai", "Jaguar", 
          "Kia", "Lexus", "Mazda", "Mercedes-Benz", "Nissan", "Porsche", "Subaru", 
          "Tesla", "Toyota", "Volkswagen", "Volvo"
        ];
        setBrands(defaultBrands.map(name => ({ id: name, name })));
      } finally {
        setIsLoadingBrands(false);
      }
    };

    fetchBrands();
  }, []);

  // Load models when brand changes
  useEffect(() => {
    if (!selectedBrand) {
      setModels([]);
      return;
    }

    const fetchModels = async () => {
      setIsLoadingModels(true);
      try {
        console.log(`Fetching models for brand: ${selectedBrand}`);
        // First try to get from database
        const { data, error } = await supabase
          .from('car_models')
          .select('id, name')
          .eq('brand_id', brands.find(b => b.name === selectedBrand)?.id)
          .order('name');
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          console.log(`Found ${data.length} models for ${selectedBrand} in database`);
          setModels(data);
        } else {
          console.log(`No models in database for ${selectedBrand}, using hardcoded data`);
          // Fall back to our hardcoded data
          // Model map for each brand
          const modelMap: Record<string, string[]> = {
            "Ford": ["Fiesta", "Focus", "Mustang", "Explorer", "F-150", "Escape", "Edge"],
            "BMW": ["1 Series", "2 Series", "3 Series", "4 Series", "5 Series", "7 Series", "X1", "X3", "X5", "X7"],
            "Audi": ["A1", "A3", "A4", "A5", "A6", "A7", "A8", "Q3", "Q5", "Q7", "Q8", "e-tron"],
            "Tesla": ["Model 3", "Model S", "Model X", "Model Y", "Cybertruck"],
            "Volkswagen": ["Golf", "Polo", "Passat", "Tiguan", "ID.3", "ID.4", "Arteon", "T-Roc"],
            "Toyota": ["Corolla", "Camry", "RAV4", "Prius", "Yaris", "Highlander", "Land Cruiser"],
            "Mercedes-Benz": ["A-Class", "B-Class", "C-Class", "E-Class", "S-Class", "GLA", "GLC", "GLE"],
            "Honda": ["Civic", "Accord", "CR-V", "HR-V", "Jazz", "NSX"],
            "Chevrolet": ["Camaro", "Corvette", "Silverado", "Malibu", "Equinox", "Suburban"],
            "Nissan": ["Leaf", "Qashqai", "Juke", "X-Trail", "Micra", "370Z", "GT-R"],
            "Hyundai": ["i10", "i20", "i30", "Kona", "Tucson", "Santa Fe", "IONIQ"],
            "Kia": ["Picanto", "Rio", "Ceed", "Sportage", "Niro", "Sorento", "Stinger"],
            "Mazda": ["MX-5", "3", "6", "CX-3", "CX-5", "CX-30"],
            "Volvo": ["XC40", "XC60", "XC90", "S60", "S90", "V60", "V90"],
            "Porsche": ["911", "Taycan", "Panamera", "Cayenne", "Macan"],
            "Jaguar": ["XE", "XF", "F-PACE", "E-PACE", "I-PACE", "F-TYPE"],
            "Lexus": ["CT", "IS", "ES", "LS", "UX", "NX", "RX", "LC"],
            "Subaru": ["Impreza", "Forester", "Outback", "XV", "WRX", "BRZ"],
            "Dodge": ["Challenger", "Charger", "Durango", "Journey", "RAM"],
            "Land Rover": ["Discovery", "Range Rover", "Defender", "Range Rover Sport", "Range Rover Evoque"]
          };
          
          const defaultModels = modelMap[selectedBrand] || ["Other"];
          setModels(defaultModels.map(name => ({ id: name, name })));
        }
      } catch (error) {
        console.error('Error fetching car models:', error);
        toast({
          title: "Could not load car models",
          description: "We couldn't retrieve the models for the selected brand. Using default list instead.",
          variant: "destructive"
        });
        
        // Fallback to hardcoded list
        const defaultModels = ["Standard", "Deluxe", "Sport", "Limited", "Other"];
        setModels(defaultModels.map(name => ({ id: name, name })));
      } finally {
        setIsLoadingModels(false);
      }
    };

    fetchModels();
    // Reset engine type when brand changes
    form.setValue("engineType", "");
    form.setValue("model", "");
  }, [selectedBrand, brands, form]);

  // Load engine types when model changes
  useEffect(() => {
    if (!selectedModel || !selectedBrand) {
      setEngineTypes([]);
      return;
    }

    const fetchEngineTypes = async () => {
      setIsLoadingEngineTypes(true);
      try {
        console.log(`Fetching engine types for ${selectedBrand} ${selectedModel}`);
        // First try to get from database
        const { data, error } = await supabase
          .from('engine_types')
          .select('id, name, fuel_type, capacity, power')
          .eq('model_id', models.find(m => m.name === selectedModel)?.id)
          .order('name');
        
        if (error) {
          console.error('Database error fetching engine types:', error);
          throw error;
        }
        
        if (data && data.length > 0) {
          console.log(`Found ${data.length} engine types in database`);
          setEngineTypes(data);
        } else {
          console.log('No engine types in database, using fallback data');
          
          // Check for specific engine types in our map
          let engineTypesList: string[] = [];
          
          if (defaultEngineTypesMap[selectedBrand] && 
              defaultEngineTypesMap[selectedBrand][selectedModel]) {
            engineTypesList = defaultEngineTypesMap[selectedBrand][selectedModel];
            console.log(`Using specific engine types for ${selectedBrand} ${selectedModel}`);
          } else {
            // Use generic engine types
            engineTypesList = defaultCommonEngineTypes;
            console.log(`Using generic engine types for ${selectedBrand} ${selectedModel}`);
          }
          
          setEngineTypes(engineTypesList.map(name => ({
            id: name,
            name,
            fuel_type: determineFuelType(name)
          })));
        }
      } catch (error) {
        console.error('Error fetching engine types:', error);
        toast({
          title: "Could not load engine types",
          description: "Using default engine types instead.",
          variant: "destructive"
        });
        
        // Use most universal fallback
        setEngineTypes(defaultCommonEngineTypes.map(name => ({
          id: name,
          name,
          fuel_type: determineFuelType(name)
        })));
      } finally {
        setIsLoadingEngineTypes(false);
      }
    };

    fetchEngineTypes();
  }, [selectedModel, selectedBrand, models]);

  // Helper to determine fuel type from engine name
  const determineFuelType = (engineName: string): string => {
    const lowerName = engineName.toLowerCase();
    if (lowerName.includes('diesel') || lowerName.includes('tdi')) return 'Diesel';
    if (lowerName.includes('electric') || lowerName.includes('ev')) return 'Electric';
    if (lowerName.includes('hybrid')) return 'Hybrid';
    if (lowerName.includes('plug-in')) return 'Plug-in Hybrid';
    return 'Petrol';
  };

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
    setLookupAttempted(true);
    
    try {
      console.log(`Looking up vehicle with registration: ${regNumber}`);
      // Call our Supabase Edge Function for DVLA lookup
      const { data, error } = await supabase.functions.invoke('vehicle-lookup', {
        body: { registration: regNumber }
      });
      
      if (error) {
        console.error('Error from edge function:', error);
        throw error;
      }
      
      if (data) {
        console.log('Vehicle lookup response:', data);
        const { brand, model, engine_type, mileage, year, color } = data;
        
        // Check if we found valid data (our mock function will return "Not Found" for brand when no match)
        if (brand === 'Not Found') {
          toast({
            title: "Vehicle not found",
            description: "Could not find vehicle with that registration. Please enter details manually.",
            variant: "destructive"
          });
          return false;
        }
        
        // Set form values using the retrieved data
        form.setValue("brand", brand);
        
        // Wait for models to load based on brand selection
        setTimeout(() => {
          form.setValue("model", model);
          
          // Wait for engine types to load based on model selection
          setTimeout(() => {
            form.setValue("engineType", engine_type);
            form.setValue("mileage", mileage);
            if (year) form.setValue("year", year);
            if (color) form.setValue("color", color);
            
            toast({
              title: "Vehicle found",
              description: "Registration details have been loaded"
            });
          }, 500);
        }, 500);
        
        return true;
      } else {
        toast({
          title: "Vehicle not found",
          description: "Could not find vehicle with that registration. Please enter details manually.",
          variant: "destructive"
        });
        return false;
      }
    } catch (error: any) {
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
                    Enter the vehicle's registration number to automatically fetch details (try numbers starting with A, B, F, T, V, H, M, or L)
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
                      disabled={isAddingCar || !canAddMoreCars || isLookingUp || isLoadingBrands}
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
                          <SelectValue placeholder={isLoadingBrands ? "Loading brands..." : "Select brand"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingBrands ? (
                          <SelectItem value="loading" disabled>
                            <Loader2 className="h-4 w-4 mr-2 inline animate-spin" />
                            Loading...
                          </SelectItem>
                        ) : (
                          brands.map(brand => (
                            <SelectItem key={brand.id} value={brand.name}>{brand.name}</SelectItem>
                          ))
                        )}
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
                      disabled={!selectedBrand || isAddingCar || !canAddMoreCars || isLookingUp || isLoadingModels}
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Reset engine type when model changes
                        form.setValue("engineType", "");
                      }} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingModels ? "Loading models..." : "Select model"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingModels ? (
                          <SelectItem value="loading" disabled>
                            <Loader2 className="h-4 w-4 mr-2 inline animate-spin" />
                            Loading...
                          </SelectItem>
                        ) : (
                          models.map(model => (
                            <SelectItem key={model.id} value={model.name}>{model.name}</SelectItem>
                          ))
                        )}
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
                      disabled={!selectedModel || isAddingCar || !canAddMoreCars || isLookingUp || isLoadingEngineTypes}
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingEngineTypes ? "Loading engines..." : "Select engine type"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingEngineTypes ? (
                          <SelectItem value="loading" disabled>
                            <Loader2 className="h-4 w-4 mr-2 inline animate-spin" />
                            Loading...
                          </SelectItem>
                        ) : engineTypes.length > 0 ? (
                          engineTypes.map(type => (
                            <SelectItem key={type.id} value={type.name}>
                              {type.name} 
                              {type.fuel_type && ` (${type.fuel_type})`}
                            </SelectItem>
                          ))
                        ) : (
                          // Fallback if somehow engine types array is empty
                          <SelectItem value="standard">Standard</SelectItem>
                        )}
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField 
                control={form.control} 
                name="year" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. 2022" 
                        {...field} 
                        disabled={isAddingCar || !canAddMoreCars || isLookingUp} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} 
              />

              <FormField 
                control={form.control} 
                name="color" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. Silver" 
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
        {lookupAttempted && engineTypes.length === 0 && selectedModel && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-800 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400">
            <p className="text-sm">
              No specific engine types found for {selectedBrand} {selectedModel}. Please select "Standard" or manually enter engine details.
            </p>
          </div>
        )}
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
