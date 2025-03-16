
export const calculatePrice = (urls: number, includeApiAccess: boolean, billingCycle: 'monthly' | 'yearly'): number => {
  if (urls <= 1) return 0; // Free for 1 URL
  
  let basePrice;
  
  if (urls <= 5) {
    basePrice = 3 + (urls - 2) * 0.75; // $3 for 2 URLs, then +$0.75 per URL
  } else if (urls <= 25) {
    basePrice = 6 + (urls - 5) * 0.5; // After 5 URLs, slower increase per URL
  } else if (urls <= 50) {
    // Fix for the 26-50 URLs range
    const basePriceAt25 = 6 + (25 - 5) * 0.5; // = $16
    basePrice = basePriceAt25 + (urls - 25) * 0.33; // Adjusted to $0.33 per URL after 25
  } else if (urls <= 100) {
    const basePriceAt50 = 16 + (50 - 25) * 0.33; // = $24.25
    basePrice = basePriceAt50 + (urls - 50) * 0.4; // After 50 URLs, $0.40 per URL
  } else if (urls <= 175) {
    const basePriceAt100 = 24.25 + (100 - 50) * 0.4; // = $44.25
    basePrice = basePriceAt100 + (urls - 100) * 0.35; // After 100 URLs, lower price
  } else {
    const basePriceAt175 = 44.25 + (175 - 100) * 0.35; // = $70.5
    basePrice = basePriceAt175 + (urls - 175) * 0.15; // After 175 URLs, lowest per-URL price
  }
  
  const needsApiAccessCharge = includeApiAccess && urls > 1 && urls <= 125;
  
  if (needsApiAccessCharge) {
    basePrice += 6; // $6/month for API access
  }
  
  if (urls === 250) {
    basePrice = Math.min(basePrice, 100);
  }
  
  if (billingCycle === 'yearly') {
    basePrice = basePrice * 12 * 0.9; // 10% discount for annual billing, calculated on the full year
  }
  
  return parseFloat(basePrice.toFixed(2));
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
