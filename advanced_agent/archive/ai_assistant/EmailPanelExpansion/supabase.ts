import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server client (for API routes)
export const createServerSupabase = () => supabase;

// Types
export type Database = {
  public: {
    Tables: {
      contacts: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          company: string | null;
          job_title: string | null;
          source: string | null;
          verified: boolean;
          tags: string[];
          last_contacted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          company?: string | null;
          job_title?: string | null;
          source?: string | null;
          verified?: boolean;
          tags?: string[];
          last_contacted_at?: string | null;
          created_at?: string;
        };
      };
    };
  };
};
