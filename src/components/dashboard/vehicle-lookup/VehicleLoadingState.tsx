
import { Loader2 } from "lucide-react";

export const VehicleLoadingState = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative w-16 h-16">
        <Loader2 className="w-16 h-16 text-primary animate-spin" />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-medium">Searching for vehicle details</h3>
        <p className="text-sm text-muted-foreground mt-1">
          This may take a few moments...
        </p>
      </div>
    </div>
  );
};
