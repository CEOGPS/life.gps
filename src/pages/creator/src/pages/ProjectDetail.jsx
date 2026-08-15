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

import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  ArrowLeft,
  Trash2,
  Sparkles,
  Video,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: project } = useQuery({
    queryKey: ["project", id],
    queryFn: () => db.entities.Project.get(id),
    enabled: !!id,
  });

  const { data: creations = [], isLoading } = useQuery({
    queryKey: ["project-creations", id],
    queryFn: () =>
      db.entities.Creation.filter({ project_id: id }, "-created_date", 200),
    initialData: [],
  });

  const deleteMutation = useMutation({
    mutationFn: () => db.entities.Project.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      navigate("/projects");
    },
  });

  const handleDelete = () => {
    if (
      window.confirm(
        `Delete project "${project?.name}"? Creations will remain but become ungrouped.`,
      )
    ) {
      deleteMutation.mutate();
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/projects")}
              className="rounded-full flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="font-heading text-xl font-bold truncate">
                {project?.name || "Project"}
              </h1>
              {project?.description && (
                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                  {project.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              onClick={() => navigate(`/?project=${id}`)}
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" /> Generate Here
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-xl bg-secondary/40 animate-pulse"
              />
            ))}
          </div>
        ) : creations.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <p className="text-sm text-muted-foreground">
              No creations in this project yet.
            </p>
            <Button
              onClick={() => navigate(`/?project=${id}`)}
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" /> Generate your first creation
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {creations.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                className="group relative aspect-square rounded-xl overflow-hidden border border-border/40 bg-secondary/30"
              >
                {c.output_type === "image" ? (
                  <img
                    src={c.output_url}
                    alt={c.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    src={c.output_url}
                    className="w-full h-full object-cover"
                    muted
                    loop
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                  <p className="text-xs text-white/90 line-clamp-2">
                    {c.title || c.prompt}
                  </p>
                </div>
                <div className="absolute top-2 right-2">
                  {c.output_type === "video" ? (
                    <Video className="w-3.5 h-3.5 text-white/80" />
                  ) : (
                    <ImageIcon className="w-3.5 h-3.5 text-white/80" />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
