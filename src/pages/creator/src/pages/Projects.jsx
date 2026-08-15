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

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Plus, FolderOpen, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProjectCard from "@/components/projects/ProjectCard";
import CreateProjectDialog from "@/components/projects/CreateProjectDialog";

export default function Projects() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => db.entities.Project.list("-created_date", 100),
    initialData: [],
  });

  const { data: creations = [] } = useQuery({
    queryKey: ["all-creations"],
    queryFn: () => db.entities.Creation.list("-created_date", 500),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => db.entities.Project.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => db.entities.Project.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });

  const handleDelete = (project) => {
    if (
      window.confirm(
        `Delete project "${project.name}"? Creations will remain but become ungrouped.`,
      )
    ) {
      deleteMutation.mutate(project.id);
    }
  };

  const getProjectInfo = (projectId) => {
    const projectCreations = creations.filter(
      (c) => c.project_id === projectId,
    );
    const thumbnails = projectCreations
      .filter((c) => c.output_type === "image" && c.output_url)
      .slice(0, 4)
      .map((c) => c.output_url);
    return { count: projectCreations.length, thumbnails };
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h1 className="font-heading text-xl font-bold">Projects</h1>
                <p className="text-sm text-muted-foreground">
                  Group creations to keep style consistent
                </p>
              </div>
            </div>
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="w-4 h-4" /> New Project
          </Button>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-secondary/40 flex items-center justify-center mx-auto">
              <FolderOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="font-heading text-lg font-semibold">
              No projects yet
            </h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Create a project to group related images and videos, then generate
              inside it to lock in a consistent style.
            </p>
            <Button onClick={() => setShowCreate(true)} className="gap-2 mt-2">
              <Plus className="w-4 h-4" /> Create your first project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p, i) => {
              const info = getProjectInfo(p.id);
              return (
                <ProjectCard
                  key={p.id}
                  project={p}
                  index={i}
                  creationCount={info.count}
                  thumbnails={info.thumbnails}
                  onDelete={handleDelete}
                />
              );
            })}
          </div>
        )}
      </div>

      <CreateProjectDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreate={createMutation.mutateAsync}
      />
    </div>
  );
}
