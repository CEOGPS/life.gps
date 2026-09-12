import { Heart, Plus, Search, Star, Gift, Phone, Mail, MapPin, Camera } from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout.tsx";

export default function FamilyPanel() {
  return (
    <PanelLayout
      title="Family & Friends"
      subtitle="Deep profiles for the people who matter most"
      icon={<Heart size={18} />}
      actions={
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all">
          <Plus size={12} /> ADD PERSON
        </button>
      }
    >
      <div className="h-full flex gap-4">
        <div className="w-56 shrink-0 flex flex-col gap-3">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/20" />
            <input placeholder="Search people..." className="w-full h-8 pl-8 text-xs bg-white/4 border border-white/8 rounded-lg text-white/60 placeholder:text-white/20 focus:outline-none focus:border-primary/40" />
          </div>
          <div className="glass rounded-xl border border-white/8 p-2 flex-1 overflow-y-auto">
            <div className="text-[9px] text-white/20 font-display tracking-widest px-2 mb-2">PEOPLE</div>
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Heart size={20} className="mx-auto text-white/10 mb-2" />
                <div className="text-xs text-white/20">No profiles yet</div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 glass rounded-xl border border-white/8 flex items-center justify-center">
          <div className="text-center max-w-sm">
            <div className="w-20 h-20 rounded-full glass-crimson flex items-center justify-center mx-auto mb-4 glow-crimson">
              <Camera size={28} className="text-primary/60" />
            </div>
            <div className="text-sm text-white/30 mb-2">Select a profile to view</div>
            <div className="text-[10px] text-white/15 leading-relaxed">
              Fields: Photo, Name, Contact info, All socials, Birthday, Fav food, Fav movie, Likes, Dislikes, Milestones, Notes & more
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { icon: <Phone size={12} />, label: "Call" },
                { icon: <Mail size={12} />, label: "Email" },
                { icon: <Gift size={12} />, label: "Gifts" },
                { icon: <MapPin size={12} />, label: "Location" },
                { icon: <Star size={12} />, label: "Milestones" },
                { icon: <Heart size={12} />, label: "Memories" },
              ].map((a) => (
                <div key={a.label} className="flex flex-col items-center gap-1 p-2 glass rounded border border-white/5 text-white/20">
                  {a.icon}<span className="text-[9px]">{a.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PanelLayout>
  );
}
