"use client";

import React from "react";
import type { Participant } from "@/hooks/useSessionPresence";

/** Stacked avatars of who's currently in the session room. */
const PresenceBar: React.FC<{ participants: Participant[] }> = ({ participants }) => {
  if (!participants.length) return null;
  const shown = participants.slice(0, 5);
  const extra = participants.length - shown.length;

  return (
    <div style={{ display: "flex", alignItems: "center" }} title={`${participants.length} viewing`}>
      {shown.map((p, i) => (
        <div
          key={p.conn_id}
          title={`${p.name} · ${p.role}`}
          style={{
            width: 26, height: 26, borderRadius: "50%", background: p.color, color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 700, border: "2px solid var(--bg-header, #fff)",
            marginLeft: i === 0 ? 0 : -8, textTransform: "uppercase",
          }}
        >
          {p.name.charAt(0)}
        </div>
      ))}
      {extra > 0 && (
        <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--brand-bone-deep)", color: "var(--fg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, border: "2px solid var(--bg-header,#fff)", marginLeft: -8 }}>
          +{extra}
        </div>
      )}
    </div>
  );
};

export default PresenceBar;
