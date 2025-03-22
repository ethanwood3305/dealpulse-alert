
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchIcon, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface VehicleLookupFormProps {
  onSubmit: (registration: string) => void;
  isLoading: boolean;
}

export const VehicleLookupForm = ({ onSubmit, isLoading }: VehicleLookupFormProps) => {
  const [registration, setRegistration] = useState('');

  const handleSubmit = () => {
    if (!registration.trim()) {
      toast({
        title: "Error",
        description: "Please enter a registration number",
        variant: "destructive"
      });
      return;
    }
    
    onSubmit(registration.trim());
  };

  return (
    <div className="flex space-x-2">
      <Input
        placeholder="Enter registration (e.g., AB12CDE)"
        value={registration}
        onChange={(e) => setRegistration(e.target.value)}
        className="flex-1"
        maxLength={8}
        disabled={isLoading}
      />
      <Button 
        onClick={handleSubmit} 
        disabled={isLoading || !registration.trim()}
        className={isLoading ? "bg-muted text-muted-foreground" : ""}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <SearchIcon className="h-4 w-4 mr-2" />
        )}
        {isLoading ? "Searching..." : "Lookup"}
      </Button>
    </div>
  );
};
