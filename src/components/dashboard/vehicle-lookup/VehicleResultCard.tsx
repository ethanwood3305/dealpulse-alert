
import { Button } from "@/components/ui/button";
import { VehicleDetails } from "@/types/vehicle-lookup-types";
import { CalendarIcon, CarFront, CheckCircle, Fuel, Gauge, Info, Palette } from "lucide-react";

interface VehicleResultCardProps {
  vehicleDetails: VehicleDetails;
  onAddCar: () => void;
}

export const VehicleResultCard = ({ vehicleDetails, onAddCar }: VehicleResultCardProps) => {
  const {
    make,
    model,
    year,
    color,
    fuelType,
    registration,
    engineSize,
    trim,
  } = vehicleDetails;

  const formattedEngineSize = engineSize ? `${Number(engineSize) / 1000}L` : "N/A";
  const displayTrim = trim || "Standard";

  return (
    <div className="rounded-lg border bg-card shadow-sm overflow-hidden animate-fade-in">
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 border-b">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <span>Vehicle Found</span>
        </h3>
        <p className="text-muted-foreground text-sm mt-1">
          Registration: <span className="font-medium">{registration}</span>
        </p>
      </div>
      
      <div className="p-5 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b">
          <div>
            <h2 className="text-2xl font-bold">{make} {model}</h2>
            <p className="text-muted-foreground">{displayTrim}</p>
          </div>
          <CarFront className="h-8 w-8 text-primary" />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex flex-col space-y-1">
            <span className="text-xs uppercase text-muted-foreground font-medium flex items-center">
              <CalendarIcon className="h-3 w-3 mr-1" /> Year
            </span>
            <span className="font-medium">{year}</span>
          </div>
          
          <div className="flex flex-col space-y-1">
            <span className="text-xs uppercase text-muted-foreground font-medium flex items-center">
              <Palette className="h-3 w-3 mr-1" /> Color
            </span>
            <span className="font-medium">{color}</span>
          </div>
          
          <div className="flex flex-col space-y-1">
            <span className="text-xs uppercase text-muted-foreground font-medium flex items-center">
              <Fuel className="h-3 w-3 mr-1" /> Fuel
            </span>
            <span className="font-medium">{fuelType}</span>
          </div>
          
          <div className="flex flex-col space-y-1">
            <span className="text-xs uppercase text-muted-foreground font-medium flex items-center">
              <Gauge className="h-3 w-3 mr-1" /> Engine
            </span>
            <span className="font-medium">{formattedEngineSize}</span>
          </div>
        </div>
        
        <div className="pt-2 border-t mt-4">
          <Button 
            className="w-full font-medium"
            onClick={onAddCar}
          >
            Add Vehicle to Tracking
          </Button>
        </div>
      </div>
    </div>
  );
};
