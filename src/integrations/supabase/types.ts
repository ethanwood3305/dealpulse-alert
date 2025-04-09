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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
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
      apply_organization_rls_policies: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      can_add_more_urls: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      delete_car_completely: {
        Args: { car_id: string }
        Returns: boolean
      }
      delete_tracked_car_with_listings: {
        Args: { car_id: string }
        Returns: boolean
      }
      get_scraped_listings_for_car: {
        Args: { car_id: string }
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
      get_user_organizations: {
        Args: { user_uuid: string }
        Returns: string[]
      }
      get_user_subscription: {
        Args: { user_uuid: string }
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
      reset_organization_rls_policies: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      user_is_org_member: {
        Args: { org_id: string }
        Returns: boolean
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
