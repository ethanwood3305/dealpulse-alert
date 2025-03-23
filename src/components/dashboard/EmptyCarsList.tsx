
import { Car as CarIcon } from "lucide-react";

export function EmptyCarsList() {
  return (
    <div className="text-center py-12 border rounded-md bg-muted/50">
      <CarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-medium mb-2">No vehicles tracked yet</h3>
      <p className="text-muted-foreground">
        Add your first vehicle to start tracking prices.
      </p>
    </div>
  );
}
