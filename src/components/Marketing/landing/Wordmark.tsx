import type { CSSProperties } from "react";

/** The Intellign wordmark: Instrument Serif with a square accent dot. */
export default function Wordmark({
  size = 30,
  onDark = false,
  style,
  as: Tag = "span",
}: {
  size?: number | string;
  onDark?: boolean;
  style?: CSSProperties;
  as?: "span" | "div";
}) {
  return (
    <Tag className={`ld-wm${onDark ? " on-dark" : ""}`} style={{ fontSize: size, ...style }}>
      Intellign<i className="ld-wm-dot" aria-hidden="true" />
    </Tag>
  );
}
