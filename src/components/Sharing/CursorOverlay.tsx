"use client";

import React, { useEffect, useRef } from "react";
import type { RemoteCursor } from "@/hooks/useSessionPresence";

/**
 * Tracks this client's pointer (throttled) and renders remote participants' cursors.
 * Positions are stored as viewport fractions (0..1) so they map across screen sizes.
 */
const CursorOverlay: React.FC<{
  cursors: Record<string, RemoteCursor>;
  sendCursor: (x: number, y: number) => void;
}> = ({ cursors, sendCursor }) => {
  const last = useRef(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const now = performance.now();
      if (now - last.current < 50) return; // throttle ~20/s
      last.current = now;
      sendCursor(e.clientX / window.innerWidth, e.clientY / window.innerHeight);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [sendCursor]);

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 90 }}>
      {Object.values(cursors).map((c) => (
        <div
          key={c.conn_id}
          style={{
            position: "absolute",
            left: c.x * window.innerWidth,
            top: c.y * window.innerHeight,
            transform: "translate(-1px, -1px)",
            transition: "left 60ms linear, top 60ms linear",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 2l5 14 2.5-5.5L15 8 2 2z" fill={c.color} stroke="#fff" strokeWidth="1" />
          </svg>
          {c.name && (
            <span style={{ marginLeft: 12, background: c.color, color: "#fff", fontSize: 11, fontWeight: 600, padding: "2px 6px", borderRadius: 5, whiteSpace: "nowrap" }}>
              {c.name}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export default CursorOverlay;
