const db = globalThis.__B44_DB__ || {
  auth: { isAuthenticated: async () => false, me: async () => null },
  entities: new Proxy(
    {},
    {
      get: () => ({
        filter: async () => [],
        get: async () => null,
        create: async () => ({}),
        update: async () => ({}),
        delete: async () => ({}),
      }),
    },
  ),
  integrations: { Core: { UploadFile: async () => ({ file_url: "" }) } },
};

import { useQuery } from "@tanstack/react-query";

const MEMORY_LIMIT = 5;

export function useCreativeMemory(projectId = null) {
  const { data: recentCreations = [], isLoading } = useQuery({
    queryKey: ["creations-memory", projectId],
    queryFn: () =>
      projectId
        ? db.entities.Creation.filter(
            { project_id: projectId },
            "-created_date",
            MEMORY_LIMIT,
          )
        : db.entities.Creation.list("-created_date", MEMORY_LIMIT),
    initialData: [],
  });

  const buildMemoryContext = () => {
    if (recentCreations.length === 0) return "";

    const summaries = recentCreations.map((c, i) => {
      const parts = [`Creation ${i + 1}: Type="${c.type}"`];
      if (c.prompt) parts.push(`Prompt="${c.prompt}"`);
      if (c.style_notes) parts.push(`Style="${c.style_notes}"`);
      return parts.join(", ");
    });

    return `CREATIVE MEMORY — Recent creations for style continuity:\n${summaries.join("\n")}\n\nMaintain visual consistency with these recent works. Use similar color palettes, artistic styles, and mood unless explicitly told otherwise.`;
  };

  const getRecentImageUrls = () => {
    return recentCreations
      .filter((c) => c.output_type === "image" && c.output_url)
      .slice(0, 3)
      .map((c) => c.output_url);
  };

  return {
    recentCreations,
    isLoading,
    buildMemoryContext,
    getRecentImageUrls,
  };
}
