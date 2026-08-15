import React from "react";
import { useTheme } from "../../../contexts/theme";

const SocialLinkOS1 = () => {
  const { theme } = useTheme();
  return (
    <div style={{ ...theme.glass, padding: "24px" }}>
      <h2
        style={{
          color: theme.colors.text,
          fontSize: "20px",
          fontWeight: 600,
          marginBottom: "16px",
        }}
      >
        🌐 Social Link OS1
      </h2>
      <p style={{ color: theme.colors.textSecondary, marginBottom: "24px" }}>
        Centralized social media management – coming soon.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          gap: "12px",
        }}
      >
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
              borderRadius: theme.radii.md,
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
