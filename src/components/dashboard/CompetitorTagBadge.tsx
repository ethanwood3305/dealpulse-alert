
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CompetitorTagBadgeProps {
  tag: string; 
  onRemove: () => void;
}

export function CompetitorTagBadge({ tag, onRemove }: CompetitorTagBadgeProps) {
  return (
    <Badge variant="secondary" className="gap-x-1.5">
      {tag}
      <button onClick={onRemove} className="ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
        <Trash2 className="h-3 w-3" />
        <span className="sr-only">Remove tag</span>
      </button>
    </Badge>
  );
}
