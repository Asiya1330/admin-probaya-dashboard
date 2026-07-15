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
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      EmailCapture: {
        Row: {
          consentedToMarketing: boolean
          createdAt: string
          email: string
          id: string
          lastScanAt: string | null
          scansPerformed: number
          source: string
        }
        Insert: {
          consentedToMarketing?: boolean
          createdAt?: string
          email: string
          id: string
          lastScanAt?: string | null
          scansPerformed?: number
          source?: string
        }
        Update: {
          consentedToMarketing?: boolean
          createdAt?: string
          email?: string
          id?: string
          lastScanAt?: string | null
          scansPerformed?: number
          source?: string
        }
        Relationships: []
      }
      flagged_ingredients: {
        Row: {
          brief_reasoning: string | null
          classification: string | null
          confidence: string | null
          flagged_at: string
          id: string
          impact_score: string | null
          inci_name: string | null
          ingredient_name: string | null
          needs_human_review: boolean
          product_ids: string[] | null
          status: string
        }
        Insert: {
          brief_reasoning?: string | null
          classification?: string | null
          confidence?: string | null
          flagged_at?: string
          id?: string
          impact_score?: string | null
          inci_name?: string | null
          ingredient_name?: string | null
          needs_human_review?: boolean
          product_ids?: string[] | null
          status?: string
        }
        Update: {
          brief_reasoning?: string | null
          classification?: string | null
          confidence?: string | null
          flagged_at?: string
          id?: string
          impact_score?: string | null
          inci_name?: string | null
          ingredient_name?: string | null
          needs_human_review?: boolean
          product_ids?: string[] | null
          status?: string
        }
        Relationships: []
      }
      ingredients: {
        Row: {
          classification: string | null
          conflicting_evidence: string | null
          evidence_strength: string | null
          impact_score: string | null
          inci_name: string
          ingredient_id: string
          ingredient_name: string
          notes: string | null
          plain_english_summary: string | null
          pubmed_link: string | null
          study_title: string | null
          year_published: string | null
        }
        Insert: {
          classification?: string | null
          conflicting_evidence?: string | null
          evidence_strength?: string | null
          impact_score?: string | null
          inci_name: string
          ingredient_id?: string
          ingredient_name: string
          notes?: string | null
          plain_english_summary?: string | null
          pubmed_link?: string | null
          study_title?: string | null
          year_published?: string | null
        }
        Update: {
          classification?: string | null
          conflicting_evidence?: string | null
          evidence_strength?: string | null
          impact_score?: string | null
          inci_name?: string
          ingredient_id?: string
          ingredient_name?: string
          notes?: string | null
          plain_english_summary?: string | null
          pubmed_link?: string | null
          study_title?: string | null
          year_published?: string | null
        }
        Relationships: []
      }
      product_ingredients: {
        Row: {
          created_at: string | null
          id: string
          ingredient_id: string
          product_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          ingredient_id: string
          product_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          ingredient_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_submissions: {
        Row: {
          barcode: string
          brand: string
          category: string
          fragrance: string | null
          id: string
          image_url: string | null
          ingredients: string | null
          organic: boolean | null
          product_name: string
          retrieval_source: string | null
          review_notes: string | null
          reviewed_at: string | null
          scan_count: number
          status: string | null
          submitted_at: string | null
          submitter_role: string
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          barcode: string
          brand: string
          category: string
          fragrance?: string | null
          id?: string
          image_url?: string | null
          ingredients?: string | null
          organic?: boolean | null
          product_name: string
          retrieval_source?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          scan_count?: number
          status?: string | null
          submitted_at?: string | null
          submitter_role?: string
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          barcode?: string
          brand?: string
          category?: string
          fragrance?: string | null
          id?: string
          image_url?: string | null
          ingredients?: string | null
          organic?: boolean | null
          product_name?: string
          retrieval_source?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          scan_count?: number
          status?: string | null
          submitted_at?: string | null
          submitter_role?: string
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          absorbency: string | null
          antibacterial_agents: string | null
          barcode: string | null
          bleaching_method: string | null
          brand: string | null
          category: string
          createdAt: string
          fragrance_type: string | null
          gots_certified: string | null
          gyno_approved: string | null
          id: string
          image_url: string | null
          ingredients_list: string | null
          material_composition: string | null
          oeko_tex_certified: string | null
          ph_level: string | null
          preservatives: string | null
          product_name: string | null
          score: number | null
          size_count: string | null
          source_url: string | null
          synthetic_materials: string | null
          updatedAt: string
          usda_organic: string | null
          verified: boolean | null
        }
        Insert: {
          absorbency?: string | null
          antibacterial_agents?: string | null
          barcode?: string | null
          bleaching_method?: string | null
          brand?: string | null
          category: string
          createdAt?: string
          fragrance_type?: string | null
          gots_certified?: string | null
          gyno_approved?: string | null
          id?: string
          image_url?: string | null
          ingredients_list?: string | null
          material_composition?: string | null
          oeko_tex_certified?: string | null
          ph_level?: string | null
          preservatives?: string | null
          product_name?: string | null
          score?: number | null
          size_count?: string | null
          source_url?: string | null
          synthetic_materials?: string | null
          updatedAt?: string
          usda_organic?: string | null
          verified?: boolean | null
        }
        Update: {
          absorbency?: string | null
          antibacterial_agents?: string | null
          barcode?: string | null
          bleaching_method?: string | null
          brand?: string | null
          category?: string
          createdAt?: string
          fragrance_type?: string | null
          gots_certified?: string | null
          gyno_approved?: string | null
          id?: string
          image_url?: string | null
          ingredients_list?: string | null
          material_composition?: string | null
          oeko_tex_certified?: string | null
          ph_level?: string | null
          preservatives?: string | null
          product_name?: string | null
          score?: number | null
          size_count?: string | null
          source_url?: string | null
          synthetic_materials?: string | null
          updatedAt?: string
          usda_organic?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          role: string | null
          address: string | null
          phone_number: string | null
        }
        Insert: {
          id: string
          role?: string | null
          address?: string | null
          phone_number?: string | null
        }
        Update: {
          id?: string
          role?: string | null
          address?: string | null
          phone_number?: string | null
        }
        Relationships: []
      }
      saved_products: {
        Row: {
          id: string
          product_id: string
          saved_at: string
          user_id: string
        }
        Insert: {
          id?: string
          product_id: string
          saved_at?: string
          user_id: string
        }
        Update: {
          id?: string
          product_id?: string
          saved_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      SavedProduct: {
        Row: {
          id: string
          productId: string
          savedAt: string
          userId: string
        }
        Insert: {
          id?: string
          productId: string
          savedAt?: string
          userId: string
        }
        Update: {
          id?: string
          productId?: string
          savedAt?: string
          userId?: string
        }
        Relationships: []
      }
      scoring_rules: {
        Row: {
          color_code: string | null
          created_at: string | null
          id: string
          max_score: number
          min_score: number
          rating_label: string
        }
        Insert: {
          color_code?: string | null
          created_at?: string | null
          id?: string
          max_score: number
          min_score: number
          rating_label: string
        }
        Update: {
          color_code?: string | null
          created_at?: string | null
          id?: string
          max_score?: number
          min_score?: number
          rating_label?: string
        }
        Relationships: []
      }
      studies: {
        Row: {
          author: string | null
          created_at: string | null
          id: string
          impact_conclusion: string | null
          ingredient_id: string
          ingredient_name: string
          journal: string | null
          key_finding: string | null
          pubmed_link: string | null
          study_title: string
          year_published: number | null
        }
        Insert: {
          author?: string | null
          created_at?: string | null
          id?: string
          impact_conclusion?: string | null
          ingredient_id: string
          ingredient_name: string
          journal?: string | null
          key_finding?: string | null
          pubmed_link?: string | null
          study_title: string
          year_published?: number | null
        }
        Update: {
          author?: string | null
          created_at?: string | null
          id?: string
          impact_conclusion?: string | null
          ingredient_id?: string
          ingredient_name?: string
          journal?: string | null
          key_finding?: string | null
          pubmed_link?: string | null
          study_title?: string
          year_published?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      is_admin: { Args: never; Returns: boolean }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];
export type UserRole = "admin" | "user";

export type UserWithProfile = {
  id: string;
  email: string;
  address: string;
  phone_number: string;
  created_at: string;
  role: UserRole;
};
