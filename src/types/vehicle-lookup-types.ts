
export interface VehicleDetails {
  registration: string;
  originalRegistration?: string;
  make: string;
  model: string;
  color: string;
  fuelType: string;
  year: string;
  engineSize: string;
  motStatus: string;
  motExpiryDate: string | null;
  taxStatus: string;
  taxDueDate: string | null;
  doorCount?: string;
  bodyStyle?: string;
  transmission?: string;
  weight?: string;
  price?: string;
  trim?: string;
}

export interface VehicleLookupProps {
  userId: string;
  onCarAdded?: () => void;
}
