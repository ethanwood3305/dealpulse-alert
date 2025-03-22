
import { Database } from './types';

// Export table names as a type for better type checking
export type Tables = keyof Database['public']['Tables'];

// Define ScrapedListing type from the database structure
export interface ScrapedListing {
  id: string;
  tracked_car_id: string;
  dealer_name: string;
  url: string;
  title: string;
  price: number;
  mileage: number;
  year: number;
  color: string;
  location: string;
  lat: number;
  lng: number;
  is_cheapest: boolean;
  created_at: string;
}

// Extend Database type to include scraped_vehicle_listings
declare module './types' {
  interface Database {
    public: {
      Tables: {
        scraped_vehicle_listings: {
          Row: ScrapedListing;
          Insert: Partial<ScrapedListing> & { tracked_car_id: string };
          Update: Partial<ScrapedListing>;
        };
      } & Database['public']['Tables'];
    };
  }
}

export type { Database };
