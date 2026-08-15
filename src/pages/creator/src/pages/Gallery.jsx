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
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Image,
  Video,
  Sparkles,
  Music,
  Film,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const typeConfig = {
  text_to_image: {
    icon: Image,
    label: "Text → Image",
    color: "bg-primary/10 text-primary",
  },
  image_edit: {
    icon: Sparkles,
    label: "Image Edit",
    color: "bg-accent/10 text-accent",
  },
  image_to_video: {
    icon: Video,
    label: "Image → Video",
    color: "bg-chart-3/10 text-chart-3",
  },
  music_video: {
    icon: Music,
    label: "Music Video",
    color: "bg-chart-4/10 text-chart-4",
  },
  storyboard_to_video: {
    icon: Film,
    label: "Storyboard → Video",
    color: "bg-chart-5/10 text-chart-5",
  },
};

export default function Gallery() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: creations = [], isLoading } = useQuery({
    queryKey: ["all-creations"],
    queryFn: () => db.entities.Creation.list("-created_date", 50),
    initialData: [],
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => db.entities.Creation.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-creations"] });
      queryClient.invalidateQueries({ queryKey: ["creations-memory"] });
    },
  });

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-heading text-2xl font-bold">Gallery</h1>
            <p className="text-sm text-muted-foreground">
              {creations.length} creation{creations.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-64 rounded-2xl bg-card animate-pulse border border-border/30"
              />
            ))}
          </div>
        ) : creations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Image className="w-12 h-12 text-muted-foreground/40" />
            <p className="text-muted-foreground">
              No creations yet. Start making something!
            </p>
            <Button onClick={() => navigate("/")} className="gap-2">
              <Sparkles className="w-4 h-4" /> Go to Studio
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence>
              {creations.map((creation, i) => {
                const config =
                  typeConfig[creation.type] || typeConfig.text_to_image;
                const Icon = config.icon;
                return (
                  <motion.div
                    key={creation.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: i * 0.03 }}
                    className="group rounded-2xl overflow-hidden border border-border/50 bg-card hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5"
                  >
                    <div className="relative h-48 bg-black/20">
                      {creation.output_type === "image" ? (
                        <img
                          src={creation.output_url}
                          alt={creation.title || "Creation"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video
                          src={creation.output_url}
                          className="w-full h-full object-cover"
                          muted
                          onMouseEnter={(e) => e.target.play()}
                          onMouseLeave={(e) => {
                            e.target.pause();
                            e.target.currentTime = 0;
                          }}
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a
                          href={creation.output_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center hover:bg-white/30 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4 text-white" />
                        </a>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="w-8 h-8 rounded-lg bg-red-500/20 backdrop-blur flex items-center justify-center hover:bg-red-500/40 transition-colors">
                              <Trash2 className="w-4 h-4 text-red-300" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete creation?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove it from your gallery and
                                creative memory.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  deleteMutation.mutate(creation.id)
                                }
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-heading font-semibold text-sm truncate pr-2">
                          {creation.title || "Untitled"}
                        </h3>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] ${config.color} border-none flex-shrink-0`}
                        >
                          <Icon className="w-3 h-3 mr-1" />
                          {config.label}
                        </Badge>
                      </div>
                      {creation.prompt && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {creation.prompt}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground/60">
                        {creation.created_date &&
                          format(
                            new Date(creation.created_date),
                            "MMM d, yyyy · h:mm a",
                          )}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
