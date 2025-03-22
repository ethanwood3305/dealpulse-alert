
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { carSchema } from "./schema";

interface CarDetailsFieldsProps {
  form: UseFormReturn<z.infer<typeof carSchema>>;
  isAddingCar: boolean;
  canAddMoreCars: boolean;
}

export const CarDetailsFields = ({ form, isAddingCar, canAddMoreCars }: CarDetailsFieldsProps) => {
  return (
    <>
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
    </>
  );
};
