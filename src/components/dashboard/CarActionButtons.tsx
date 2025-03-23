
import { Trash2, Edit, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CarActionButtonsProps {
  onEdit: () => void;
  onMapClick: () => void;
  onDelete: () => void;
}

export function CarActionButtons({ onEdit, onMapClick, onDelete }: CarActionButtonsProps) {
  return (
    <div className="flex flex-col items-end space-y-2">
      <Button 
        variant="ghost"
        size="sm"
        onClick={onEdit}
      >
        <Edit className="h-4 w-4 mr-1" />
        Edit
      </Button>
      
      <Button 
        variant="ghost"
        size="sm"
        onClick={onMapClick}
      >
        <MapPin className="h-4 w-4 mr-1" />
        Map
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={onDelete}
      >
        <Trash2 className="h-4 w-4 mr-1" />
        Remove
      </Button>
    </div>
  );
}
