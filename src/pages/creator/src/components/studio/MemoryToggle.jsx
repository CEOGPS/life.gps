import React from "react";
import { Brain } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function MemoryToggle({ enabled, onChange, memoryCount = 0 }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-secondary/40 border border-border/30">
      <div className="flex items-center gap-3">
        <Brain
          className={`w-4 h-4 ${enabled ? "text-primary" : "text-muted-foreground"}`}
        />
        <div>
          <Label className="text-sm font-medium cursor-pointer">
            Creative Memory
          </Label>
          <p className="text-xs text-muted-foreground">
            {memoryCount > 0
              ? `${memoryCount} recent creation${memoryCount > 1 ? "s" : ""} influencing style`
              : "No memory yet"}
          </p>
        </div>
      </div>
      <Switch checked={enabled} onCheckedChange={onChange} />
    </div>
  );
}
