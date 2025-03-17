
interface PricingTier {
  maxUrls: number;
  basePrice: number;
  pricePerUrl: number | null;
}

export const pricingTiers: PricingTier[] = [
  { maxUrls: 1, basePrice: 0, pricePerUrl: 0 },         // Free
  { maxUrls: 5, basePrice: 3, pricePerUrl: 3 },         // $3 per URL after first free URL
  { maxUrls: 25, basePrice: 12, pricePerUrl: 0.5 },     // $12 for first 5 URLs, then +$0.50 per URL
  { maxUrls: 50, basePrice: 22, pricePerUrl: 0.33 },    // $22 for first 25 URLs, then +$0.33 per URL
  { maxUrls: 100, basePrice: 30.25, pricePerUrl: 0.25 }, // $30.25 for first 50 URLs, then +$0.25 per URL
  { maxUrls: 175, basePrice: 42.75, pricePerUrl: 0.22 }, // $42.75 for first 100 URLs, then +$0.22 per URL
  { maxUrls: 250, basePrice: 59.25, pricePerUrl: null }  // Special linear scaling between 175-250
];

// Enterprise tier is handled separately (anything over 250 URLs)
export const ENTERPRISE_CAP = 110; // Maximum price for enterprise tier

// API Access pricing
export const API_ACCESS_MONTHLY_PRICE = 6;
export const API_ACCESS_FREE_THRESHOLD = 125; // URLs above which API access is free

// Trial parameters
export const TRIAL_URLS = 10; // Number of URLs for the trial
export const TRIAL_HOURS = 48; // Trial duration in hours
