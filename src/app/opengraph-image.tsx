import { ImageResponse } from "next/og";

export const alt = "Intellign — The math layer within AI";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#F4EFE7",
          color: "#3E0E1A",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: 6, textTransform: "uppercase", color: "#5C1427", marginBottom: 28, display: "flex" }}>
          Intellign · Optimization as a service
        </div>
        <div style={{ fontSize: 92, lineHeight: 1.05, display: "flex", flexDirection: "column" }}>
          <span>The math layer</span>
          <span style={{ display: "flex" }}>
            within&nbsp;<span style={{ fontStyle: "italic", color: "#5C1427" }}>AI</span>.
          </span>
        </div>
        <div style={{ fontSize: 30, marginTop: 36, color: "#4A4945", display: "flex" }}>
          Plain English in — explained, auditable assignments out. Three chat turns.
        </div>
        <div style={{ position: "absolute", bottom: 48, right: 80, fontSize: 24, color: "#5C1427", display: "flex" }}>
          intellign.databackedafrica.com
        </div>
      </div>
    ),
    { ...size }
  );
}
