
import { CompetitorTagBadge } from "./CompetitorTagBadge";

interface TagsDisplayProps {
  tags: string[];
  onRemoveTag: (tag: string) => void;
}

export function TagsDisplay({ tags, onRemoveTag }: TagsDisplayProps) {
  return (
    <div className="flex flex-wrap gap-1 max-w-[200px]">
      {tags && tags.length > 0 ? (
        tags.map((tag) => (
          <CompetitorTagBadge
            key={tag}
            tag={tag}
            onRemove={() => onRemoveTag(tag)}
          />
        ))
      ) : (
        <span className="text-sm text-muted-foreground">Not registered</span>
      )}
    </div>
  );
}
