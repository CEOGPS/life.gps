import React from "react";

const SocialLinkOS1 = () => {
  // Simple inline theme instead of context
  const theme = {
    glass: { background: "rgba(20,20,20,0.4)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px" },
    colors: {
      text: "#f0ede8",
      textSecondary: "#9aaabb",
      border: "rgba(255,255,255,0.07)"
    },
    radii: { md: "8px" }
  };

  return (
    <div style={{ ...theme.glass, padding: "24px" }}>
      <h2 style={{ color: theme.colors.text, fontSize: "20px", fontWeight: 600, marginBottom: "16px" }}>
        🌐 Social Link OS1
      </h2>
      <p style={{ color: theme.colors.textSecondary, marginBottom: "24px" }}>
        Centralized social media management – coming soon.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "12px" }}>
        {[
          "Facebook",
          "Instagram",
          "Twitter",
          "LinkedIn",
          "TikTok",
          "YouTube",
        ].map((platform) => (
          <div
            key={platform}
            style={{
              background: "rgba(255,255,255,0.03)",
              padding: "12px",
              borderRadius: "8px",
              border: `1px solid ${theme.colors.border}`,
              textAlign: "center",
              color: theme.colors.textSecondary,
              fontSize: "13px",
            }}
          >
            {platform}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SocialLinkOS1;