"use client";

import { usePathname } from "next/navigation";

/** Shows the address that didn't resolve, so people can spot a typo. */
export default function NotFoundPath() {
  const path = usePathname();
  return <span className="ld-nf-path">{path || "/"}</span>;
}
