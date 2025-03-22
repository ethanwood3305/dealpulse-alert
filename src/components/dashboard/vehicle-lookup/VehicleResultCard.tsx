
import { Button } from "@/components/ui/button";
import { VehicleDetails } from "@/types/vehicle-lookup-types";

interface VehicleResultCardProps {
  vehicleDetails: VehicleDetails;
  onAddCar: () => void;
}

export const VehicleResultCard = ({ vehicleDetails, onAddCar }: VehicleResultCardProps) => {
  return (
    <div className="border rounded-md p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">
          {vehicleDetails.make} {vehicleDetails.model}
          {vehicleDetails.trim && ` ${vehicleDetails.trim}`}
        </h3>
        <span className="bg-primary/10 text-primary font-mono px-2 py-1 rounded text-sm">
          {vehicleDetails.registration}
        </span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground">Year</p>
          <p className="font-medium">{vehicleDetails.year}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Color</p>
          <p className="font-medium">{vehicleDetails.color}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Fuel Type</p>
          <p className="font-medium">{vehicleDetails.fuelType}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Engine Size</p>
          <p className="font-medium">{vehicleDetails.engineSize}</p>
        </div>
        
        {vehicleDetails.doorCount && (
          <div>
            <p className="text-muted-foreground">Doors</p>
            <p className="font-medium">{vehicleDetails.doorCount}</p>
          </div>
        )}
        {vehicleDetails.bodyStyle && (
          <div>
            <p className="text-muted-foreground">Body Style</p>
            <p className="font-medium">{vehicleDetails.bodyStyle}</p>
          </div>
        )}
        {vehicleDetails.transmission && (
          <div>
            <p className="text-muted-foreground">Transmission</p>
            <p className="font-medium">{vehicleDetails.transmission}</p>
          </div>
        )}
        {vehicleDetails.weight && (
          <div>
            <p className="text-muted-foreground">Weight (kg)</p>
            <p className="font-medium">{vehicleDetails.weight}</p>
          </div>
        )}
        {vehicleDetails.price && (
          <div>
            <p className="text-muted-foreground">Listed Price (£)</p>
            <p className="font-medium">{vehicleDetails.price}</p>
          </div>
        )}
        {vehicleDetails.trim && (
          <div>
            <p className="text-muted-foreground">Trim</p>
            <p className="font-medium">{vehicleDetails.trim}</p>
          </div>
        )}
      </div>
      
      <Button onClick={onAddCar} className="w-full">
        Add to Tracked Vehicles
      </Button>
    </div>
  );
};
