import { pricingTiers, ENTERPRISE_CAP, API_ACCESS_MONTHLY_PRICE, API_ACCESS_FREE_THRESHOLD } from './PricingTiers';

export const calculatePrice = (urls: number, includeApiAccess: boolean, billingCycle: 'monthly' | 'yearly'): number => {
  if (urls <= 1) return 0; // Free for 1 URL
  
  let basePrice = 0;
  
  // Calculate base price using the same logic as the server
  if (urls <= 5) {
    basePrice = (urls - 1) * 3; // $3 per URL after the free one
  } else if (urls <= 25) {
    basePrice = 12 + (urls - 5) * 0.5; // $12 for first 5 URLs, then +$0.50 per URL
  } else if (urls <= 50) {
    basePrice = 22 + (urls - 25) * 0.33; // $22 for first 25 URLs, then +$0.33 per URL
  } else if (urls <= 100) {
    basePrice = 30.25 + (urls - 50) * 0.25; // $30.25 for first 50 URLs, then +$0.25 per URL
  } else if (urls <= 175) {
    basePrice = 42.75 + (urls - 100) * 0.22; // $42.75 for first 100 URLs, then +$0.22 per URL
  } else if (urls <= 250) {
    // Linear scaling from $59.25 at 175 URLs to $110 at 250 URLs
    const range = 250 - 175;
    const position = urls - 175;
    const startPrice = 59.25;
    const endPrice = 110;
    const priceIncrease = endPrice - startPrice;
    
    basePrice = startPrice + (priceIncrease * position / range);
  } else {
    // Over 250 URLs - cap at $110
    basePrice = 110;
  }
  
  // Add API access charge if needed
  const needsApiAccessCharge = includeApiAccess && urls > 1 && urls <= API_ACCESS_FREE_THRESHOLD;
  
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

export const getCheckFrequency = (urls: number): string => {
  if (urls <= 5) return 'Daily checks';
  if (urls <= 25) return '12-hour checks';
  if (urls <= 50) return '6-hour checks';
  return 'Hourly checks';
};

export const getPriceHistory = (urls: number): string => {
  if (urls < 25) return '3-day price history';
  return '14-day price history';
};

export const getPlanId = (urls: number): string => {
  if (urls <= 1) return 'free';
  if (urls <= 5) return 'starter';
  if (urls <= 25) return 'basic';
  if (urls <= 50) return 'professional';
  if (urls <= 125) return 'business';
  return 'enterprise';
};
