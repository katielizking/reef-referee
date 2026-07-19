export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      filters: {
        Row: {
          id: string
          name: string
          rated_litres: number
          turnover_lph: number
        }
        Insert: {
          id?: string
          name: string
          rated_litres: number
          turnover_lph: number
        }
        Update: {
          id?: string
          name?: string
          rated_litres?: number
          turnover_lph?: number
        }
        Relationships: []
      }
      hardscape: {
        Row: {
          biotope_region: string
          id: string
          name: string
          type: string
        }
        Insert: {
          biotope_region: string
          id?: string
          name: string
          type: string
        }
        Update: {
          biotope_region?: string
          id?: string
          name?: string
          type?: string
        }
        Relationships: []
      }
      plants: {
        Row: {
          biotope_region: string
          common_name: string
          id: string
          light_need: string
          scientific_name: string
        }
        Insert: {
          biotope_region: string
          common_name: string
          id?: string
          light_need: string
          scientific_name: string
        }
        Update: {
          biotope_region?: string
          common_name?: string
          id?: string
          light_need?: string
          scientific_name?: string
        }
        Relationships: []
      }
      species: {
        Row: {
          active: boolean
          adult_size_cm: number
          bioload_factor: number
          biotope_region: string
          common_name: string
          fin_nipper: boolean
          id: string
          is_schooling: boolean
          legal_in_australia: boolean
          long_finned: boolean
          min_group_size: number
          min_tank_litres: number
          native_habitat_type: string
          native_ph_max: number
          native_ph_min: number
          native_temp_max_c: number
          native_temp_min_c: number
          predatory: boolean
          scientific_name: string
          swim_zone: string
          temperament: string
        }
        Insert: {
          active?: boolean
          adult_size_cm: number
          bioload_factor: number
          biotope_region: string
          common_name: string
          fin_nipper?: boolean
          id?: string
          is_schooling?: boolean
          legal_in_australia?: boolean
          long_finned?: boolean
          min_group_size?: number
          min_tank_litres: number
          native_habitat_type: string
          native_ph_max: number
          native_ph_min: number
          native_temp_max_c: number
          native_temp_min_c: number
          predatory?: boolean
          scientific_name: string
          swim_zone: string
          temperament: string
        }
        Update: {
          active?: boolean
          adult_size_cm?: number
          bioload_factor?: number
          biotope_region?: string
          common_name?: string
          fin_nipper?: boolean
          id?: string
          is_schooling?: boolean
          legal_in_australia?: boolean
          long_finned?: boolean
          min_group_size?: number
          min_tank_litres?: number
          native_habitat_type?: string
          native_ph_max?: number
          native_ph_min?: number
          native_temp_max_c?: number
          native_temp_min_c?: number
          predatory?: boolean
          scientific_name?: string
          swim_zone?: string
          temperament?: string
        }
        Relationships: []
      }
      tank_hardscape: {
        Row: {
          hardscape_id: string
          quantity: number
          tank_id: string
        }
        Insert: {
          hardscape_id: string
          quantity?: number
          tank_id: string
        }
        Update: {
          hardscape_id?: string
          quantity?: number
          tank_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tank_hardscape_hardscape_id_fkey"
            columns: ["hardscape_id"]
            isOneToOne: false
            referencedRelation: "hardscape"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tank_hardscape_tank_id_fkey"
            columns: ["tank_id"]
            isOneToOne: false
            referencedRelation: "tanks"
            referencedColumns: ["id"]
          },
        ]
      }
      tank_plants: {
        Row: {
          plant_id: string
          quantity: number
          tank_id: string
        }
        Insert: {
          plant_id: string
          quantity?: number
          tank_id: string
        }
        Update: {
          plant_id?: string
          quantity?: number
          tank_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tank_plants_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "plants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tank_plants_tank_id_fkey"
            columns: ["tank_id"]
            isOneToOne: false
            referencedRelation: "tanks"
            referencedColumns: ["id"]
          },
        ]
      }
      tank_species: {
        Row: {
          quantity: number
          species_id: string
          tank_id: string
        }
        Insert: {
          quantity: number
          species_id: string
          tank_id: string
        }
        Update: {
          quantity?: number
          species_id?: string
          tank_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tank_species_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tank_species_tank_id_fkey"
            columns: ["tank_id"]
            isOneToOne: false
            referencedRelation: "tanks"
            referencedColumns: ["id"]
          },
        ]
      }
      tanks: {
        Row: {
          created_at: string
          filter_id: string | null
          height_cm: number
          id: string
          length_cm: number
          maintenance_frequency: string
          name: string
          plant_density: string
          session_id: string
          share_slug: string
          target_ph: number
          target_temp_c: number
          user_id: string | null
          width_cm: number
        }
        Insert: {
          created_at?: string
          filter_id?: string | null
          height_cm: number
          id?: string
          length_cm: number
          maintenance_frequency?: string
          name: string
          plant_density?: string
          session_id: string
          share_slug?: string
          target_ph?: number
          target_temp_c?: number
          user_id?: string | null
          width_cm: number
        }
        Update: {
          created_at?: string
          filter_id?: string | null
          height_cm?: number
          id?: string
          length_cm?: number
          maintenance_frequency?: string
          name?: string
          plant_density?: string
          session_id?: string
          share_slug?: string
          target_ph?: number
          target_temp_c?: number
          user_id?: string | null
          width_cm?: number
        }
        Relationships: [
          {
            foreignKeyName: "tanks_filter_id_fkey"
            columns: ["filter_id"]
            isOneToOne: false
            referencedRelation: "filters"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
