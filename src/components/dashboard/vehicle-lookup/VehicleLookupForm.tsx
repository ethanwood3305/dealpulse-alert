
import { useState, FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export interface VehicleLookupFormProps {
  onSubmit: (registration: string) => Promise<void>;
  isLoading: boolean;
  onCarAdded?: () => void; // Added this prop
  addCar?: (car: any) => Promise<boolean>; // Added this prop
}

export const VehicleLookupForm = ({ 
  onSubmit, 
  isLoading,
  // We don't use these props but need to accept them to avoid type errors
  onCarAdded,
  addCar
}: VehicleLookupFormProps) => {
  const [registration, setRegistration] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!registration.trim() || isLoading) return;
    
    await onSubmit(registration.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="registration">Registration Number</Label>
        <div className="flex mt-1">
          <Input
            id="registration"
            placeholder="Enter UK registration (e.g. AB12CDE)"
            value={registration}
            onChange={(e) => setRegistration(e.target.value)}
            className="flex-1"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            className="ml-2" 
            disabled={isLoading || !registration.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              'Look Up'
            )}
          </Button>
        </div>
      </div>
    </form>
  );
};
