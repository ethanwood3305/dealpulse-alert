
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
}
