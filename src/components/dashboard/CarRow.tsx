
import { TableCell, TableRow } from "@/components/ui/table";
import { TrackedCar } from "@/hooks/use-tracked-cars";
import { PriceDisplay } from "./PriceDisplay";
import { TagsDisplay } from "./TagsDisplay";
import { CarActionButtons } from "./CarActionButtons";

interface CarRowProps {
  car: TrackedCar;
  cheapestUrl: string;
  onEdit: () => void;
  onMapClick: () => void;
  onDelete: () => void;
  onRemoveTag: (tag: string) => void;
}

export function CarRow({ 
  car, 
  cheapestUrl, 
  onEdit, 
  onMapClick, 
  onDelete, 
  onRemoveTag 
}: CarRowProps) {
  return (
    <TableRow>
      <TableCell>
        <div className="font-medium">{car.brand} {car.model}</div>
      </TableCell>
      <TableCell>{car.trim || "—"}</TableCell>
      <TableCell>{car.engineType}</TableCell>
      <TableCell>{car.year || "—"}</TableCell>
      <TableCell>{car.mileage || "—"}</TableCell>
      <TableCell>{car.color || "—"}</TableCell>
      <TableCell>
        <PriceDisplay 
          lastPrice={car.last_price} 
          cheapestPrice={car.cheapest_price} 
          cheapestUrl={cheapestUrl} 
        />
      </TableCell>
      <TableCell>
        <TagsDisplay 
          tags={car.tags} 
          onRemoveTag={(tag) => onRemoveTag(tag)} 
        />
      </TableCell>
      <TableCell className="text-right">
        <CarActionButtons 
          onEdit={onEdit} 
          onMapClick={onMapClick} 
          onDelete={onDelete} 
        />
      </TableCell>
    </TableRow>
  );
}
