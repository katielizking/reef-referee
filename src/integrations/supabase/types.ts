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
      aquarium_shops: {
        Row: {
          address: string | null
          affiliate_url: string | null
          city: string | null
          claimed_at: string | null
          country_code: string
          created_at: string
          delivery_reviewed_on: string | null
          description: string | null
          featured: boolean
          id: string
          independent_note: string | null
          is_affiliate: boolean
          lat: number | null
          lng: number | null
          name: string
          ownership: string
          phone: string | null
          pickup_only: boolean
          postcode: string | null
          region: string | null
          search_url_template: string | null
          sells_online: boolean
          shipping_note: string | null
          ships_live_fish: boolean
          ships_to_countries: string[]
          ships_to_regions: string[]
          slug: string
          specialties: string[]
          state: string | null
          suburb: string | null
          verified_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          affiliate_url?: string | null
          city?: string | null
          claimed_at?: string | null
          country_code?: string
          created_at?: string
          delivery_reviewed_on?: string | null
          description?: string | null
          featured?: boolean
          id?: string
          independent_note?: string | null
          is_affiliate?: boolean
          lat?: number | null
          lng?: number | null
          name: string
          ownership?: string
          phone?: string | null
          pickup_only?: boolean
          postcode?: string | null
          region?: string | null
          search_url_template?: string | null
          sells_online?: boolean
          shipping_note?: string | null
          ships_live_fish?: boolean
          ships_to_countries?: string[]
          ships_to_regions?: string[]
          slug: string
          specialties?: string[]
          state?: string | null
          suburb?: string | null
          verified_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          affiliate_url?: string | null
          city?: string | null
          claimed_at?: string | null
          country_code?: string
          created_at?: string
          delivery_reviewed_on?: string | null
          description?: string | null
          featured?: boolean
          id?: string
          independent_note?: string | null
          is_affiliate?: boolean
          lat?: number | null
          lng?: number | null
          name?: string
          ownership?: string
          phone?: string | null
          pickup_only?: boolean
          postcode?: string | null
          region?: string | null
          search_url_template?: string | null
          sells_online?: boolean
          shipping_note?: string | null
          ships_live_fish?: boolean
          ships_to_countries?: string[]
          ships_to_regions?: string[]
          slug?: string
          specialties?: string[]
          state?: string | null
          suburb?: string | null
          verified_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_name: string | null
          body_markdown: string
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          published: boolean
          published_at: string | null
          slug: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          author_name?: string | null
          body_markdown: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published?: boolean
          published_at?: string | null
          slug: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          author_name?: string | null
          body_markdown?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published?: boolean
          published_at?: string | null
          slug?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      community_actions: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      community_admin_emails: {
        Row: {
          email: string
        }
        Insert: {
          email: string
        }
        Update: {
          email?: string
        }
        Relationships: []
      }
      community_bans: {
        Row: {
          created_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      community_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          edited_at: string | null
          id: string
          parent_id: string | null
          post_id: string
          status: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          edited_at?: string | null
          id?: string
          parent_id?: string | null
          post_id: string
          status?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          parent_id?: string | null
          post_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "community_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          author_id: string
          body: string
          comment_count: number
          created_at: string
          edited_at: string | null
          flair: string
          id: string
          link_url: string | null
          locked: boolean
          score: number
          status: string
          title: string
        }
        Insert: {
          author_id: string
          body?: string
          comment_count?: number
          created_at?: string
          edited_at?: string | null
          flair?: string
          id?: string
          link_url?: string | null
          locked?: boolean
          score?: number
          status?: string
          title: string
        }
        Update: {
          author_id?: string
          body?: string
          comment_count?: number
          created_at?: string
          edited_at?: string | null
          flair?: string
          id?: string
          link_url?: string | null
          locked?: boolean
          score?: number
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "community_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_profiles: {
        Row: {
          created_at: string
          handle: string
          id: string
        }
        Insert: {
          created_at?: string
          handle: string
          id: string
        }
        Update: {
          created_at?: string
          handle?: string
          id?: string
        }
        Relationships: []
      }
      community_reports: {
        Row: {
          comment_id: string | null
          created_at: string
          id: string
          post_id: string
          reason: string
          reporter_id: string
          resolved: boolean
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id: string
          reason: string
          reporter_id: string
          resolved?: boolean
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string
          reason?: string
          reporter_id?: string
          resolved?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "community_reports_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_saves: {
        Row: {
          post_id: string
          user_id: string
        }
        Insert: {
          post_id: string
          user_id: string
        }
        Update: {
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_saves_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_saves_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_votes: {
        Row: {
          post_id: string
          user_id: string
          value: number
        }
        Insert: {
          post_id: string
          user_id: string
          value: number
        }
        Update: {
          post_id?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "community_votes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_votes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_requests: {
        Row: {
          created_at: string
          email: string
          id: number
          message: string
          topic: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: number
          message: string
          topic: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: number
          message?: string
          topic?: string
        }
        Relationships: []
      }
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
      invertebrates: {
        Row: {
          adult_size_cm: number
          algae_role: string | null
          bioload_factor: number
          biotope_region: string
          care_confidence: string
          care_notes: string | null
          care_reviewed_on: string | null
          care_source_label: string | null
          care_source_url: string | null
          common_name: string
          created_at: string
          fish_risk_note: string | null
          id: string
          invert_group: string
          legal_note: string | null
          legal_status: string
          min_group_size: number
          min_tank_litres: number
          native_ph_max: number
          native_ph_min: number
          native_temp_max_c: number
          native_temp_min_c: number
          needs_land: boolean
          predatory: boolean
          scientific_name: string
          temperament: string
        }
        Insert: {
          adult_size_cm: number
          algae_role?: string | null
          bioload_factor: number
          biotope_region?: string
          care_confidence?: string
          care_notes?: string | null
          care_reviewed_on?: string | null
          care_source_label?: string | null
          care_source_url?: string | null
          common_name: string
          created_at?: string
          fish_risk_note?: string | null
          id?: string
          invert_group?: string
          legal_note?: string | null
          legal_status?: string
          min_group_size?: number
          min_tank_litres: number
          native_ph_max: number
          native_ph_min: number
          native_temp_max_c: number
          native_temp_min_c: number
          needs_land?: boolean
          predatory?: boolean
          scientific_name: string
          temperament?: string
        }
        Update: {
          adult_size_cm?: number
          algae_role?: string | null
          bioload_factor?: number
          biotope_region?: string
          care_confidence?: string
          care_notes?: string | null
          care_reviewed_on?: string | null
          care_source_label?: string | null
          care_source_url?: string | null
          common_name?: string
          created_at?: string
          fish_risk_note?: string | null
          id?: string
          invert_group?: string
          legal_note?: string | null
          legal_status?: string
          min_group_size?: number
          min_tank_litres?: number
          native_ph_max?: number
          native_ph_min?: number
          native_temp_max_c?: number
          native_temp_min_c?: number
          needs_land?: boolean
          predatory?: boolean
          scientific_name?: string
          temperament?: string
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
      score_events: {
        Row: {
          created_at: string
          id: number
          issue_codes: string[]
          verdict: string
        }
        Insert: {
          created_at?: string
          id?: number
          issue_codes?: string[]
          verdict: string
        }
        Update: {
          created_at?: string
          id?: number
          issue_codes?: string[]
          verdict?: string
        }
        Relationships: []
      }
      shop_outbound_events: {
        Row: {
          created_at: string
          destination: string
          id: number
          shop_id: string | null
        }
        Insert: {
          created_at?: string
          destination: string
          id?: number
          shop_id?: string | null
        }
        Update: {
          created_at?: string
          destination?: string
          id?: number
          shop_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shop_outbound_events_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "aquarium_shops"
            referencedColumns: ["id"]
          },
        ]
      }
      species: {
        Row: {
          active: boolean
          adult_size_cm: number
          bioload_factor: number
          biotope_region: string
          care_confidence: string
          care_reviewed_on: string | null
          care_source_label: string | null
          care_source_url: string | null
          common_name: string
          conspecific_notes: string | null
          conspecific_sex_ratio_note: string | null
          conspecific_strategy: string
          fin_nipper: boolean
          id: string
          is_schooling: boolean
          legal_in_australia: boolean
          legal_note: string | null
          legal_status: string
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
          care_confidence?: string
          care_reviewed_on?: string | null
          care_source_label?: string | null
          care_source_url?: string | null
          common_name: string
          conspecific_notes?: string | null
          conspecific_sex_ratio_note?: string | null
          conspecific_strategy?: string
          fin_nipper?: boolean
          id?: string
          is_schooling?: boolean
          legal_in_australia?: boolean
          legal_note?: string | null
          legal_status?: string
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
          care_confidence?: string
          care_reviewed_on?: string | null
          care_source_label?: string | null
          care_source_url?: string | null
          common_name?: string
          conspecific_notes?: string | null
          conspecific_sex_ratio_note?: string | null
          conspecific_strategy?: string
          fin_nipper?: boolean
          id?: string
          is_schooling?: boolean
          legal_in_australia?: boolean
          legal_note?: string | null
          legal_status?: string
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
      species_requests: {
        Row: {
          common_name: string
          created_at: string
          id: number
          note: string | null
        }
        Insert: {
          common_name: string
          created_at?: string
          id?: number
          note?: string | null
        }
        Update: {
          common_name?: string
          created_at?: string
          id?: number
          note?: string | null
        }
        Relationships: []
      }
      tank_filters: {
        Row: {
          biological_media_level: string
          filter_id: string
          filter_maturity: string
          position: number
          tank_id: string
        }
        Insert: {
          biological_media_level?: string
          filter_id: string
          filter_maturity?: string
          position?: number
          tank_id: string
        }
        Update: {
          biological_media_level?: string
          filter_id?: string
          filter_maturity?: string
          position?: number
          tank_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tank_filters_filter_id_fkey"
            columns: ["filter_id"]
            isOneToOne: false
            referencedRelation: "filters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tank_filters_tank_id_fkey"
            columns: ["tank_id"]
            isOneToOne: false
            referencedRelation: "tanks"
            referencedColumns: ["id"]
          },
        ]
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
      tank_invertebrates: {
        Row: {
          invertebrate_id: string
          quantity: number
          tank_id: string
        }
        Insert: {
          invertebrate_id: string
          quantity?: number
          tank_id: string
        }
        Update: {
          invertebrate_id?: string
          quantity?: number
          tank_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tank_invertebrates_invertebrate_id_fkey"
            columns: ["invertebrate_id"]
            isOneToOne: false
            referencedRelation: "invertebrates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tank_invertebrates_tank_id_fkey"
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
          ammonia_mg_l: number | null
          biological_media_level: string | null
          created_at: string
          cycle_method: string | null
          cycle_status: string | null
          filter_id: string | null
          filter_maturity: string | null
          has_co2: boolean
          has_heater: boolean
          has_light: boolean
          height_cm: number
          id: string
          length_cm: number
          maintenance_frequency: string
          name: string
          nitrate_mg_l: number | null
          nitrite_mg_l: number | null
          plant_density: string
          seeded_media: boolean | null
          session_id: string | null
          share_slug: string
          substrate: string
          tank_age_weeks: number | null
          tank_shape: string
          target_ph: number
          target_temp_c: number
          user_id: string | null
          water_tested_on: string | null
          width_cm: number
        }
        Insert: {
          ammonia_mg_l?: number | null
          biological_media_level?: string | null
          created_at?: string
          cycle_method?: string | null
          cycle_status?: string | null
          filter_id?: string | null
          filter_maturity?: string | null
          has_co2?: boolean
          has_heater?: boolean
          has_light?: boolean
          height_cm: number
          id?: string
          length_cm: number
          maintenance_frequency?: string
          name: string
          nitrate_mg_l?: number | null
          nitrite_mg_l?: number | null
          plant_density?: string
          seeded_media?: boolean | null
          session_id?: string | null
          share_slug?: string
          substrate?: string
          tank_age_weeks?: number | null
          tank_shape?: string
          target_ph?: number
          target_temp_c?: number
          user_id?: string | null
          water_tested_on?: string | null
          width_cm: number
        }
        Update: {
          ammonia_mg_l?: number | null
          biological_media_level?: string | null
          created_at?: string
          cycle_method?: string | null
          cycle_status?: string | null
          filter_id?: string | null
          filter_maturity?: string | null
          has_co2?: boolean
          has_heater?: boolean
          has_light?: boolean
          height_cm?: number
          id?: string
          length_cm?: number
          maintenance_frequency?: string
          name?: string
          nitrate_mg_l?: number | null
          nitrite_mg_l?: number | null
          plant_density?: string
          seeded_media?: boolean | null
          session_id?: string | null
          share_slug?: string
          substrate?: string
          tank_age_weeks?: number | null
          tank_shape?: string
          target_ph?: number
          target_temp_c?: number
          user_id?: string | null
          water_tested_on?: string | null
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
      tracked_tanks: {
        Row: {
          biological_media_level: string
          created_at: string
          cycle_method: string
          cycle_status: string
          filter_maturity: string
          id: string
          litres: number | null
          name: string
          notes: string | null
          seeded_media: boolean
          tank_age_weeks: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          biological_media_level?: string
          created_at?: string
          cycle_method?: string
          cycle_status?: string
          filter_maturity?: string
          id?: string
          litres?: number | null
          name: string
          notes?: string | null
          seeded_media?: boolean
          tank_age_weeks?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          biological_media_level?: string
          created_at?: string
          cycle_method?: string
          cycle_status?: string
          filter_maturity?: string
          id?: string
          litres?: number | null
          name?: string
          notes?: string | null
          seeded_media?: boolean
          tank_age_weeks?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      waitlist_signups: {
        Row: {
          created_at: string
          email: string
          source: string
        }
        Insert: {
          created_at?: string
          email: string
          source?: string
        }
        Update: {
          created_at?: string
          email?: string
          source?: string
        }
        Relationships: []
      }
      water_tests: {
        Row: {
          ammonia_mg_l: number | null
          created_at: string
          id: string
          nitrate_mg_l: number | null
          nitrite_mg_l: number | null
          note: string | null
          ph: number | null
          tank_id: string
          temp_c: number | null
          tested_on: string
          user_id: string
        }
        Insert: {
          ammonia_mg_l?: number | null
          created_at?: string
          id?: string
          nitrate_mg_l?: number | null
          nitrite_mg_l?: number | null
          note?: string | null
          ph?: number | null
          tank_id: string
          temp_c?: number | null
          tested_on?: string
          user_id: string
        }
        Update: {
          ammonia_mg_l?: number | null
          created_at?: string
          id?: string
          nitrate_mg_l?: number | null
          nitrite_mg_l?: number | null
          note?: string | null
          ph?: number | null
          tank_id?: string
          temp_c?: number | null
          tested_on?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "water_tests_tank_id_fkey"
            columns: ["tank_id"]
            isOneToOne: false
            referencedRelation: "tracked_tanks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      community_feed: {
        Row: {
          author_id: string | null
          body: string | null
          comment_count: number | null
          created_at: string | null
          edited_at: string | null
          flair: string | null
          hot_rank: number | null
          id: string | null
          link_url: string | null
          locked: boolean | null
          score: number | null
          status: string | null
          title: string | null
        }
        Insert: {
          author_id?: string | null
          body?: string | null
          comment_count?: number | null
          created_at?: string | null
          edited_at?: string | null
          flair?: string | null
          hot_rank?: never
          id?: string | null
          link_url?: string | null
          locked?: boolean | null
          score?: number | null
          status?: string | null
          title?: string | null
        }
        Update: {
          author_id?: string | null
          body?: string | null
          comment_count?: number | null
          created_at?: string | null
          edited_at?: string | null
          flair?: string | null
          hot_rank?: never
          id?: string | null
          link_url?: string | null
          locked?: boolean | null
          score?: number | null
          status?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "community_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      claim_guest_data: {
        Args: { p_guest_id: string; p_member_id: string }
        Returns: Json
      }
      community_can_upload: { Args: never; Returns: boolean }
      community_is_moderator: { Args: never; Returns: boolean }
      community_is_ready: { Args: never; Returns: boolean }
      community_write: {
        Args: { action: string; payload?: Json }
        Returns: string
      }
      community_write_internal: {
        Args: { action: string; payload?: Json }
        Returns: string
      }
      get_shared_tank: { Args: { p_slug: string }; Returns: Json }
      join_account_waitlist: { Args: { p_email: string }; Returns: undefined }
      record_score_event: {
        Args: { p_issue_codes: string[]; p_verdict: string }
        Returns: undefined
      }
      record_shop_outbound: {
        Args: { p_destination: string; p_shop_id: string }
        Returns: undefined
      }
      submit_contact_request: {
        Args: { p_email: string; p_message: string; p_topic: string }
        Returns: undefined
      }
      submit_species_request: {
        Args: { p_common_name: string; p_note: string }
        Returns: undefined
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
