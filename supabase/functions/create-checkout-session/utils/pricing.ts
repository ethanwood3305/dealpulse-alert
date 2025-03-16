
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
  
  let basePrice;
  
  // Tiered pricing structure
  if (urls <= 5) {
    basePrice = 3 + (urls - 2) * 0.75; // $3 for 2 URLs, then +$0.75 per URL
  } else if (urls <= 25) {
    const basePriceAt5 = 3 + (5 - 2) * 0.75; // = $5.25
    basePrice = basePriceAt5 + (urls - 5) * 0.5; // After 5 URLs, +$0.50 per URL
  } else if (urls <= 50) {
    const basePriceAt5 = 3 + (5 - 2) * 0.75; // = $5.25
    const basePriceAt25 = basePriceAt5 + (25 - 5) * 0.5; // = $15.25
    basePrice = basePriceAt25 + (urls - 25) * 0.33; // After 25 URLs, +$0.33 per URL
  } else if (urls <= 100) {
    const basePriceAt5 = 3 + (5 - 2) * 0.75; // = $5.25
    const basePriceAt25 = basePriceAt5 + (25 - 5) * 0.5; // = $15.25
    const basePriceAt50 = basePriceAt25 + (50 - 25) * 0.33; // = $23.5
    basePrice = basePriceAt50 + (urls - 50) * 0.25; // After 50 URLs, +$0.25 per URL
  } else if (urls <= 175) {
    const basePriceAt5 = 3 + (5 - 2) * 0.75; // = $5.25
    const basePriceAt25 = basePriceAt5 + (25 - 5) * 0.5; // = $15.25
    const basePriceAt50 = basePriceAt25 + (50 - 25) * 0.33; // = $23.5
    const basePriceAt100 = basePriceAt50 + (100 - 50) * 0.25; // = $36
    basePrice = basePriceAt100 + (urls - 100) * 0.22; // After 100 URLs, +$0.22 per URL
  } else {
    const basePriceAt5 = 3 + (5 - 2) * 0.75; // = $5.25
    const basePriceAt25 = basePriceAt5 + (25 - 5) * 0.5; // = $15.25
    const basePriceAt50 = basePriceAt25 + (50 - 25) * 0.33; // = $23.5
    const basePriceAt100 = basePriceAt50 + (100 - 50) * 0.25; // = $36
    const basePriceAt175 = basePriceAt100 + (175 - 100) * 0.22; // = $52.5
    
    // For URLs between 175 and 250, scale proportionally from $52.5 to $110
    if (urls <= 250) {
      const range = 250 - 175;
      const position = urls - 175;
      const startPrice = 52.5;
      const endPrice = 110;
      const priceIncrease = endPrice - startPrice;
      
      // Calculate price with linear scaling
      basePrice = startPrice + (priceIncrease * position / range);
    } else {
      // Over 250 URLs - cap at $110
      basePrice = 110;
    }
  }
  
  // Add API access charge if needed
  const needsApiAccessCharge = includeApiAccess && urls > 1 && urls <= 125;
  
  if (needsApiAccessCharge) {
    basePrice += 6; // $6/month for API access
  }
  
  // Apply yearly discount if applicable
  if (billingCycle === 'yearly') {
    basePrice = basePrice * 12 * 0.9; // 10% discount for annual billing, calculated on the full year
  }
  
  return parseFloat(basePrice.toFixed(2));
};
