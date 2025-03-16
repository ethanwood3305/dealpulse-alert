
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CompetitorTagProps {
  tagName: string;
  onRemove: () => void;
}

export function CompetitorTag({ tagName, onRemove }: CompetitorTagProps) {
  return (
    <Badge variant="outline" className="flex items-center gap-1 mr-1 mb-1">
      {tagName}
      <button 
        onClick={onRemove}
        className="ml-1 hover:bg-muted rounded-full p-0.5"
        aria-label={`Remove ${tagName} tag`}
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  );
}
