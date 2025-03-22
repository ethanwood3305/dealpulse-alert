
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { carSchema } from "./schema";

interface ModelSelectorProps {
  form: UseFormReturn<z.infer<typeof carSchema>>;
  isAddingCar: boolean;
  canAddMoreCars: boolean;
  isLoadingModels: boolean;
  models: {id: string, name: string}[];
  selectedBrand: string;
}

export const ModelSelector = ({ 
  form, 
  isAddingCar, 
  canAddMoreCars, 
  isLoadingModels, 
  models,
  selectedBrand
}: ModelSelectorProps) => {
  const [modelSearchTerm, setModelSearchTerm] = useState("");
  const [filteredModels, setFilteredModels] = useState<{id: string, name: string}[]>(models);

  useEffect(() => {
    // This ensures the models are properly filtered when the search term changes
    if (modelSearchTerm.trim() === "") {
      setFilteredModels(models);
    } else {
      const filtered = models.filter(model => 
        model.name.toLowerCase().includes(modelSearchTerm.toLowerCase())
      );
      setFilteredModels(filtered);
    }
  }, [modelSearchTerm, models]);

  return (
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
  );
};
