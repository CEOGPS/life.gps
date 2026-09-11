import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { MapPin, MapPinCheck, Navigation, Search, Layers, Target, Home, Plus, Minus, Locate, Compass, Settings, RefreshCw, Download, Share2, AlertCircle, CheckCircle, Clock, Car, Bike, Footprints, Plane, Truck, Map, Moon, Sun, Briefcase, Dumbbell, Building2, Bus, Coffee, Heart, ShoppingBag, X } from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout.tsx";

const MAP_STYLES = [
  { id: "streets", label: "Streets", icon: Map },
  { id: "satellite", label: "Satellite", icon: Layers },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "light", label: "Light", icon: Sun },
];

const SAVED_LOCATIONS = [
  { id: "home", name: "Home", address: "123 Main St, Atlanta, GA", coords: [33.749, -84.388], icon: Home, color: "oklch(0.7 0.18 70)" },
  { id: "office", name: "Office", address: "456 Peachtree St, Atlanta, GA", coords: [33.756, -84.392], icon: Briefcase, color: "oklch(0.65 0.22 265)" },
  { id: "gym", name: "Gym", address: "789 Fitness Blvd, Atlanta, GA", coords: [33.765, -84.401], icon: Dumbbell, color: "oklch(0.75 0.15 175)" },
  { id: "client1", name: "Client: Acme Corp", address: "321 Business Ave, Atlanta, GA", coords: [33.772, -84.385], icon: Building2, color: "oklch(0.68 0.2 310)" },
];

const RECENT_ROUTES = [
  { from: "Home", to: "Office", distance: "8.2 mi", duration: "22 min", mode: "car", time: "Today 8:15 AM" },
  { from: "Office", to: "Client: Acme Corp", distance: "3.1 mi", duration: "12 min", mode: "car", time: "Today 10:30 AM" },
  { from: "Office", to: "Gym", distance: "4.5 mi", duration: "18 min", mode: "bike", time: "Yesterday 6:00 PM" },
  { from: "Gym", to: "Home", distance: "5.2 mi", duration: "15 min", mode: "car", time: "Yesterday 7:30 PM" },
];

const TRAVEL_MODES = [
  { id: "car", label: "Drive", icon: Car, color: "oklch(0.65 0.22 265)" },
  { id: "bike", label: "Bike", icon: Bike, color: "oklch(0.75 0.15 175)" },
  { id: "walk", label: "Walk", icon: Footprints, color: "oklch(0.7 0.18 70)" },
  { id: "transit", label: "Transit", icon: Bus, color: "oklch(0.68 0.2 310)" },
];

