
import { pricingTiers, ENTERPRISE_CAP, API_ACCESS_MONTHLY_PRICE, API_ACCESS_FREE_THRESHOLD } from './PricingTiers';

export const calculatePrice = (urls: number, includeApiAccess: boolean, billingCycle: 'monthly' | 'yearly'): number => {
  if (urls <= 1) return 0; // Free for 1 URL
  
  let basePrice;
  
  // Find the correct pricing tier
  if (urls <= 175) {
    // Handle standard tiers
    const tier = pricingTiers.find((tier, index) => {
      const nextTier = pricingTiers[index + 1];
      return urls <= tier.maxUrls || (nextTier && urls <= nextTier.maxUrls);
    });
    
    if (!tier) {
      console.error("No pricing tier found for URL count:", urls);
      return 0;
    }
    
    // For the last URL before next tier, use the tier's base price
    if (urls === tier.maxUrls) {
      basePrice = tier.basePrice;
    } else {
      // For in-between URLs, calculate based on the tier's formula
      const prevTier = pricingTiers.find(t => t.maxUrls < tier.maxUrls && urls > t.maxUrls);
      
      if (prevTier) {
        // Calculate price based on previous tier's base price plus per-URL charge
        const additionalUrls = urls - prevTier.maxUrls;
        basePrice = prevTier.basePrice + (additionalUrls * tier.pricePerUrl);
      } else {
        // If no previous tier (should be the first tier), calculate directly
        basePrice = tier.basePrice + ((urls - 1) * tier.pricePerUrl);
      }
    }
  } else if (urls <= 250) {
    // Special case: Scale proportionally from $52.5 at 175 URLs to $110 at 250 URLs
    const startTier = pricingTiers.find(t => t.maxUrls === 175);
    if (!startTier) {
      console.error("Could not find the 175 URLs tier");
      return 0;
    }
    
    const range = 250 - 175;
    const position = urls - 175;
    const startPrice = startTier.basePrice;
    const endPrice = ENTERPRISE_CAP;
    const priceIncrease = endPrice - startPrice;
      
    // Calculate price with linear scaling
    basePrice = startPrice + (priceIncrease * position / range);
  } else {
    // Over 250 URLs - cap at enterprise price
    basePrice = ENTERPRISE_CAP;
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
