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
      active_gates: {
        Row: {
          created_at: string
          current_depth: number
          current_room: number
          expires_at: string
          gate_rank: string
          gate_type: string
          hunter_id: string
          id: string
          rooms_per_depth: number[]
          total_depth: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_depth?: number
          current_room?: number
          expires_at: string
          gate_rank: string
          gate_type: string
          hunter_id: string
          id?: string
          rooms_per_depth: number[]
          total_depth: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_depth?: number
          current_room?: number
          expires_at?: string
          gate_rank?: string
          gate_type?: string
          hunter_id?: string
          id?: string
          rooms_per_depth?: number[]
          total_depth?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "active_gates_hunter_id_fkey"
            columns: ["hunter_id"]
            isOneToOne: true
            referencedRelation: "hunters"
            referencedColumns: ["id"]
          },
        ]
      }
      currency_transactions: {
        Row: {
          amount_change: number
          created_at: string
          currency_type: Database["public"]["Enums"]["currency_enum"]
          hunter_id: string
          id: string
          new_balance: number
          source: string
          source_details: Json | null
          transaction_time: string
        }
        Insert: {
          amount_change: number
          created_at?: string
          currency_type: Database["public"]["Enums"]["currency_enum"]
          hunter_id: string
          id?: string
          new_balance: number
          source: string
          source_details?: Json | null
          transaction_time?: string
        }
        Update: {
          amount_change?: number
          created_at?: string
          currency_type?: Database["public"]["Enums"]["currency_enum"]
          hunter_id?: string
          id?: string
          new_balance?: number
          source?: string
          source_details?: Json | null
          transaction_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "currency_transactions_hunter_id_fkey"
            columns: ["hunter_id"]
            isOneToOne: false
            referencedRelation: "hunters"
            referencedColumns: ["id"]
          },
        ]
      }
      hunter_inventory_items: {
        Row: {
          created_at: string
          equipped_slot: string | null
          hunter_id: string
          instance_id: string
          item_id: string
          quantity: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          equipped_slot?: string | null
          hunter_id: string
          instance_id?: string
          item_id: string
          quantity?: number
          updated_at: string
        }
        Update: {
          created_at?: string
          equipped_slot?: string | null
          hunter_id?: string
          instance_id?: string
          item_id?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hunter_inventory_items_hunter_id_fkey"
            columns: ["hunter_id"]
            isOneToOne: false
            referencedRelation: "hunters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hunter_inventory_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      hunters: {
        Row: {
          agility: number
          class: string
          created_at: string
          diamonds: number
          equipped_accessory1: string | null
          equipped_accessory2: string | null
          equipped_chest: string | null
          equipped_feet: string | null
          equipped_hands: string | null
          equipped_head: string | null
          equipped_legs: string | null
          equipped_mainhand: string | null
          equipped_offhand: string | null
          equipped_skills: string[] | null
          experience: number
          gold: number
          id: string
          intelligence: number
          level: number
          name: string
          next_level_experience: number
          perception: number
          rank: string
          skill_points: number
          stat_points: number
          strength: number
          unlocked_skills: string[] | null
          updated_at: string | null
          user_id: string
          vitality: number
        }
        Insert: {
          agility?: number
          class: string
          created_at?: string
          diamonds?: number
          equipped_accessory1?: string | null
          equipped_accessory2?: string | null
          equipped_chest?: string | null
          equipped_feet?: string | null
          equipped_hands?: string | null
          equipped_head?: string | null
          equipped_legs?: string | null
          equipped_mainhand?: string | null
          equipped_offhand?: string | null
          equipped_skills?: string[] | null
          experience?: number
          gold?: number
          id?: string
          intelligence?: number
          level?: number
          name: string
          next_level_experience?: number
          perception?: number
          rank?: string
          skill_points?: number
          stat_points?: number
          strength?: number
          unlocked_skills?: string[] | null
          updated_at?: string | null
          user_id: string
          vitality?: number
        }
        Update: {
          agility?: number
          class?: string
          created_at?: string
          diamonds?: number
          equipped_accessory1?: string | null
          equipped_accessory2?: string | null
          equipped_chest?: string | null
          equipped_feet?: string | null
          equipped_hands?: string | null
          equipped_head?: string | null
          equipped_legs?: string | null
          equipped_mainhand?: string | null
          equipped_offhand?: string | null
          equipped_skills?: string[] | null
          experience?: number
          gold?: number
          id?: string
          intelligence?: number
          level?: number
          name?: string
          next_level_experience?: number
          perception?: number
          rank?: string
          skill_points?: number
          stat_points?: number
          strength?: number
          unlocked_skills?: string[] | null
          updated_at?: string | null
          user_id?: string
          vitality?: number
        }
        Relationships: [
          {
            foreignKeyName: "hunters_equipped_accessory1_fkey"
            columns: ["equipped_accessory1"]
            isOneToOne: false
            referencedRelation: "hunter_inventory_items"
            referencedColumns: ["instance_id"]
          },
          {
            foreignKeyName: "hunters_equipped_accessory2_fkey"
            columns: ["equipped_accessory2"]
            isOneToOne: false
            referencedRelation: "hunter_inventory_items"
            referencedColumns: ["instance_id"]
          },
          {
            foreignKeyName: "hunters_equipped_chest_fkey"
            columns: ["equipped_chest"]
            isOneToOne: false
            referencedRelation: "hunter_inventory_items"
            referencedColumns: ["instance_id"]
          },
          {
            foreignKeyName: "hunters_equipped_feet_fkey"
            columns: ["equipped_feet"]
            isOneToOne: false
            referencedRelation: "hunter_inventory_items"
            referencedColumns: ["instance_id"]
          },
          {
            foreignKeyName: "hunters_equipped_hands_fkey"
            columns: ["equipped_hands"]
            isOneToOne: false
            referencedRelation: "hunter_inventory_items"
            referencedColumns: ["instance_id"]
          },
          {
            foreignKeyName: "hunters_equipped_head_fkey"
            columns: ["equipped_head"]
            isOneToOne: false
            referencedRelation: "hunter_inventory_items"
            referencedColumns: ["instance_id"]
          },
          {
            foreignKeyName: "hunters_equipped_legs_fkey"
            columns: ["equipped_legs"]
            isOneToOne: false
            referencedRelation: "hunter_inventory_items"
            referencedColumns: ["instance_id"]
          },
          {
            foreignKeyName: "hunters_equipped_mainhand_fkey"
            columns: ["equipped_mainhand"]
            isOneToOne: false
            referencedRelation: "hunter_inventory_items"
            referencedColumns: ["instance_id"]
          },
          {
            foreignKeyName: "hunters_equipped_offhand_fkey"
            columns: ["equipped_offhand"]
            isOneToOne: false
            referencedRelation: "hunter_inventory_items"
            referencedColumns: ["instance_id"]
          },
        ]
      }
      items: {
        Row: {
          class_requirement: string[] | null
          created_at: string
          description: string | null
          diamond_cost: number | null
          effects: Json | null
          gold_cost: number | null
          icon: string | null
          id: string
          is_event_item: boolean
          is_purchasable: boolean
          item_type: string
          level_requirement: number
          max_stack: number
          name: string
          rarity: string
          sell_price: number | null
          slot: string | null
          stackable: boolean
          stats: Json | null
          updated_at: string
        }
        Insert: {
          class_requirement?: string[] | null
          created_at?: string
          description?: string | null
          diamond_cost?: number | null
          effects?: Json | null
          gold_cost?: number | null
          icon?: string | null
          id: string
          is_event_item?: boolean
          is_purchasable?: boolean
          item_type: string
          level_requirement?: number
          max_stack?: number
          name: string
          rarity: string
          sell_price?: number | null
          slot?: string | null
          stackable?: boolean
          stats?: Json | null
          updated_at: string
        }
        Update: {
          class_requirement?: string[] | null
          created_at?: string
          description?: string | null
          diamond_cost?: number | null
          effects?: Json | null
          gold_cost?: number | null
          icon?: string | null
          id?: string
          is_event_item?: boolean
          is_purchasable?: boolean
          item_type?: string
          level_requirement?: number
          max_stack?: number
          name?: string
          rarity?: string
          sell_price?: number | null
          slot?: string | null
          stackable?: boolean
          stats?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          auth_id: string | null
          country: string | null
          created_at: string
          email: string
          id: string
          username: string
        }
        Insert: {
          auth_id?: string | null
          country?: string | null
          created_at?: string
          email: string
          id?: string
          username: string
        }
        Update: {
          auth_id?: string | null
          country?: string | null
          created_at?: string
          email?: string
          id?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      adjust_hunter_diamonds: {
        Args: { p_hunter_id: string; p_user_id: string; p_amount: number }
        Returns: Json
      }
      adjust_hunter_gold: {
        Args: { p_hunter_id: string; p_user_id: string; p_amount: number }
        Returns: Json
      }
      allocate_stat_point: {
        Args: { hunter_id_in: string; stat_name_in: string; user_id_in: string }
        Returns: number
      }
      allocate_stats_bulk: {
        Args: {
          hunter_id_param: string
          user_id_param: string
          allocations_param: Json
          points_to_spend_param: number
        }
        Returns: Json
      }
      purchase_item: {
        Args: {
          p_hunter_id: string
          p_item_id: string
          p_user_id: string
          p_quantity?: number
        }
        Returns: Json
      }
    }
    Enums: {
      currency_enum: "gold" | "diamonds"
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
    Enums: {
      currency_enum: ["gold", "diamonds"],
    },
  },
} as const
