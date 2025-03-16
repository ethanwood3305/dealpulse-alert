
import { useState, KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CompetitorTag } from "./CompetitorTag";

interface TagInputProps {
  urlId: string;
  existingTags: string[];
  onAddTag: (urlId: string, tag: string) => Promise<void>;
  onRemoveTag: (urlId: string, tag: string) => Promise<void>;
}

export function TagInput({ urlId, existingTags, onAddTag, onRemoveTag }: TagInputProps) {
  const [tagInput, setTagInput] = useState("");

  const handleAddTag = async () => {
    if (tagInput.trim() && !existingTags.includes(tagInput.trim())) {
      await onAddTag(urlId, tagInput.trim());
      setTagInput("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap">
        {existingTags.map((tag) => (
          <CompetitorTag 
            key={tag} 
            tagName={tag} 
            onRemove={() => onRemoveTag(urlId, tag)} 
          />
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add competitor tag..."
          className="flex-1"
        />
        <Button 
          onClick={handleAddTag} 
          size="sm" 
          variant="outline"
          type="button"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
