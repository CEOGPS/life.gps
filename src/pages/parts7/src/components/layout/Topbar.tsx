import { useRef, useState } from "react";
import { Bell, Search, ChevronDown, User, Settings, LogOut, Edit3, Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const PROFILE_FIELDS = [
{ key: "name", label: "Name", placeholder: "Your full name" },
{ key: "jobTitle", label: "Job Title", placeholder: "e.g. CEO, Founder" },
{ key: "company", label: "Company", placeholder: "Company name" },
{ key: "email", label: "Email", placeholder: "you@example.com" },
{ key: "phone", label: "Phone", placeholder: "+1 (555) 000-0000" },
{ key: "address", label: "Address", placeholder: "City, State" },
{ key: "website", label: "Website", placeholder: "https://yoursite.com" },
{ key: "birthday", label: "Birthday", placeholder: "MM/DD/YYYY" },
{ key: "yearStarted", label: "Year Started", placeholder: "2020" }];


type ProfileData = Record<string, string>;

export default function Topbar() {
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({});

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoSrc(URL.createObjectURL(file));
  };

  return (
    <>
      <header
        className="h-14 flex items-center px-4 gap-4 border-b shrink-0 relative z-30"
        style={{ background: "oklch(0.03 0 0 / 95%)", borderColor: "oklch(0.55 0.22 20 / 15%)", backdropFilter: "blur(20px)" }}>
        
        {/* Red L logo — click to upload custom logo */}
        
        <div onClick={() => logoInputRef.current?.click()} className="cursor-pointer group shrink-0" title="Click to upload custom logo">
          {logoSrc ?
          <img src={logoSrc} alt="Logo" className="h-8 w-auto max-w-[120px] object-contain" /> :

          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform"
            style={{
              background: "linear-gradient(135deg, oklch(0.55 0.22 20 / 30%) 0%, oklch(0.55 0.22 20 / 10%) 100%)",
              border: "1px solid oklch(0.55 0.22 20 / 40%)",
              boxShadow: "0 0 14px oklch(0.55 0.22 20 / 40%)"
            }}>AgentZero


          </div>
          }
        </div>

        {/* App name */}
        

        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
            <input
              type="text"
              placeholder="Search LifeOS..."
              className="w-full h-8 pl-8 pr-4 text-xs rounded-lg text-white/80 placeholder:text-white/25 focus:outline-none transition-all"
              style={{ background: "oklch(1 0 0 / 4%)", border: "1px solid oklch(0.55 0.22 20 / 15%)" }}
              onFocus={(e) => e.target.style.borderColor = "oklch(0.55 0.22 20 / 50%)"}
              onBlur={(e) => e.target.style.borderColor = "oklch(0.55 0.22 20 / 15%)"} />
            
          </div>
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          {/* Notification bell */}
          <div className="relative">
            <button
              onClick={() => {setNotifOpen(!notifOpen);setUserMenuOpen(false);}}
              className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-white/50 hover:text-white/90 transition-colors">
              
              <Bell size={15} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary pulse-crimson" />
            </button>
            <AnimatePresence>
              {notifOpen &&
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                className="absolute right-0 top-10 w-80 glass rounded-xl border z-50 overflow-hidden"
                style={{ borderColor: "oklch(0.55 0.22 20 / 20%)" }}>
                
                  <div className="p-3 border-b border-primary/10 flex items-center justify-between">
                    <span className="text-xs font-display text-primary/80 tracking-wider">NOTIFICATIONS</span>
                    <span className="text-[9px] text-white/25">Mark all read</span>
                  </div>
                  <div className="p-4 text-xs text-white/30 text-center py-8">No new notifications</div>
                </motion.div>
              }
            </AnimatePresence>
          </div>

          {/* User avatar + dropdown */}
          <div className="relative">
            <button
              onClick={() => {setUserMenuOpen(!userMenuOpen);setNotifOpen(false);}}
              className="flex items-center gap-2 pl-2 border-l cursor-pointer group"
              style={{ borderColor: "oklch(0.55 0.22 20 / 20%)" }}>
              
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-primary text-xs font-bold shrink-0"
                style={{ background: "oklch(0.55 0.22 20 / 20%)", border: "1px solid oklch(0.55 0.22 20 / 35%)" }}>
                
                {profile.name ? profile.name[0].toUpperCase() : "U"}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs text-white/85 leading-none font-semibold">{profile.name || "User"}</div>
                <div className="text-[9px] mt-0.5" style={{ color: "oklch(0.75 0.15 175)" }}>{profile.jobTitle || "Admin"}</div>
              </div>
              <ChevronDown size={11} className="text-white/30 group-hover:text-white/60 hidden sm:block" />
            </button>

            <AnimatePresence>
              {userMenuOpen &&
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                className="absolute right-0 top-10 w-56 glass rounded-xl border z-50 overflow-hidden"
                style={{ borderColor: "oklch(0.55 0.22 20 / 20%)" }}>
                
                  <div className="p-3 border-b border-primary/10">
                    <div className="text-xs text-white/80 font-semibold">{profile.name || "User"}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: "oklch(0.75 0.15 175)" }}>{profile.email || "No email set"}</div>
                  </div>
                  {[
                { icon: <Edit3 size={13} />, label: "Edit Profile", action: () => {setProfileOpen(true);setUserMenuOpen(false);} },
                { icon: <Settings size={13} />, label: "Settings", action: () => setUserMenuOpen(false) },
                { icon: <LogOut size={13} />, label: "Sign Out", action: () => setUserMenuOpen(false) }].
                map((item) =>
                <button key={item.label} onClick={item.action} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-white/60 hover:text-white/90 hover:bg-white/5 transition-colors">
                      <span className="text-primary/70">{item.icon}</span>
                      {item.label}
                    </button>
                )}
                </motion.div>
              }
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Profile modal */}
      <AnimatePresence>
        {profileOpen &&
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-6"
          style={{ background: "oklch(0 0 0 / 80%)" }}
          onClick={() => setProfileOpen(false)}>
          
            <motion.div
            initial={{ scale: 0.92, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 20 }}
            className="glass rounded-2xl border w-full max-w-xl max-h-[80vh] overflow-hidden flex flex-col"
            style={{ borderColor: "oklch(0.55 0.22 20 / 25%)" }}
            onClick={(e) => e.stopPropagation()}>
            
              <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: "oklch(0.55 0.22 20 / 15%)" }}>
                <span className="font-display text-sm tracking-wider" style={{ color: "oklch(0.62 0.22 20)", textShadow: "0 0 10px oklch(0.55 0.22 20 / 60%)" }}>EDIT PROFILE</span>
                <button onClick={() => setProfileOpen(false)} className="text-white/30 hover:text-primary transition-colors"><X size={16} /></button>
              </div>
              <div className="p-4 overflow-y-auto space-y-3">
                <p className="text-[10px] text-white/30 leading-relaxed">
                  This profile is read by your AI agents (Erebus, Kranos) for personalized assistance. All fields support multiple values.
                </p>
                {PROFILE_FIELDS.map((f) =>
              <div key={f.key}>
                    <label className="text-[9px] font-display tracking-wider" style={{ color: "oklch(0.75 0.15 175)" }}>{f.label.toUpperCase()}</label>
                    <input
                  value={profile[f.key] ?? ""}
                  onChange={(e) => setProfile((p) => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full mt-1 h-8 px-3 text-xs rounded-lg text-white/85 placeholder:text-white/20 focus:outline-none transition-all"
                  style={{ background: "oklch(1 0 0 / 4%)", border: "1px solid oklch(0.55 0.22 20 / 15%)" }}
                  onFocus={(e) => e.target.style.borderColor = "oklch(0.55 0.22 20 / 50%)"}
                  onBlur={(e) => e.target.style.borderColor = "oklch(0.55 0.22 20 / 15%)"} />
                
                  </div>
              )}
              </div>
              <div className="p-4 border-t flex justify-end gap-2" style={{ borderColor: "oklch(0.55 0.22 20 / 15%)" }}>
                <button onClick={() => setProfileOpen(false)} className="px-4 py-2 rounded-lg glass text-white/50 text-xs font-display hover:text-white/80 transition-all">CANCEL</button>
                <button onClick={() => setProfileOpen(false)} className="px-4 py-2 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all">SAVE PROFILE</button>
              </div>
            </motion.div>
          </motion.div>
        }
      </AnimatePresence>
    </>);

}