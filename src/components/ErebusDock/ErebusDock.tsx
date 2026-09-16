import React, { useState, useEffect, useRef } from "react";
import { Send, X, Minimize2, Maximize2, Zap } from "lucide-react";

export default function ErebusDock({ isOpen, onClose }) {
  const [input, setInput] = useState("");
  const [isTalking, setIsTalking] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;
    setIsTalking(true);
    
    // Trigger system prompt to AI
    window.hermes.send(input);
    setInput("");
    
    // Simulate talking duration
    setTimeout(() => setIsTalking(false), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="erebus-dock-container" style={{ width: isMaximized ? "500px" : "320px" }}>
      <div className="erebus-dock-glass">
        {/* Avatar Section */}
        <div className="erebus-avatar-section">
          <div 
            className={`erebus-avatar ${isTalking ? "erebus-avatar-talking" : ""}`}
            style={{ 
              backgroundImage: "url('/assets/erebus-core.png')", 
              backgroundSize: "cover",
              backgroundPosition: "center" 
            }}
          />
          <div style={{ 
            position: "absolute", 
            bottom: "10px", 
            right: "20px", 
            fontSize: "10px", 
            color: "var(--erebus-crimson)", 
            fontWeight: 800,
            letterSpacing: ".2em",
            textTransform: "uppercase"
          }}>
            {isTalking ? "Processing..." : "Online"}
          </div>
        </div>

        {/* Header/Controls */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          padding: "10px 16px", 
          borderBottom: "1px solid rgba(255,255,255,0.05)" 
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Zap size={12} color="var(--erebus-crimson)" />
            <span style={{ fontSize: 11, fontWeight: 700, color: "white", letterSpacing: ".1em" }}>EREBUS CORE</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setIsMaximized(!isMaximized)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>
              {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Input Area */}
        <div className="erebus-input-area">
          <div className="erebus-input-wrapper">
            <input 
              ref={inputRef}
              className="erebus-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Command the core..."
            />
            <button 
              onClick={handleSend}
              style={{ 
                background: "var(--erebus-crimson)", 
                border: "none", 
                borderRadius: "8px", 
                color: "white", 
                padding: "6px", 
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
