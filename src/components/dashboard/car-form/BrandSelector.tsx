
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { carSchema } from "./schema";

interface BrandSelectorProps {
  form: UseFormReturn<z.infer<typeof carSchema>>;
  isAddingCar: boolean;
  canAddMoreCars: boolean;
  isLoadingBrands: boolean;
  brands: {id: string, name: string}[];
}

export const BrandSelector = ({ 
  form, 
  isAddingCar, 
  canAddMoreCars, 
  isLoadingBrands, 
  brands 
}: BrandSelectorProps) => {
  const [brandSearchTerm, setBrandSearchTerm] = useState("");
  const [filteredBrands, setFilteredBrands] = useState<{id: string, name: string}[]>(brands);

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

  return (
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
  );
};
