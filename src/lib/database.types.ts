/**
 * Supabase DB types for 济和 DAO.
 * TODO: regenerate with `supabase gen types typescript` when DB is ready.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      cms_config: {
        Row: {
          id: string;
          key: string;
          value: Json;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["cms_config"]["Row"], "updated_at"> & {
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["cms_config"]["Insert"]>;
      };
      official_logs: {
        Row: {
          id: string;
          title: string;
          content: string;
          date: string;
          tags: string[] | null;
          cover_image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["official_logs"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["official_logs"]["Insert"]>;
      };
      user_profiles: {
        Row: {
          id: string;
          privy_user_id: string | null;
          wallet_address: string | null;
          fid: string | null;
          display_name: string | null;
          bio: string | null;
          avatar_url: string | null;
          credit_score: number;
          jihe_coin_balance: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["user_profiles"]["Row"], "id" | "created_at" | "updated_at" | "credit_score" | "jihe_coin_balance"> & {
          id?: string;
          credit_score?: number;
          jihe_coin_balance?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_profiles"]["Insert"]>;
      };
      jihe_coin_ledger: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          reason: string;
          reference_type: string | null;
          reference_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["jihe_coin_ledger"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["jihe_coin_ledger"]["Insert"]>;
      };
      user_badges: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          icon_url: string | null;
          description: string | null;
          issued_by: string | null;
          issued_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["user_badges"]["Row"], "id" | "issued_at"> & {
          id?: string;
          issued_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_badges"]["Insert"]>;
      };
      posts: {
        Row: {
          id: string;
          author_id: string;
          type: "project" | "task" | "product" | "course" | "stance";
          title: string;
          content: string;
          media_urls: string[] | null;
          tags: string[] | null;
          credit_weight: number;
          onchain_tx_hash: string | null;
          chain: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["posts"]["Row"], "id" | "created_at" | "updated_at" | "credit_weight"> & {
          id?: string;
          credit_weight?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["posts"]["Insert"]>;
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          author_id: string;
          content: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["comments"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["comments"]["Insert"]>;
      };
      likes: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["likes"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["likes"]["Insert"]>;
      };
      conversations: {
        Row: {
          id: string;
          last_message_preview: string | null;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["conversations"]["Row"], "id"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["conversations"]["Insert"]>;
      };
      conversation_participants: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
        };
        Insert: Omit<Database["public"]["Tables"]["conversation_participants"]["Row"], "id"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["conversation_participants"]["Insert"]>;
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          is_encrypted: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["messages"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
