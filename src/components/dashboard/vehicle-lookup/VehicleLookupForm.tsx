
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
    const regClean = registration.trim().toUpperCase();
    
    if (!regClean) {
      toast({
        title: "Error",
        description: "Please enter a registration number",
        variant: "destructive"
      });
      return;
    }
    
    // Basic format validation
    const regPattern = /^[A-Z0-9]{2,8}$/i;
    if (!regPattern.test(regClean.replace(/\s+/g, ''))) {
      toast({
        title: "Invalid Registration",
        description: "Please enter a valid UK registration number",
        variant: "destructive"
      });
      return;
    }
    
    onSubmit(regClean);
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
