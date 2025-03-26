
import { Car } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VehicleLookupForm } from './vehicle-lookup/VehicleLookupForm';
import { useTrackedCars } from '@/hooks/use-tracked-cars';
import { VehicleLookupProps } from '@/types/vehicle-lookup-types';

export function VehicleLookup({ userId, onCarAdded, addCar }: VehicleLookupProps) {
  const { addCar: defaultAddCar } = useTrackedCars(userId);

  // Use the passed in addCar function if provided, otherwise use the default
  const handleAddCar = addCar || defaultAddCar;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Add a Vehicle</CardTitle>
            <CardDescription>
              Track a vehicle by searching for UK registration details
            </CardDescription>
          </div>
          <div className="bg-primary/10 p-3 rounded-full">
            <Car className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <VehicleLookupForm 
          onSubmit={async () => {}} 
          isLoading={false}
          onCarAdded={onCarAdded} 
          addCar={handleAddCar} 
        />
      </CardContent>
    </Card>
  );
}
