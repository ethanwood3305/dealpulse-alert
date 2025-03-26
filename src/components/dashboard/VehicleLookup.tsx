
import { useState } from 'react';
import { Car } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddCarForm } from './AddCarForm';
import { VehicleLookupForm } from './vehicle-lookup/VehicleLookupForm';
import { useTrackedCars } from '@/hooks/use-tracked-cars';

interface VehicleLookupProps {
  userId: string | undefined;
  onCarAdded: () => void;
  addCar?: (car: any) => Promise<boolean>;
}

export function VehicleLookup({ userId, onCarAdded, addCar }: VehicleLookupProps) {
  const [activeTab, setActiveTab] = useState<string>('lookup');
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
              Track a vehicle by searching or manually entering details
            </CardDescription>
          </div>
          <div className="bg-primary/10 p-3 rounded-full">
            <Car className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="lookup">Vehicle Lookup</TabsTrigger>
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          </TabsList>
          <TabsContent value="lookup">
            <VehicleLookupForm onCarAdded={onCarAdded} addCar={handleAddCar} />
          </TabsContent>
          <TabsContent value="manual">
            <AddCarForm onCarAdded={onCarAdded} addCar={handleAddCar} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
