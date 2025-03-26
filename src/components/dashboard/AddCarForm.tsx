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
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <BrandSelector
          selectedBrand={selectedBrand}
          onBrandSelect={(brand) => {
            setSelectedBrand(brand);
            setSelectedModel('');
            setSelectedEngineType('');
            form.setValue("model", "");
            form.setValue("engineType", "");
          }}
        />
        <ModelSelector
          brandId={selectedBrand}
          selectedModel={selectedModel}
          onModelSelect={(model) => {
            setSelectedModel(model);
            setSelectedEngineType('');
            form.setValue("engineType", "");
          }}
        />
        <EngineTypeSelector
          modelId={selectedModel}
          selectedEngineType={selectedEngineType}
          onEngineTypeSelect={(engineType) => {
            setSelectedEngineType(engineType);
            form.setValue("engineType", engineType);
          }}
        />
        <CarDetailsFields form={form} />
        <button type="submit" className="bg-primary text-primary-foreground rounded-md p-2 w-full">
          Add Car
        </button>
      </form>
    </Form>
  );
};
