
// Utility for calculating subscription pricing

/**
 * Calculate the price for a subscription with the given parameters
 * @param urls Number of URLs to monitor
 * @param includeApiAccess Whether to include API access
 * @param billingCycle Monthly or yearly billing
 * @returns Calculated price
 */
export const calculatePrice = (urls: number, includeApiAccess: boolean, billingCycle: 'monthly' | 'yearly'): number => {
  if (urls <= 1) return 0; // Free for 1 URL
  
  let basePrice = 0;
  
  // Find base tier price
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
  const needsApiAccessCharge = includeApiAccess && urls > 1 && urls <= 125;
  
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
