
import { Car, SearchIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VehicleLookupForm } from './vehicle-lookup/VehicleLookupForm';
import { useTrackedCars } from '@/hooks/use-tracked-cars';
import { VehicleLookupProps } from '@/types/vehicle-lookup-types';

export function VehicleLookup({ userId, onCarAdded, addCar }: VehicleLookupProps) {
  const { addCar: defaultAddCar } = useTrackedCars(userId);

  // Use the passed in addCar function if provided, otherwise use the default
  const handleAddCar = addCar || defaultAddCar;

  return (
    <Card className="overflow-hidden border-none shadow-lg">
      <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">Add a Vehicle</CardTitle>
            <CardDescription className="text-muted-foreground mt-1">
              Track a vehicle by searching for UK registration details
            </CardDescription>
          </div>
          <div className="bg-primary/10 p-3 rounded-full">
            <Car className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <VehicleLookupForm 
          onSubmit={async (registration) => {
            // This function needs to be properly implemented to handle registration lookup
            console.log('Registration lookup for:', registration);
          }} 
          isLoading={false}
          onCarAdded={onCarAdded} 
          addCar={handleAddCar} 
        />
      </CardContent>
    </Card>
  );
}
