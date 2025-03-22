
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

import { carBrandsData, defaultEngineTypesMap, defaultCommonEngineTypes } from "./carData";
import { carSchema, CarFormValues } from "./car-form/schema";
import { BrandSelector } from "./car-form/BrandSelector";
import { ModelSelector } from "./car-form/ModelSelector";
import { EngineTypeSelector } from "./car-form/EngineTypeSelector";
import { CarDetailsFields } from "./car-form/CarDetailsFields";
import { determineFuelType } from "./car-form/utils";

interface AddCarFormProps {
  onSubmit: (values: CarFormValues) => Promise<void>;
  isAddingCar: boolean;
  canAddMoreCars: boolean;
}

export const AddCarForm = ({ onSubmit, isAddingCar, canAddMoreCars }: AddCarFormProps) => {
  const [brands, setBrands] = useState<{id: string, name: string}[]>([]);
  const [models, setModels] = useState<{id: string, name: string}[]>([]);
  const [engineTypes, setEngineTypes] = useState<{id: string, name: string, fuel_type: string, capacity?: string, power?: string}[]>([]);
  const [isLoadingBrands, setIsLoadingBrands] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isLoadingEngineTypes, setIsLoadingEngineTypes] = useState(false);
  
  const form = useForm<CarFormValues>({
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
        } else {
          console.log("No brands returned from API, using hardcoded list");
          const defaultBrands = Object.keys(carBrandsData);
          const formattedBrands = defaultBrands.map(name => ({ id: name, name }));
          setBrands(formattedBrands);
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
      } finally {
        setIsLoadingBrands(false);
      }
    };

    fetchBrands();
  }, []);

  useEffect(() => {
    if (!selectedBrand) {
      setModels([]);
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
          setIsLoadingModels(false);
          return;
        }
        
        const brandModels = carBrandsData[selectedBrand as keyof typeof carBrandsData] || [];
        if (brandModels && brandModels.length > 0) {
          console.log(`Found ${brandModels.length} models for ${selectedBrand} in hardcoded data`);
          const formattedModels = brandModels.map(name => ({ id: name, name }));
          setModels(formattedModels);
        } else {
          console.log(`No models found for ${selectedBrand}, using fallback models`);
          const defaultModels = ["Standard", "Deluxe", "Sport", "Limited", "Other"];
          const formattedModels = defaultModels.map(name => ({ id: name, name }));
          setModels(formattedModels);
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
        } else {
          const defaultModels = ["Standard", "Deluxe", "Sport", "Limited", "Other"];
          const formattedModels = defaultModels.map(name => ({ id: name, name }));
          setModels(formattedModels);
        }
      } finally {
        setIsLoadingModels(false);
      }
    };

    fetchModels();
    form.setValue("engineType", "");
    form.setValue("model", "");
  }, [selectedBrand, brands, form]);

  useEffect(() => {
    if (!selectedModel || !selectedBrand) {
      setEngineTypes([]);
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
        } else {
          console.log(`Using generic engine types for ${selectedBrand} ${selectedModel}`);
          const formattedEngineTypes = defaultCommonEngineTypes.map(name => ({
            id: name,
            name,
            fuel_type: determineFuelType(name)
          }));
          setEngineTypes(formattedEngineTypes);
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
      } finally {
        setIsLoadingEngineTypes(false);
      }
    };

    fetchEngineTypes();
  }, [selectedModel, selectedBrand, models]);

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
              <BrandSelector 
                form={form}
                isAddingCar={isAddingCar}
                canAddMoreCars={canAddMoreCars}
                isLoadingBrands={isLoadingBrands}
                brands={brands}
              />

              <ModelSelector 
                form={form}
                isAddingCar={isAddingCar}
                canAddMoreCars={canAddMoreCars}
                isLoadingModels={isLoadingModels}
                models={models}
                selectedBrand={selectedBrand}
              />

              <EngineTypeSelector 
                form={form}
                isAddingCar={isAddingCar}
                canAddMoreCars={canAddMoreCars}
                isLoadingEngineTypes={isLoadingEngineTypes}
                engineTypes={engineTypes}
                selectedModel={selectedModel}
              />
            </div>
            
            <CarDetailsFields 
              form={form}
              isAddingCar={isAddingCar}
              canAddMoreCars={canAddMoreCars}
            />

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
