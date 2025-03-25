
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { TrackedCar } from "@/hooks/use-tracked-cars";

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
        {car.last_price !== null ? (
          <span className="font-semibold">£{Number(car.last_price).toLocaleString()}</span>
        ) : (
          "—"
        )}
      </TableCell>
      <TableCell>
        {car.tags && car.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {car.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
              >
                {tag}
                <button
                  onClick={() => onRemoveTag(tag)}
                  className="ml-1 text-blue-500 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-100"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : (
          "—"
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end space-x-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onEdit}
          >
            Edit
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onMapClick}
          >
            Map
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onDelete}
          >
            Delete
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
