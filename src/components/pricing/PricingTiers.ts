
interface PricingTier {
  maxUrls: number;
  basePrice: number;
  pricePerUrl: number;
}

export const pricingTiers: PricingTier[] = [
  { maxUrls: 1, basePrice: 0, pricePerUrl: 0 },         // Free
  { maxUrls: 5, basePrice: 3, pricePerUrl: 0.75 },      // $3 for 2 URLs, then +$0.75 per URL
  { maxUrls: 25, basePrice: 5.25, pricePerUrl: 0.5 },   // After 5 URLs, +$0.50 per URL
  { maxUrls: 50, basePrice: 15.25, pricePerUrl: 0.33 }, // After 25 URLs, +$0.33 per URL
  { maxUrls: 100, basePrice: 23.5, pricePerUrl: 0.25 }, // After 50 URLs, +$0.25 per URL
  { maxUrls: 175, basePrice: 36, pricePerUrl: 0.22 },   // After 100 URLs, +$0.22 per URL
  { maxUrls: 250, basePrice: 52.5, pricePerUrl: null }  // Special linear scaling between 175-250
];

// Enterprise tier is handled separately (anything over 250 URLs)
export const ENTERPRISE_CAP = 110; // Maximum price for enterprise tier

// API Access pricing
export const API_ACCESS_MONTHLY_PRICE = 6;
export const API_ACCESS_FREE_THRESHOLD = 125; // URLs above which API access is free
