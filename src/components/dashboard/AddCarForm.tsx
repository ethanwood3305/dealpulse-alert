
import React, { useState } from 'react';
import { toast } from "@/components/ui/use-toast";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BrandSelector } from './car-form/BrandSelector';
import { ModelSelector } from './car-form/ModelSelector';
import { EngineTypeSelector } from './car-form/EngineTypeSelector';
import { CarDetailsFields } from './car-form/CarDetailsFields';
import { carSchema, CarFormValues } from './car-form/schema';
import { AddCarParams } from '@/hooks/use-tracked-cars';

export interface AddCarFormProps {
  onCarAdded?: () => void; // Make this prop optional
  addCar?: (car: AddCarParams) => Promise<boolean>; // Make this prop optional
}

export const AddCarForm = ({ onCarAdded, addCar }: AddCarFormProps) => {
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedEngineType, setSelectedEngineType] = useState('');
  const [isAddingCar, setIsAddingCar] = useState(false);
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
      price: "",
      trim: "",
      engineSize: "",
    },
  });

  const { handleSubmit } = form;

  const onSubmit = async (data: CarFormValues) => {
    if (!selectedBrand || !selectedModel || !selectedEngineType) {
      toast({
        title: "Missing Information",
        description: "Please select a brand, model, and engine type.",
        variant: "destructive",
      });
      return;
    }

    setIsAddingCar(true);
    try {
      const success = await addCar?.({
        ...data,
        brand: selectedBrand,
        model: selectedModel,
        engineType: selectedEngineType,
        organization_id: '' // This will be set by the calling function when needed
      });

      if (success) {
        toast({
          title: "Success",
          description: "Car added successfully!",
        });
        form.reset();
        setSelectedBrand('');
        setSelectedModel('');
        setSelectedEngineType('');
        onCarAdded?.();
      } else {
        toast({
          title: "Error",
          description: "Failed to add car. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add car. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAddingCar(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <BrandSelector
          form={form}
          isAddingCar={isAddingCar}
          canAddMoreCars={true}
          isLoadingBrands={isLoadingBrands}
          brands={brands}
        />
        <ModelSelector
          form={form}
          isAddingCar={isAddingCar}
          canAddMoreCars={true}
          isLoadingModels={isLoadingModels}
          models={models}
          selectedBrand={selectedBrand}
        />
        <EngineTypeSelector
          form={form}
          isAddingCar={isAddingCar}
          canAddMoreCars={true}
          isLoadingEngineTypes={isLoadingEngineTypes}
          engineTypes={engineTypes}
          selectedModel={selectedModel}
        />
        <CarDetailsFields 
          form={form} 
          isAddingCar={isAddingCar} 
          canAddMoreCars={true} 
        />
        <button 
          type="submit" 
          className="bg-primary text-primary-foreground rounded-md p-2 w-full"
          disabled={isAddingCar}
        >
          {isAddingCar ? "Adding Car..." : "Add Car"}
        </button>
      </form>
    </Form>
  );
};
