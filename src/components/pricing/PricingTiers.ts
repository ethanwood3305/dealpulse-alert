
interface PricingTier {
  maxCars: number;
  basePrice: number;
  pricePerCar: number | null;
}

export const pricingTiers: PricingTier[] = [
  { maxCars: 1, basePrice: 0, pricePerCar: 0 },         // Free
  { maxCars: 5, basePrice: 3, pricePerCar: 3 },         // $3 per car after first free car
  { maxCars: 25, basePrice: 12, pricePerCar: 0.5 },     // $12 for first 5 cars, then +$0.50 per car
  { maxCars: 50, basePrice: 22, pricePerCar: 0.33 },    // $22 for first 25 cars, then +$0.33 per car
  { maxCars: 100, basePrice: 30.25, pricePerCar: 0.25 }, // $30.25 for first 50 cars, then +$0.25 per car
  { maxCars: 175, basePrice: 42.75, pricePerCar: 0.22 }, // $42.75 for first 100 cars, then +$0.22 per car
  { maxCars: 250, basePrice: 59.25, pricePerCar: null }  // Special linear scaling between 175-250
];

// Enterprise tier is handled separately (anything over 250 cars)
export const ENTERPRISE_CAP = 110; // Maximum price for enterprise tier

// API Access pricing
export const API_ACCESS_MONTHLY_PRICE = 6;
export const API_ACCESS_FREE_THRESHOLD = 125; // Cars above which API access is free

// Trial parameters
export const TRIAL_CARS = 10; // Number of cars for the trial
export const TRIAL_HOURS = 48; // Trial duration in hours
