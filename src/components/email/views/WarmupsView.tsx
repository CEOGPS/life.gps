"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Calendar,
  Target,
} from "lucide-react";

export default function WarmupsView() {
  const [dailyTarget, setDailyTarget] = useState(50);
  const [durationDays, setDurationDays] = useState(30);

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-semibold">Email Warm-up Dashboard</h2>
          <p className="text-zinc-500">
            Gradually build sender reputation for better deliverability
          </p>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-700">
          <Play className="mr-2 h-4 w-4" /> Start New Warm-up
        </Button>
      </div>

      {/* Active Warm-ups */}
      <div className="grid gap-6">
        <Card className="bg-zinc-950 border-zinc-800 p-8">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-400 rounded-2xl flex items-center justify-center text-2xl font-bold">
                G
              </div>
              <div>
                <p className="font-semibold text-lg">ceo@yourcompany.com</p>
                <p className="text-zinc-500 text-sm">Day 14 • 30 day plan</p>
              </div>
            </div>
            <Badge className="bg-emerald-500/10 text-emerald-400 text-lg px-4 py-1">
              98% Health
            </Badge>
          </div>

          <div className="mt-8 space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Daily Sending Limit</span>
              <span className="font-medium">
                47 / {Math.min(65, dailyTarget)} emails
              </span>
            </div>
            <Progress value={72} className="h-2 bg-zinc-800" />

            <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-zinc-800">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-400" />
                <div>
                  <p className="text-xs text-zinc-500">Reputation Trend</p>
                  <p className="text-sm font-medium">+12% this week</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-blue-400" />
                <div>
                  <p className="text-xs text-zinc-500">Days Remaining</p>
                  <p className="text-sm font-medium">16 days</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Schedule Builder */}
      <Card className="bg-zinc-950 border-zinc-800 p-8">
        <h3 className="font-medium text-lg mb-6 flex items-center gap-2">
          <Target size={20} className="text-violet-400" />
          Warm-up Schedule Builder
        </h3>

        <div className="space-y-6">
          <div>
            <Label className="text-zinc-400 mb-2 block">
              Daily Target Volume
            </Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[dailyTarget]}
                onValueChange={(val) => setDailyTarget(val[0])}
                max={200}
                step={5}
                className="flex-1"
              />
              <Input
                type="number"
                value={dailyTarget}
                onChange={(e) => setDailyTarget(Number(e.target.value))}
                className="w-20 bg-zinc-900 border-zinc-700 text-center"
              />
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              Recommended: start with 20-30 emails/day
            </p>
          </div>

          <div>
            <Label className="text-zinc-400 mb-2 block">Duration (Days)</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[durationDays]}
                onValueChange={(val) => setDurationDays(val[0])}
                max={60}
                step={5}
                className="flex-1"
              />
              <Input
                type="number"
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="w-20 bg-zinc-900 border-zinc-700 text-center"
              />
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              30 days is standard for best results
            </p>
          </div>

          {/* Projected Growth Curve */}
          <div className="mt-8 pt-6 border-t border-zinc-800">
            <p className="text-sm font-medium mb-4">
              Projected Sending Capacity
            </p>
            <div className="h-32 bg-zinc-900 rounded-xl flex items-end gap-1 p-4">
              {[10, 15, 22, 30, 38, 45, 52, 60, 65, 70, 72, 75].map(
                (val, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-violet-500/30 hover:bg-violet-500/50 transition-all rounded-t"
                    style={{ height: `${(val / 75) * 100}%` }}
                  />
                ),
              )}
            </div>
            <div className="flex justify-between text-xs text-zinc-500 mt-2">
              <span>Week 1</span>
              <span>Week 2</span>
              <span>Week 3</span>
              <span>Week 4</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Tips Card */}
      <Card className="bg-zinc-950 border-zinc-800 p-6">
        <div className="flex gap-3">
          <AlertCircle size={20} className="text-amber-400" />
          <div>
            <p className="font-medium text-sm">Warm-up Best Practices</p>
            <ul className="text-xs text-zinc-500 mt-2 space-y-1">
              <li>• Don't skip days - consistency is key</li>
              <li>• Gradually increase volume by 10-15% weekly</li>
              <li>• Monitor bounce rates and spam complaints</li>
              <li>• Use engagement tracking to verify health</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
