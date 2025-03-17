
import { pricingTiers, ENTERPRISE_CAP, API_ACCESS_MONTHLY_PRICE, API_ACCESS_FREE_THRESHOLD } from './PricingTiers';

export const calculatePrice = (cars: number, includeApiAccess: boolean, billingCycle: 'monthly' | 'yearly'): number => {
  if (cars <= 1) return 0; // Free for 1 car
  
  let basePrice = 0;
  
  // Calculate base price using the same logic as the server
  if (cars <= 5) {
    basePrice = (cars - 1) * 3; // $3 per car after the free one
  } else if (cars <= 25) {
    basePrice = 12 + (cars - 5) * 0.5; // $12 for first 5 cars, then +$0.50 per car
  } else if (cars <= 50) {
    basePrice = 22 + (cars - 25) * 0.33; // $22 for first 25 cars, then +$0.33 per car
  } else if (cars <= 100) {
    basePrice = 30.25 + (cars - 50) * 0.25; // $30.25 for first 50 cars, then +$0.25 per car
  } else if (cars <= 175) {
    basePrice = 42.75 + (cars - 100) * 0.22; // $42.75 for first 100 cars, then +$0.22 per car
  } else if (cars <= 250) {
    // Linear scaling from $59.25 at 175 cars to $110 at 250 cars
    const range = 250 - 175;
    const position = cars - 175;
    const startPrice = 59.25;
    const endPrice = 110;
    const priceIncrease = endPrice - startPrice;
    
    basePrice = startPrice + (priceIncrease * position / range);
  } else {
    // Over 250 cars - cap at $110
    basePrice = 110;
  }
  
  // Add API access charge if needed
  const needsApiAccessCharge = includeApiAccess && cars > 1 && cars <= API_ACCESS_FREE_THRESHOLD;
  
  if (needsApiAccessCharge) {
    basePrice += API_ACCESS_MONTHLY_PRICE; // $6/month for API access
  }
  
  // Apply yearly discount if applicable
  if (billingCycle === 'yearly') {
    basePrice = basePrice * 12 * 0.9; // 10% discount for annual billing
  }
  
  // Round to 2 decimal places for consistency with Stripe
  return Math.round(basePrice * 100) / 100;
};

export const getCheckFrequency = (cars: number): string => {
  if (cars <= 5) return 'Daily checks';
  if (cars <= 25) return '12-hour checks';
  if (cars <= 50) return '6-hour checks';
  return 'Hourly checks';
};

export const getPriceHistory = (cars: number): string => {
  if (cars < 25) return '3-day price history';
  return '14-day price history';
};

export const getPlanId = (cars: number): string => {
  if (cars <= 1) return 'free';
  if (cars <= 5) return 'starter';
  if (cars <= 25) return 'basic';
  if (cars <= 50) return 'professional';
  if (cars <= 125) return 'business';
  return 'enterprise';
};
