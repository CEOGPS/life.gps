import { supabase } from "@/lib/supabaseClient.ts";

/**
 * Drop-in replacement for the Base44 `db` object Veriton's pages were built against.
 * Same call shape (entities.X.list/get/create/update/delete, integrations.Core.UploadFile)
 * so the ported page code needed minimal changes.
 *
 * Backing tables (see supabase_migrations_veriton.sql): veriton_track, veriton_playlist,
 * veriton_videoproject, veriton_voiceprofile. Storage bucket: veriton-uploads.
 */

const TABLE_MAP: Record<string, string> = {
  Track: "veriton_track",
  Playlist: "veriton_playlist",
  VideoProject: "veriton_videoproject",
  VoiceProfile: "veriton_voiceprofile",
};

function makeEntity(entityName: string) {
  const table = TABLE_MAP[entityName];
  if (!table) {
    console.warn(
      `[veritonDb] Unknown entity "${entityName}" — no backing table configured`,
    );
  }

  return {
    async list(sort?: string, limit?: number) {
      let query = supabase.from(table).select("*");
      if (sort) {
        const desc = sort.startsWith("-");
        const col = desc ? sort.slice(1) : sort;
        // created_date -> created_at (Base44 naming -> Postgres naming)
        const column = col === "created_date" ? "created_at" : col;
        query = query.order(column, { ascending: !desc });
      }
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) {
        console.error(`[veritonDb] ${entityName}.list failed:`, error.message);
        return [];
      }
      return data ?? [];
    },

    async get(id: string) {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) {
        console.error(`[veritonDb] ${entityName}.get failed:`, error.message);
        return null;
      }
      return data;
    },

    async filter(query: Record<string, unknown>) {
      let q = supabase.from(table).select("*");
      for (const [key, value] of Object.entries(query)) {
        q = q.eq(key, value as string | number | boolean);
      }
      const { data, error } = await q;
      if (error) {
        console.error(
          `[veritonDb] ${entityName}.filter failed:`,
          error.message,
        );
        return [];
      }
      return data ?? [];
    },

    async create(fields: Record<string, unknown>) {
      const { data, error } = await supabase
        .from(table)
        .insert(fields)
        .select()
        .maybeSingle();
      if (error) {
        console.error(
          `[veritonDb] ${entityName}.create failed:`,
          error.message,
        );
        throw error;
      }
      return data;
    },

    async update(id: string, fields: Record<string, unknown>) {
      const { data, error } = await supabase
        .from(table)
        .update(fields)
        .eq("id", id)
        .select()
        .maybeSingle();
      if (error) {
        console.error(
          `[veritonDb] ${entityName}.update failed:`,
          error.message,
        );
        throw error;
      }
      return data;
    },

    async delete(id: string) {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) {
        console.error(
          `[veritonDb] ${entityName}.delete failed:`,
          error.message,
        );
        throw error;
      }
      return true;
    },
  };
}

export interface VeritonEntity {
  list<T = Record<string, unknown>>(sort?: string, limit?: number): Promise<T[]>;
  get<T = Record<string, unknown>>(id: string): Promise<T | null>;
  filter<T = Record<string, unknown>>(query: Record<string, unknown>): Promise<T[]>;
  create<T = Record<string, unknown>>(fields: Record<string, unknown>): Promise<T | null>;
  update<T = Record<string, unknown>>(id: string, fields: Record<string, unknown>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}

export type VeritonEntityName = "Track" | "Playlist" | "VideoProject" | "VoiceProfile";

export type VeritonEntities = Record<VeritonEntityName, VeritonEntity>;

export interface VeritonDb {
  entities: VeritonEntities;
  integrations: {
    Core: {
      UploadFile(args: { file: File }): Promise<{ file_url: string }>;
      InvokeLLM(): Promise<never>;
    };
  };
}

export const db: VeritonDb = {
  entities: new Proxy(
    {},
    {
      get: (_target, prop: string) => makeEntity(prop) as never,
    },
  ) as VeritonDb["entities"],
  integrations: {
    Core: {
      async UploadFile({ file }: { file: File }) {
        const path = `${Date.now()}-${file.name}`;
        const { error } = await supabase.storage
          .from("veriton-uploads")
          .upload(path, file);
        if (error) {
          console.error("[veritonDb] UploadFile failed:", error.message);
          return { file_url: "" };
        }
        const { data } = supabase.storage
          .from("veriton-uploads")
          .getPublicUrl(path);
        return { file_url: data.publicUrl };
      },
      async InvokeLLM() {
        // Generation backend not wired yet (Base44's was proprietary) — stubbed per plan.
        console.warn(
          "[veritonDb] InvokeLLM called — no generation backend configured yet.",
        );
        throw new Error("Generation backend not configured yet.");
      },
    },
  },
};

export default db;