export default function MapsPanel() {
  const [activeTab, setActiveTab] = useState<"explore" | "saved" | "routes" | "settings">("explore");
  const [mapStyle, setMapStyle] = useState("streets");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<typeof SAVED_LOCATIONS[0] | null>(null);
  const [travelMode, setTravelMode] = useState("car");
  const [routeResult, setRouteResult] = useState<{ distance: string; duration: string } | null>(null);

  // Simulate map interactions
  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    // Simulate geocoding
    setSelectedLocation({
      id: "search",
      name: searchQuery,
      address: "Search result for " + searchQuery,
      coords: [33.749 + (Math.random() - 0.5) * 0.1, -84.388 + (Math.random() - 0.5) * 0.1],
      icon: MapPin,
      color: "oklch(0.7 0.18 70)",
    });
    setActiveTab("explore");
  };

  const calculateRoute = (from: number[], to: number[]) => {
    // Simulate route calculation
    const distance = (Math.random() * 20 + 1).toFixed(1);
    const duration = Math.floor(Math.random() * 45 + 5);
    setRouteResult({ distance: `${distance} mi`, duration: `${duration} min` });
    
    // Add to recent routes
    const newRoute = {
      from: "Current Location",
      to: selectedLocation?.name || "Destination",
      distance: `${distance} mi`,
      duration: `${duration} min`,
      mode: travelMode,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    // In real app, would save to localStorage
  };

  const getModeIcon = (mode: string) => {
    return TRAVEL_MODES.find(m => m.id === mode)?.icon || Car;
  };

  return (
    <PanelLayout
      title="Maps"
      subtitle="Navigation, locations & route planning"
      icon={<MapPin size={18} />}
      actions={
        <div className="flex items-center gap-2">
          <select
            value={mapStyle}
            onChange={(e) => setMapStyle(e.target.value)}
            className="h-8 px-2 text-xs bg-white/4 border border-white/8 rounded-lg text-white/80 focus:outline-none focus:border-primary/40"
          >
            {MAP_STYLES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <button className="w-8 h-8 rounded-lg glass-crimson flex items-center justify-center text-primary hover:glow-crimson-sm transition-all" title="Locate me">
            <Locate size={14} />
          </button>
        </div>
      }
    >
      <div className="h-full flex flex-col">
        {/* Tab Navigation */}
        <div className="flex gap-1 p-1 glass rounded-xl border border-white/8 shrink-0">
          {[
            { id: "explore", label: "Explore", icon: Search },
            { id: "saved", label: "Saved", icon: MapPinCheck },
            { id: "routes", label: "Routes", icon: Navigation },
            { id: "settings", label: "Settings", icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-display transition-all ${
                activeTab === tab.id
                  ? "glass-crimson text-primary glow-crimson-sm"
                  : "text-white/50 hover:text-white/80 hover:bg-white/5"
              }`}
            >
              <tab.icon size={12} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "explore" && (
            <div className="space-y-4 p-2">
              {/* Search Bar */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-xl border border-white/8 p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Search size={14} className="text-white/40" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Search places, addresses, coordinates..."
                    className="flex-1 h-10 px-3 text-sm bg-white/4 border border-white/8 rounded-lg text-white/80 placeholder:text-white/30 focus:outline-none focus:border-primary/40"
                  />
                  <button
                    onClick={handleSearch}
                    className="px-4 py-2 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all"
                    disabled={!searchQuery.trim()}
                  >
                    SEARCH
                  </button>
                </div>

                {/* Map View Placeholder */}
                <div className="relative aspect-video rounded-lg overflow-hidden glass border border-white/5">
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-teal/10">
                    <div className="text-center">
                      <Map size={48} className="mx-auto text-white/10 mb-3" />
                      <p className="text-sm text-white/40">Interactive Map View</p>
                      <p className="text-[10px] text-white/30 mt-1">MapLibre GL / Leaflet integration ready</p>
                      <p className="text-[10px] text-white/30">Style: {mapStyle}</p>
                    </div>
                  </div>
                  
                  {/* Selected location marker */}
                  {selectedLocation && (
                    <div className="absolute bottom-4 left-4 right-4">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass rounded-lg p-3 border border-white/8 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: selectedLocation.color }}>
                            <selectedLocation.icon size={16} className="text-white" />
                          </div>
                          <div>
                            <div className="font-medium text-sm text-white/80">{selectedLocation.name}</div>
                            <div className="text-[10px] text-white/40">{selectedLocation.address}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all">
                            <Navigation size={12} /> NAVIGATE
                          </button>
                          <button className="w-8 h-8 rounded-lg glass border border-white/8 flex items-center justify-center text-white/50 hover:text-primary transition-all">
                            <Share2 size={12} />
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass rounded-xl border border-white/8 p-4"
              >
                <h3 className="font-display text-sm text-white/80 tracking-wider mb-3">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Navigate Home", icon: Home, action: () => setSelectedLocation(SAVED_LOCATIONS[0]) },
                    { label: "Navigate Office", icon: Briefcase, action: () => setSelectedLocation(SAVED_LOCATIONS[1]) },
                    { label: "Find Coffee", icon: Coffee, action: () => { setSearchQuery("coffee near me"); handleSearch(); } },
                    { label: "Nearby Gyms", icon: Dumbbell, action: () => { setSearchQuery("gym near me"); handleSearch(); } },
                  ].map((action, i) => (
                    <button
                      key={action.label}
                      onClick={action.action}
                      className="glass rounded-lg p-3 border border-white/5 flex flex-col items-center gap-2 text-start hover:border-primary/20 hover:glow-crimson-sm transition-all"
                    >
                      <action.icon size={18} className="text-primary/70" />
                      <span className="text-[10px] font-display text-white/70 text-center">{action.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          )}

          {activeTab === "saved" && (
            <div className="space-y-4 p-2">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-xl border border-white/8 p-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-sm text-white/80 tracking-wider">Saved Locations</h3>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all">
                    <Plus size={12} /> ADD LOCATION
                  </button>
                </div>
                <div className="space-y-2">
                  {SAVED_LOCATIONS.map((location, i) => (
                    <motion.div
                      key={location.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="glass rounded-lg p-3 border border-white/5 flex items-center justify-between hover:border-primary/20 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: location.color }}>
                          <location.icon size={16} className="text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-sm text-white/80">{location.name}</div>
                          <div className="text-[10px] text-white/40">{location.address}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all" onClick={() => { setSelectedLocation(location); setActiveTab("explore"); }}>
                          <Navigation size={12} /> GO
                        </button>
                        <button className="w-8 h-8 rounded-lg glass border border-white/8 flex items-center justify-center text-white/50 hover:text-primary transition-all">
                          <Settings size={12} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Location Categories */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass rounded-xl border border-white/8 p-4"
              >
                <h3 className="font-display text-sm text-white/80 tracking-wider mb-3">Categories</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { label: "Home", count: 1, icon: Home },
                    { label: "Work", count: 1, icon: Briefcase },
                    { label: "Health", count: 1, icon: Dumbbell },
                    { label: "Clients", count: 1, icon: Building2 },
                    { label: "Favorites", count: 0, icon: Heart },
                    { label: "Travel", count: 0, icon: Plane },
                    { label: "Errands", count: 0, icon: ShoppingBag },
                    { label: "Custom", count: 0, icon: Plus },
                  ].map((cat, i) => (
                    <button key={cat.label} className="glass rounded-lg p-3 border border-white/5 flex flex-col items-center gap-1.5 text-start hover:border-primary/20 transition-all">
                      <cat.icon size={16} className="text-white/60" />
                      <span className="text-[10px] font-display text-white/70">{cat.label}</span>
                      <span className="text-[9px] text-white/30">{cat.count} saved</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          )}

          {activeTab === "routes" && (
            <div className="space-y-4 p-2">
              {/* Route Planner */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-xl border border-white/8 p-4"
              >
                <h3 className="font-display text-sm text-white/80 tracking-wider mb-4">Route Planner</h3>
                
                <div className="space-y-3 mb-4">
                  <div className="glass rounded-lg p-3 border border-white/5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "oklch(0.7 0.18 70)" }}>
                      <MapPin size={14} className="text-white" />
                    </div>
                    <input
                      type="text"
                      placeholder="From: Current Location"
                      className="flex-1 bg-transparent text-sm text-white/80 placeholder:text-white/30 focus:outline-none"
                      readOnly
                    />
                    <Locate size={14} className="text-white/40" />
                  </div>
                  
                  <div className="glass rounded-lg p-3 border border-white/5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "oklch(0.65 0.22 265)" }}>
                      <MapPinCheck size={14} className="text-white" />
                    </div>
                    <input
                      type="text"
                      placeholder={selectedLocation ? `To: ${selectedLocation.name}` : "To: Select destination"}
                      className="flex-1 bg-transparent text-sm text-white/80 placeholder:text-white/30 focus:outline-none"
                      readOnly
                    />
                    {selectedLocation && (
                      <button className="text-white/40 hover:text-red-400 transition-all" onClick={() => setSelectedLocation(null)}>
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Travel Modes */}
                <div className="flex gap-2 mb-4">
                  {TRAVEL_MODES.map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setTravelMode(mode.id)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-display transition-all ${
                        travelMode === mode.id
                          ? "glass-crimson text-primary glow-crimson-sm"
                          : "glass border border-white/5 text-white/50 hover:text-white/80"
                      }`}
                    >
                      <mode.icon size={12} style={{ color: travelMode === mode.id ? "inherit" : mode.color }} />
                      {mode.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => selectedLocation && calculateRoute([33.749, -84.388], selectedLocation.coords)}
                  disabled={!selectedLocation}
                  className="w-full py-3 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {routeResult ? `Route: ${routeResult.distance} • ${routeResult.duration}` : "CALCULATE ROUTE"}
                </button>

                {routeResult && (
                  <div className="mt-4 p-3 glass rounded-lg border border-primary/20">
                    <div className="flex items-center gap-2 text-sm text-white/70 mb-2">
                      {(TRAVEL_MODES.find(m => m.id === travelMode)?.icon || Car) && (() => {
                        const ModeIcon = TRAVEL_MODES.find(m => m.id === travelMode)?.icon || Car;
                        return <ModeIcon size={14} className="text-primary" />;
                      })()}
                      <span>Estimated route via {travelMode}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-xl font-display font-bold text-white/90">{routeResult.distance}</div>
                        <div className="text-[10px] text-white/30">Distance</div>
                      </div>
                      <div>
                        <div className="text-xl font-display font-bold text-white/90">{routeResult.duration}</div>
                        <div className="text-[10px] text-white/30">Duration</div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button className="flex-1 py-2 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all">START NAVIGATION</button>
                      <button className="flex-1 py-2 rounded-lg glass border border-white/8 text-white/70 hover:text-white transition-all">SAVE ROUTE</button>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Recent Routes */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass rounded-xl border border-white/8 overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-white/5">
                  <h3 className="font-display text-sm text-white/80 tracking-wider">Recent Routes</h3>
                </div>
                <div className="divide-y divide-white/5">
                  {RECENT_ROUTES.map((route, i) => (
                    <div key={i} className="p-4 hover:bg-white/3 transition-colors">
                      <div className="flex items-center gap-3 mb-2">
                        {(() => {
                          const ModeIcon = TRAVEL_MODES.find(m => m.id === route.mode)?.icon;
                          return ModeIcon ? (
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: TRAVEL_MODES.find(m => m.id === route.mode)?.color }}>
                              <ModeIcon size={14} className="text-white" />
                            </div>
                          ) : null;
                        })()}
                        <div className="flex-1">
                          <div className="font-medium text-sm text-white/80">{route.from} → {route.to}</div>
                          <div className="text-[10px] text-white/40">{route.time}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-white/90">{route.distance}</div>
                          <div className="text-[10px] text-white/40">{route.duration}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="flex-1 py-1.5 rounded-lg glass border border-white/5 text-[10px] font-display text-white/60 hover:text-white hover:border-primary/20 transition-all">REPEAT</button>
                        <button className="flex-1 py-1.5 rounded-lg glass border border-white/5 text-[10px] font-display text-white/60 hover:text-white hover:border-primary/20 transition-all">SHARE</button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-4 p-2">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-xl border border-white/8 p-4"
              >
                <h3 className="font-display text-sm text-white/80 tracking-wider mb-4">Map Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-white/70 mb-2 block">Default Map Style</label>
                    <div className="grid grid-cols-4 gap-2">
                      {MAP_STYLES.map((style) => (
                        <label key={style.id} className={`relative cursor-pointer ${mapStyle === style.id ? "ring-2 ring-primary/40" : ""}`}>
                          <input
                            type="radio"
                            name="mapStyle"
                            value={style.id}
                            checked={mapStyle === style.id}
                            onChange={(e) => setMapStyle(e.target.value)}
                            className="sr-only"
                          />
                          <div className={`glass rounded-lg p-3 border transition-all ${mapStyle === style.id ? "border-primary/40 bg-primary/5" : "border-white/5"}`}>
                            <style.icon size={18} className="mx-auto text-white/60 mb-2" />
                            <div className="text-[10px] font-display text-center text-white/70">{style.label}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-4">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <div className="text-sm text-white/70">Show traffic layer</div>
                        <div className="text-[10px] text-white/40">Real-time traffic conditions</div>
                      </div>
                      <input type="checkbox" className="w-4 h-4 accent-primary" defaultChecked />
                    </label>
                  </div>

                  <div className="border-t border-white/5 pt-4">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <div className="text-sm text-white/70">Voice navigation</div>
                        <div className="text-[10px] text-white/40">Turn-by-turn voice guidance</div>
                      </div>
                      <input type="checkbox" className="w-4 h-4 accent-primary" defaultChecked />
                    </label>
                  </div>

                  <div className="border-t border-white/5 pt-4">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <div className="text-sm text-white/70">Avoid tolls</div>
                        <div className="text-[10px] text-white/40">Prefer toll-free routes</div>
                      </div>
                      <input type="checkbox" className="w-4 h-4 accent-primary" />
                    </label>
                  </div>

                  <div className="border-t border-white/5 pt-4">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <div className="text-sm text-white/70">Avoid highways</div>
                        <div className="text-[10px] text-white/40">Prefer local roads</div>
                      </div>
                      <input type="checkbox" className="w-4 h-4 accent-primary" />
                    </label>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass rounded-xl border border-white/8 p-4"
              >
                <h3 className="font-display text-sm text-white/80 tracking-wider mb-4">Data & Sync</h3>
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-between p-3 glass rounded-lg border border-white/5 hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-3">
                      <Download size={16} className="text-white/50" />
                      <div>
                        <div className="text-sm text-white/70">Export Locations</div>
                        <div className="text-[10px] text-white/40">Download as GeoJSON / KML / CSV</div>
                      </div>
                    </div>
                    <Download size={14} className="text-white/40" />
                  </button>
                  <button className="w-full flex items-center justify-between p-3 glass rounded-lg border border-white/5 hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-3">
                      <RefreshCw size={16} className="text-white/50" />
                      <div>
                        <div className="text-sm text-white/70">Sync with Cloud</div>
                        <div className="text-[10px] text-white/40">Backup saved locations to Supabase</div>
                      </div>
                    </div>
                    <RefreshCw size={14} className="text-white/40" />
                  </button>
                  <button className="w-full flex items-center justify-between p-3 glass rounded-lg border border-white/5 hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-3">
                      <Share2 size={16} className="text-white/50" />
                      <div>
                        <div className="text-sm text-white/70">Share Location</div>
                        <div className="text-[10px] text-white/40">Generate shareable link for current location</div>
                      </div>
                    </div>
                    <Share2 size={14} className="text-white/40" />
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </PanelLayout>
  );
}