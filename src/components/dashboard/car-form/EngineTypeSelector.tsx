
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { carSchema } from "./schema";

interface EngineTypeSelectorProps {
  form: UseFormReturn<z.infer<typeof carSchema>>;
  isAddingCar: boolean;
  canAddMoreCars: boolean;
  isLoadingEngineTypes: boolean;
  engineTypes: {id: string, name: string, fuel_type: string, capacity?: string, power?: string}[];
  selectedModel: string;
}

export const EngineTypeSelector = ({ 
  form, 
  isAddingCar, 
  canAddMoreCars, 
  isLoadingEngineTypes, 
  engineTypes,
  selectedModel
}: EngineTypeSelectorProps) => {
  const [engineSearchTerm, setEngineSearchTerm] = useState("");
  const [filteredEngineTypes, setFilteredEngineTypes] = useState<{id: string, name: string, fuel_type: string, capacity?: string, power?: string}[]>(engineTypes);

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

  return (
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
  );
};
