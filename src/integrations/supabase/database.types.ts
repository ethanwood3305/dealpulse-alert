
import { Database as SupabaseDatabase } from './types';

// Export table names as a type for better type checking
export type Tables = keyof SupabaseDatabase['public']['Tables'];

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

// Export the Database type
export type { SupabaseDatabase as Database };
