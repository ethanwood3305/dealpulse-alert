
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

import { carBrandsData, defaultEngineTypesMap, defaultCommonEngineTypes } from "./carData";

const carSchema = z.object({
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  engineType: z.string().min(1, "Engine type is required"),
  mileage: z.string().optional(),
  year: z.string().optional(),
  color: z.string().optional(),
  price: z.string().optional(),
});

interface AddCarFormProps {
  onSubmit: (values: z.infer<typeof carSchema>) => Promise<void>;
  isAddingCar: boolean;
  canAddMoreCars: boolean;
}

export const AddCarForm = ({ onSubmit, isAddingCar, canAddMoreCars }: AddCarFormProps) => {
  const [brands, setBrands] = useState<{id: string, name: string}[]>([]);
  const [filteredBrands, setFilteredBrands] = useState<{id: string, name: string}[]>([]);
  const [models, setModels] = useState<{id: string, name: string}[]>([]);
  const [filteredModels, setFilteredModels] = useState<{id: string, name: string}[]>([]);
  const [engineTypes, setEngineTypes] = useState<{id: string, name: string, fuel_type: string, capacity?: string, power?: string}[]>([]);
  const [filteredEngineTypes, setFilteredEngineTypes] = useState<{id: string, name: string, fuel_type: string, capacity?: string, power?: string}[]>([]);
  const [isLoadingBrands, setIsLoadingBrands] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isLoadingEngineTypes, setIsLoadingEngineTypes] = useState(false);
  const [brandSearchTerm, setBrandSearchTerm] = useState("");
  const [modelSearchTerm, setModelSearchTerm] = useState("");
  const [engineSearchTerm, setEngineSearchTerm] = useState("");
  
  const form = useForm<z.infer<typeof carSchema>>({
    resolver: zodResolver(carSchema),
    defaultValues: {
      brand: "",
      model: "",
      engineType: "",
      mileage: "",
      year: "",
      color: "",
      price: ""
    }
  });

  const selectedBrand = form.watch("brand");
  const selectedModel = form.watch("model");

  useEffect(() => {
    const fetchBrands = async () => {
      setIsLoadingBrands(true);
      try {
        console.log("Fetching car brands from database...");
        const { data, error } = await supabase.functions.invoke('vehicle-lookup', {
          method: 'GET',
        });
        
        if (error) throw error;
        
        if (data?.brands && data.brands.length > 0) {
          console.log("Found brands from database:", data.brands.length);
          setBrands(data.brands);
          setFilteredBrands(data.brands);
        } else {
          console.log("No brands returned from API, using hardcoded list");
          const defaultBrands = Object.keys(carBrandsData);
          const formattedBrands = defaultBrands.map(name => ({ id: name, name }));
          setBrands(formattedBrands);
          setFilteredBrands(formattedBrands);
        }
      } catch (error) {
        console.error('Error fetching car brands:', error);
        toast({
          title: "Could not load car brands",
          description: "We couldn't retrieve the list of car brands. Using default list instead.",
          variant: "destructive"
        });
        
        const defaultBrands = Object.keys(carBrandsData);
        const formattedBrands = defaultBrands.map(name => ({ id: name, name }));
        setBrands(formattedBrands);
        setFilteredBrands(formattedBrands);
      } finally {
        setIsLoadingBrands(false);
      }
    };

    fetchBrands();
  }, []);

  useEffect(() => {
    if (!selectedBrand) {
      setModels([]);
      setFilteredModels([]);
      return;
    }

    const fetchModels = async () => {
      setIsLoadingModels(true);
      try {
        console.log(`Fetching models for brand: ${selectedBrand}`);
        
        const selectedBrandObj = brands.find(b => b.name === selectedBrand);
        
        if (!selectedBrandObj) {
          throw new Error("Selected brand not found in brands list");
        }
        
        const { data, error } = await supabase.functions.invoke('vehicle-lookup', {
          method: 'POST',
          body: { brandId: selectedBrandObj.id }
        });
        
        if (error) {
          console.error("API error fetching models:", error);
          throw error;
        }
        
        if (data?.models && data.models.length > 0) {
          console.log(`Found ${data.models.length} models for ${selectedBrand} from API`);
          setModels(data.models);
          setFilteredModels(data.models);
          setIsLoadingModels(false);
          return;
        }
        
        const brandModels = carBrandsData[selectedBrand as keyof typeof carBrandsData] || [];
        if (brandModels && brandModels.length > 0) {
          console.log(`Found ${brandModels.length} models for ${selectedBrand} in hardcoded data`);
          const formattedModels = brandModels.map(name => ({ id: name, name }));
          setModels(formattedModels);
          setFilteredModels(formattedModels);
        } else {
          console.log(`No models found for ${selectedBrand}, using fallback models`);
          const defaultModels = ["Standard", "Deluxe", "Sport", "Limited", "Other"];
          const formattedModels = defaultModels.map(name => ({ id: name, name }));
          setModels(formattedModels);
          setFilteredModels(formattedModels);
        }
      } catch (error) {
        console.error('Error fetching car models:', error);
        toast({
          title: "Could not load car models",
          description: "We couldn't retrieve the models for the selected brand. Using default list instead.",
          variant: "destructive"
        });
        
        const brandModels = carBrandsData[selectedBrand as keyof typeof carBrandsData] || [];
        if (brandModels.length > 0) {
          const formattedModels = brandModels.map(name => ({ id: name, name }));
          setModels(formattedModels);
          setFilteredModels(formattedModels);
        } else {
          const defaultModels = ["Standard", "Deluxe", "Sport", "Limited", "Other"];
          const formattedModels = defaultModels.map(name => ({ id: name, name }));
          setModels(formattedModels);
          setFilteredModels(formattedModels);
        }
      } finally {
        setIsLoadingModels(false);
      }
    };

    fetchModels();
    form.setValue("engineType", "");
    form.setValue("model", "");
    setModelSearchTerm("");
    setEngineSearchTerm("");
  }, [selectedBrand, brands, form]);

  useEffect(() => {
    if (!selectedModel || !selectedBrand) {
      setEngineTypes([]);
      setFilteredEngineTypes([]);
      return;
    }

    const fetchEngineTypes = async () => {
      setIsLoadingEngineTypes(true);
      try {
        console.log(`Fetching engine types for ${selectedBrand} ${selectedModel}`);
        
        const selectedModelObj = models.find(m => m.name === selectedModel);
        
        if (!selectedModelObj) {
          throw new Error("Selected model not found in models list");
        }
        
        const { data, error } = await supabase.functions.invoke('vehicle-lookup', {
          method: 'POST',
          body: { modelId: selectedModelObj.id }
        });
        
        if (error) {
          console.error('API error fetching engine types:', error);
          throw error;
        }
        
        if (data?.engineTypes && data.engineTypes.length > 0) {
          console.log(`Found ${data.engineTypes.length} engine types from API`);
          setEngineTypes(data.engineTypes);
          setFilteredEngineTypes(data.engineTypes);
          setIsLoadingEngineTypes(false);
          return;
        }
        
        if (defaultEngineTypesMap[selectedBrand as keyof typeof defaultEngineTypesMap] && 
            defaultEngineTypesMap[selectedBrand as keyof typeof defaultEngineTypesMap][selectedModel]) {
          const specificEngineTypes = defaultEngineTypesMap[selectedBrand as keyof typeof defaultEngineTypesMap][selectedModel];
          console.log(`Using specific engine types for ${selectedBrand} ${selectedModel}, found ${specificEngineTypes.length}`);
          
          const formattedEngineTypes = specificEngineTypes.map(name => ({
            id: name,
            name,
            fuel_type: determineFuelType(name)
          }));
          setEngineTypes(formattedEngineTypes);
          setFilteredEngineTypes(formattedEngineTypes);
        } else {
          console.log(`Using generic engine types for ${selectedBrand} ${selectedModel}`);
          const formattedEngineTypes = defaultCommonEngineTypes.map(name => ({
            id: name,
            name,
            fuel_type: determineFuelType(name)
          }));
          setEngineTypes(formattedEngineTypes);
          setFilteredEngineTypes(formattedEngineTypes);
        }
      } catch (error) {
        console.error('Error fetching engine types:', error);
        toast({
          title: "Could not load engine types",
          description: "Using default engine types instead.",
          variant: "destructive"
        });
        
        const formattedEngineTypes = defaultCommonEngineTypes.map(name => ({
          id: name,
          name,
          fuel_type: determineFuelType(name)
        }));
        setEngineTypes(formattedEngineTypes);
        setFilteredEngineTypes(formattedEngineTypes);
      } finally {
        setIsLoadingEngineTypes(false);
      }
    };

    fetchEngineTypes();
    setEngineSearchTerm("");
  }, [selectedModel, selectedBrand, models]);

  useEffect(() => {
    if (brandSearchTerm.trim() === "") {
      setFilteredBrands(brands);
    } else {
      const filtered = brands.filter(brand => 
        brand.name.toLowerCase().includes(brandSearchTerm.toLowerCase())
      );
      setFilteredBrands(filtered);
    }
  }, [brandSearchTerm, brands]);

  useEffect(() => {
    if (modelSearchTerm.trim() === "") {
      setFilteredModels(models);
    } else {
      const filtered = models.filter(model => 
        model.name.toLowerCase().includes(modelSearchTerm.toLowerCase())
      );
      setFilteredModels(filtered);
    }
  }, [modelSearchTerm, models]);

  useEffect(() => {
    if (engineSearchTerm.trim() === "") {
      setFilteredEngineTypes(engineTypes);
    } else {
      const filtered = engineTypes.filter(engine => 
        engine.name.toLowerCase().includes(engineSearchTerm.toLowerCase()) ||
        engine.fuel_type.toLowerCase().includes(engineSearchTerm.toLowerCase())
      );
      setFilteredEngineTypes(filtered);
    }
  }, [engineSearchTerm, engineTypes]);

  const determineFuelType = (engineName: string): string => {
    const lowerName = engineName.toLowerCase();
    if (lowerName.includes('diesel') || lowerName.includes('tdi') || lowerName.includes('bluetec') || lowerName.match(/\bd\d/) || lowerName.includes('cdi')) return 'Diesel';
    if (lowerName.includes('electric') || lowerName.includes('ev') || lowerName.includes('e-tron') || lowerName.includes('eqs') || lowerName.includes('taycan') || lowerName.includes('id.')) return 'Electric';
    if ((lowerName.includes('hybrid') && lowerName.includes('plug')) || lowerName.includes('phev') || lowerName.includes('e:phev')) return 'Plug-in Hybrid';
    if (lowerName.includes('hybrid') || lowerName.includes('e:hev') || lowerName.includes('e-power')) return 'Hybrid';
    if (lowerName.includes('mild hybrid') || lowerName.includes('mhev') || lowerName.includes('etsi')) return 'Mild Hybrid';
    return 'Petrol';
  };

  return (
    <Card className="mb-10">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Add a Vehicle to Track</CardTitle>
          <CardDescription>Enter vehicle details to monitor</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form id="add-car-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField 
                control={form.control} 
                name="brand" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand</FormLabel>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input
                        placeholder="Search brands..."
                        className="pl-10 mb-2"
                        value={brandSearchTerm}
                        onChange={(e) => setBrandSearchTerm(e.target.value)}
                        disabled={isAddingCar || !canAddMoreCars || isLoadingBrands}
                      />
                    </div>
                    <Select 
                      disabled={isAddingCar || !canAddMoreCars || isLoadingBrands}
                      onValueChange={(value) => {
                        field.onChange(value);
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
                        ) : filteredBrands.length > 0 ? (
                          filteredBrands.map(brand => (
                            <SelectItem key={brand.id} value={brand.name}>{brand.name}</SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>No brands found</SelectItem>
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
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input
                        placeholder="Search models..."
                        className="pl-10 mb-2"
                        value={modelSearchTerm}
                        onChange={(e) => setModelSearchTerm(e.target.value)}
                        disabled={!selectedBrand || isAddingCar || !canAddMoreCars || isLoadingModels}
                      />
                    </div>
                    <Select 
                      disabled={!selectedBrand || isAddingCar || !canAddMoreCars || isLoadingModels}
                      onValueChange={(value) => {
                        field.onChange(value);
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
                        ) : filteredModels.length > 0 ? (
                          filteredModels.map(model => (
                            <SelectItem key={model.id} value={model.name}>{model.name}</SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>No models found</SelectItem>
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
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input
                        placeholder="Search engines..."
                        className="pl-10 mb-2"
                        value={engineSearchTerm}
                        onChange={(e) => setEngineSearchTerm(e.target.value)}
                        disabled={!selectedModel || isAddingCar || !canAddMoreCars || isLoadingEngineTypes}
                      />
                    </div>
                    <Select 
                      disabled={!selectedModel || isAddingCar || !canAddMoreCars || isLoadingEngineTypes}
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
                        ) : filteredEngineTypes.length > 0 ? (
                          filteredEngineTypes.map(type => (
                            <SelectItem key={type.id} value={type.name}>
                              {type.name} 
                              {type.fuel_type && ` (${type.fuel_type})`}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="standard">Standard</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} 
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        disabled={isAddingCar || !canAddMoreCars} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} 
              />

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
                        disabled={isAddingCar || !canAddMoreCars} 
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
                        disabled={isAddingCar || !canAddMoreCars} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} 
              />
            </div>

            <div className="mt-4">
              <FormField 
                control={form.control} 
                name="price" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Price (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="e.g. 15000" 
                        {...field} 
                        disabled={isAddingCar || !canAddMoreCars} 
                      />
                    </FormControl>
                    <FormDescription>
                      Set a target price to compare with market prices
                    </FormDescription>
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
