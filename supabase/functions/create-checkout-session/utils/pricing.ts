
// Utility for calculating subscription pricing

/**
 * Calculate the price for a subscription with the given parameters
 * @param cars Number of cars to monitor
 * @param includeApiAccess Whether to include API access
 * @param billingCycle Monthly or yearly billing
 * @returns Calculated price
 */
export const calculatePrice = (cars: number, includeApiAccess: boolean, billingCycle: 'monthly' | 'yearly'): number => {
  if (cars <= 1) return 0; // Free for 1 car
  
  let basePrice = 0;
  
  // Find base tier price
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
  const needsApiAccessCharge = includeApiAccess && cars > 1 && cars <= 125;
  
  if (needsApiAccessCharge) {
    basePrice += 6; // $6/month for API access
  }
  
  // Apply yearly discount if applicable
  if (billingCycle === 'yearly') {
    basePrice = basePrice * 12 * 0.9; // 10% discount for annual billing
  }
  
  // Round to 2 decimal places for consistency with Stripe
  return Math.round(basePrice * 100) / 100;
};

// Trial parameters
export const TRIAL_CARS = 10; // Number of cars for the trial
export const TRIAL_HOURS = 48; // Trial duration in hours
