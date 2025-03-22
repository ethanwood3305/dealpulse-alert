
import { Loader2 } from "lucide-react";

export const VehicleLoadingState = () => {
  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-2">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Searching for vehicle details...</p>
      <p className="text-xs text-muted-foreground">This may take a few moments</p>
    </div>
  );
};
