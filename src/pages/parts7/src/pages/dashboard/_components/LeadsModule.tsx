import { UserPlus, Filter, MoreVertical } from "lucide-react";

export default function LeadsModule() {
  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Filters */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-6 px-2 rounded bg-white/4 border border-white/6 flex items-center gap-1.5">
          <Filter size={9} className="text-white/20" />
          <span className="text-[10px] text-white/20">Filter leads...</span>
        </div>
        <button className="flex items-center gap-1 text-[10px] text-primary/70 hover:text-primary font-display tracking-wider">
          <UserPlus size={11} /> ADD
        </button>
      </div>

      {/* Empty leads area */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full glass-crimson flex items-center justify-center mx-auto mb-3">
            <UserPlus size={16} className="text-primary/60" />
          </div>
          <div className="text-xs text-white/30">No leads yet</div>
          <div className="text-[10px] text-white/15 mt-1">Connect lead sources to populate</div>
        </div>
      </div>

      {/* Source labels */}
      <div className="flex gap-1.5 flex-wrap border-t border-white/5 pt-2">
        {["Facebook", "Google", "Boberdoo", "Jangl", "Manual"].map((s) => (
          <span key={s} className="text-[9px] px-2 py-0.5 rounded-full border border-white/8 text-white/25">
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}
