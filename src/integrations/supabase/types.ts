export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17";
  };
  public: {
    Tables: {
      aquarium_shops: {
        Row: {
          address: string | null;
          affiliate_url: string | null;
          claimed_at: string | null;
          country_code: string;
          created_at: string;
          description: string | null;
          featured: boolean;
          id: string;
          is_affiliate: boolean;
          lat: number | null;
          lng: number | null;
          name: string;
          phone: string | null;
          postcode: string | null;
          slug: string;
          specialties: string[];
          state: string | null;
          suburb: string | null;
          verified_at: string | null;
          website: string | null;
        };
        Insert: {
          address?: string | null;
          affiliate_url?: string | null;
          claimed_at?: string | null;
          country_code?: string;
          created_at?: string;
          description?: string | null;
          featured?: boolean;
          id?: string;
          is_affiliate?: boolean;
          lat?: number | null;
          lng?: number | null;
          name: string;
          phone?: string | null;
          postcode?: string | null;
          slug: string;
          specialties?: string[];
          state?: string | null;
          suburb?: string | null;
          verified_at?: string | null;
          website?: string | null;
        };
        Update: {
          address?: string | null;
          affiliate_url?: string | null;
          claimed_at?: string | null;
          country_code?: string;
          created_at?: string;
          description?: string | null;
          featured?: boolean;
          id?: string;
          is_affiliate?: boolean;
          lat?: number | null;
          lng?: number | null;
          name?: string;
          phone?: string | null;
          postcode?: string | null;
          slug?: string;
          specialties?: string[];
          state?: string | null;
          suburb?: string | null;
          verified_at?: string | null;
          website?: string | null;
        };
        Relationships: [];
      };
      blog_posts: {
        Row: {
          author_name: string | null;
          body_markdown: string;
          cover_image_url: string | null;
          created_at: string;
          excerpt: string | null;
          id: string;
          meta_description: string | null;
          meta_title: string | null;
          published: boolean;
          published_at: string | null;
          slug: string;
          tags: string[];
          title: string;
          updated_at: string;
        };
        Insert: {
          author_name?: string | null;
          body_markdown: string;
          cover_image_url?: string | null;
          created_at?: string;
          excerpt?: string | null;
          id?: string;
          meta_description?: string | null;
          meta_title?: string | null;
          published?: boolean;
          published_at?: string | null;
          slug: string;
          tags?: string[];
          title: string;
          updated_at?: string;
        };
        Update: {
          author_name?: string | null;
          body_markdown?: string;
          cover_image_url?: string | null;
          created_at?: string;
          excerpt?: string | null;
          id?: string;
          meta_description?: string | null;
          meta_title?: string | null;
          published?: boolean;
          published_at?: string | null;
          slug?: string;
          tags?: string[];
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      filters: {
        Row: {
          biological_media_level: string;
          filter_type: string;
          id: string;
          name: string;
          rated_litres: number;
          turnover_lph: number;
        };
        Insert: {
          biological_media_level?: string;
          filter_type?: string;
          id?: string;
          name: string;
          rated_litres: number;
          turnover_lph: number;
        };
        Update: {
          biological_media_level?: string;
          filter_type?: string;
          id?: string;
          name?: string;
          rated_litres?: number;
          turnover_lph?: number;
        };
        Relationships: [];
      };
      hardscape: {
        Row: {
          biotope_region: string;
          id: string;
          name: string;
          type: string;
        };
        Insert: {
          biotope_region: string;
          id?: string;
          name: string;
          type: string;
        };
        Update: {
          biotope_region?: string;
          id?: string;
          name?: string;
          type?: string;
        };
        Relationships: [];
      };
      plants: {
        Row: {
          biotope_region: string;
          care_confidence: string;
          care_reviewed_on: string | null;
          care_source_label: string | null;
          care_source_url: string | null;
          common_name: string;
          conspecific_notes: string | null;
          conspecific_sex_ratio_note: string | null;
          conspecific_strategy: string;
          id: string;
          light_need: string;
          scientific_name: string;
        };
        Insert: {
          biotope_region: string;
          care_confidence?: string;
          care_reviewed_on?: string | null;
          care_source_label?: string | null;
          care_source_url?: string | null;
          common_name: string;
          conspecific_notes?: string | null;
          conspecific_sex_ratio_note?: string | null;
          conspecific_strategy?: string;
          id?: string;
          light_need: string;
          scientific_name: string;
        };
        Update: {
          biotope_region?: string;
          care_confidence?: string;
          care_reviewed_on?: string | null;
          care_source_label?: string | null;
          care_source_url?: string | null;
          common_name?: string;
          conspecific_notes?: string | null;
          conspecific_sex_ratio_note?: string | null;
          conspecific_strategy?: string;
          id?: string;
          light_need?: string;
          scientific_name?: string;
        };
        Relationships: [];
      };
      species: {
        Row: {
          active: boolean;
          adult_size_cm: number;
          bioload_factor: number;
          biotope_region: string;
          common_name: string;
          fin_nipper: boolean;
          id: string;
          is_schooling: boolean;
          legal_in_australia: boolean;
          legal_note: string | null;
          legal_status: string;
          long_finned: boolean;
          min_group_size: number;
          min_tank_litres: number;
          native_habitat_type: string;
          native_ph_max: number;
          native_ph_min: number;
          native_temp_max_c: number;
          native_temp_min_c: number;
          predatory: boolean;
          scientific_name: string;
          swim_zone: string;
          temperament: string;
        };
        Insert: {
          active?: boolean;
          adult_size_cm: number;
          bioload_factor: number;
          biotope_region: string;
          common_name: string;
          fin_nipper?: boolean;
          id?: string;
          is_schooling?: boolean;
          legal_in_australia?: boolean;
          legal_note?: string | null;
          legal_status?: string;
          long_finned?: boolean;
          min_group_size?: number;
          min_tank_litres: number;
          native_habitat_type: string;
          native_ph_max: number;
          native_ph_min: number;
          native_temp_max_c: number;
          native_temp_min_c: number;
          predatory?: boolean;
          scientific_name: string;
          swim_zone: string;
          temperament: string;
        };
        Update: {
          active?: boolean;
          adult_size_cm?: number;
          bioload_factor?: number;
          biotope_region?: string;
          common_name?: string;
          fin_nipper?: boolean;
          id?: string;
          is_schooling?: boolean;
          legal_in_australia?: boolean;
          legal_note?: string | null;
          legal_status?: string;
          long_finned?: boolean;
          min_group_size?: number;
          min_tank_litres?: number;
          native_habitat_type?: string;
          native_ph_max?: number;
          native_ph_min?: number;
          native_temp_max_c?: number;
          native_temp_min_c?: number;
          predatory?: boolean;
          scientific_name?: string;
          swim_zone?: string;
          temperament?: string;
        };
        Relationships: [];
      };
      tank_hardscape: {
        Row: {
          hardscape_id: string;
          quantity: number;
          tank_id: string;
        };
        Insert: {
          hardscape_id: string;
          quantity?: number;
          tank_id: string;
        };
        Update: {
          hardscape_id?: string;
          quantity?: number;
          tank_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tank_hardscape_hardscape_id_fkey";
            columns: ["hardscape_id"];
            isOneToOne: false;
            referencedRelation: "hardscape";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tank_hardscape_tank_id_fkey";
            columns: ["tank_id"];
            isOneToOne: false;
            referencedRelation: "tanks";
            referencedColumns: ["id"];
          },
        ];
      };
      tank_plants: {
        Row: {
          plant_id: string;
          quantity: number;
          tank_id: string;
        };
        Insert: {
          plant_id: string;
          quantity?: number;
          tank_id: string;
        };
        Update: {
          plant_id?: string;
          quantity?: number;
          tank_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tank_plants_plant_id_fkey";
            columns: ["plant_id"];
            isOneToOne: false;
            referencedRelation: "plants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tank_plants_tank_id_fkey";
            columns: ["tank_id"];
            isOneToOne: false;
            referencedRelation: "tanks";
            referencedColumns: ["id"];
          },
        ];
      };
      tank_species: {
        Row: {
          quantity: number;
          species_id: string;
          tank_id: string;
        };
        Insert: {
          quantity: number;
          species_id: string;
          tank_id: string;
        };
        Update: {
          quantity?: number;
          species_id?: string;
          tank_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tank_species_species_id_fkey";
            columns: ["species_id"];
            isOneToOne: false;
            referencedRelation: "species";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tank_species_tank_id_fkey";
            columns: ["tank_id"];
            isOneToOne: false;
            referencedRelation: "tanks";
            referencedColumns: ["id"];
          },
        ];
      };
      tanks: {
        Row: {
          ammonia_mg_l: number | null;
          biological_media_level: string;
          created_at: string;
          cycle_method: string;
          cycle_status: string;
          filter_id: string | null;
          filter_maturity: string;
          height_cm: number;
          id: string;
          length_cm: number;
          maintenance_frequency: string;
          name: string;
          nitrate_mg_l: number | null;
          nitrite_mg_l: number | null;
          plant_density: string;
          session_id: string | null;
          seeded_media: boolean;
          tank_age_weeks: number | null;
          share_slug: string;
          target_ph: number;
          target_temp_c: number;
          user_id: string | null;
          water_tested_on: string | null;
          width_cm: number;
        };
        Insert: {
          ammonia_mg_l?: number | null;
          biological_media_level?: string;
          created_at?: string;
          cycle_method?: string;
          cycle_status?: string;
          filter_id?: string | null;
          filter_maturity?: string;
          height_cm: number;
          id?: string;
          length_cm: number;
          maintenance_frequency?: string;
          name: string;
          nitrate_mg_l?: number | null;
          nitrite_mg_l?: number | null;
          plant_density?: string;
          session_id?: string | null;
          seeded_media?: boolean;
          tank_age_weeks?: number | null;
          share_slug?: string;
          target_ph?: number;
          target_temp_c?: number;
          user_id?: string | null;
          water_tested_on?: string | null;
          width_cm: number;
        };
        Update: {
          ammonia_mg_l?: number | null;
          biological_media_level?: string;
          created_at?: string;
          cycle_method?: string;
          cycle_status?: string;
          filter_id?: string | null;
          filter_maturity?: string;
          height_cm?: number;
          id?: string;
          length_cm?: number;
          maintenance_frequency?: string;
          name?: string;
          nitrate_mg_l?: number | null;
          nitrite_mg_l?: number | null;
          plant_density?: string;
          session_id?: string | null;
          seeded_media?: boolean;
          tank_age_weeks?: number | null;
          share_slug?: string;
          target_ph?: number;
          target_temp_c?: number;
          user_id?: string | null;
          water_tested_on?: string | null;
          width_cm?: number;
        };
        Relationships: [
          {
            foreignKeyName: "tanks_filter_id_fkey";
            columns: ["filter_id"];
            isOneToOne: false;
            referencedRelation: "filters";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_shared_tank: { Args: { p_slug: string }; Returns: Json };
      join_account_waitlist: { Args: { p_email: string }; Returns: undefined };
      record_score_event: {
        Args: { p_issue_codes: string[]; p_verdict: string };
        Returns: undefined;
      };
      record_shop_outbound: {
        Args: { p_destination: string; p_shop_id: string };
        Returns: undefined;
      };
      submit_contact_request: {
        Args: { p_email: string; p_message: string; p_topic: string };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
