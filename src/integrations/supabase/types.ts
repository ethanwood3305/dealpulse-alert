export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      car_brands: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      car_models: {
        Row: {
          brand_id: string
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          brand_id: string
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          brand_id?: string
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "car_models_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "car_brands"
            referencedColumns: ["id"]
          },
        ]
      }
      engine_types: {
        Row: {
          capacity: string | null
          created_at: string | null
          fuel_type: string
          id: string
          model_id: string
          name: string
          power: string | null
        }
        Insert: {
          capacity?: string | null
          created_at?: string | null
          fuel_type: string
          id?: string
          model_id: string
          name: string
          power?: string | null
        }
        Update: {
          capacity?: string | null
          created_at?: string | null
          fuel_type?: string
          id?: string
          model_id?: string
          name?: string
          power?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "engine_types_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "car_models"
            referencedColumns: ["id"]
          },
        ]
      }
      scraped_vehicle_listings: {
        Row: {
          color: string | null
          created_at: string
          dealer_name: string
          id: string
          is_cheapest: boolean | null
          lat: number | null
          lng: number | null
          location: string | null
          mileage: number
          price: number
          title: string
          tracked_car_id: string
          url: string
          year: number
        }
        Insert: {
          color?: string | null
          created_at?: string
          dealer_name: string
          id?: string
          is_cheapest?: boolean | null
          lat?: number | null
          lng?: number | null
          location?: string | null
          mileage: number
          price: number
          title: string
          tracked_car_id: string
          url: string
          year: number
        }
        Update: {
          color?: string | null
          created_at?: string
          dealer_name?: string
          id?: string
          is_cheapest?: boolean | null
          lat?: number | null
          lng?: number | null
          location?: string | null
          mileage?: number
          price?: number
          title?: string
          tracked_car_id?: string
          url?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "scraped_vehicle_listings_tracked_car_id_fkey"
            columns: ["tracked_car_id"]
            isOneToOne: false
            referencedRelation: "tracked_urls"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          api_key: string | null
          created_at: string
          dealer_postcode: string | null
          has_api_access: boolean | null
          id: string
          plan: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          theme_preference: string | null
          trial_end: string | null
          updated_at: string
          urls_limit: number
          user_id: string
        }
        Insert: {
          api_key?: string | null
          created_at?: string
          dealer_postcode?: string | null
          has_api_access?: boolean | null
          id?: string
          plan?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          theme_preference?: string | null
          trial_end?: string | null
          updated_at?: string
          urls_limit?: number
          user_id: string
        }
        Update: {
          api_key?: string | null
          created_at?: string
          dealer_postcode?: string | null
          has_api_access?: boolean | null
          id?: string
          plan?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          theme_preference?: string | null
          trial_end?: string | null
          updated_at?: string
          urls_limit?: number
          user_id?: string
        }
        Relationships: []
      }
      tracked_urls: {
        Row: {
          cheapest_price: number | null
          created_at: string
          id: string
          last_checked: string | null
          last_price: number | null
          tags: string[] | null
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          cheapest_price?: number | null
          created_at?: string
          id?: string
          last_checked?: string | null
          last_price?: number | null
          tags?: string[] | null
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          cheapest_price?: number | null
          created_at?: string
          id?: string
          last_checked?: string | null
          last_price?: number | null
          tags?: string[] | null
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_add_more_urls: {
        Args: {
          user_uuid: string
        }
        Returns: boolean
      }
      delete_tracked_car_with_listings: {
        Args: {
          car_id: string
        }
        Returns: boolean
      }
      get_scraped_listings_for_car: {
        Args: {
          car_id: string
        }
        Returns: {
          id: string
          tracked_car_id: string
          dealer_name: string
          url: string
          title: string
          price: number
          mileage: number
          year: number
          color: string
          location: string
          lat: number
          lng: number
          is_cheapest: boolean
          created_at: string
        }[]
      }
      get_user_subscription: {
        Args: {
          user_uuid: string
        }
        Returns: {
          plan: string
          urls_limit: number
          stripe_customer_id: string
          stripe_subscription_id: string
          has_api_access: boolean
          api_key: string
          trial_end: string
          dealer_postcode: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
