
export interface CarLocation {
  postcode: string;
  lat: number;
  lng: number;
}

export interface PriceComparison {
  targetPrice: number;
  marketPrice: number;
  difference: number;
  percentageDifference: number;
}

export interface TrackedCarWithLocation extends TrackedCar {
  location?: CarLocation;
  priceComparison?: PriceComparison;
}

export interface TrackedCar {
  id: string;
  brand: string;
  model: string;
  engineType: string;
  mileage?: string;
  year?: string;
  color?: string;
  last_price: number | null;
  last_checked: string | null;
  created_at: string;
  tags: string[];
  doorCount?: string;
  bodyStyle?: string;
  transmission?: string;
  weight?: string;
  registration?: string;
  engineSize?: string;
  motStatus?: string;
  motExpiryDate?: string | null;
  taxStatus?: string;
  taxDueDate?: string | null;
}

export interface DealerVehicle extends TrackedCarWithLocation {
  dealerName: string;
  dealerPhone: string;
  dealerAddress?: string;
  dealerWebsite?: string;
}

export interface VehicleDetails {
  registration: string;
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
}
