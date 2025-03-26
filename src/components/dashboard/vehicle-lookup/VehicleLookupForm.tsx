
import { useState, FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, SearchIcon } from "lucide-react";
import { AddCarParams } from '@/hooks/use-tracked-cars';

export interface VehicleLookupFormProps {
  onSubmit: (registration: string) => Promise<void>;
  isLoading: boolean;
  onCarAdded?: () => void;
  addCar?: (car: AddCarParams) => Promise<boolean>;
}

export const VehicleLookupForm = ({ 
  onSubmit, 
  isLoading,
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
      <div className="space-y-2">
        <Label htmlFor="registration" className="text-base font-medium">
          Registration Number
        </Label>
        <div className="relative">
          <Input
            id="registration"
            placeholder="Enter UK registration (e.g. AB12CDE)"
            value={registration}
            onChange={(e) => setRegistration(e.target.value)}
            className="pl-4 pr-4 py-6 text-base placeholder:text-muted-foreground/70 bg-background"
            disabled={isLoading}
          />
          <div className="absolute inset-y-0 right-0 flex items-center">
            <Button 
              type="submit" 
              className="rounded-l-none h-full px-5"
              disabled={isLoading || !registration.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <SearchIcon className="mr-2 h-4 w-4" />
                  <span>Search</span>
                </>
              )}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Enter a valid UK vehicle registration to retrieve vehicle details
        </p>
      </div>
    </form>
  );
};
