import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Verification builds set NEXT_DIST_DIR (e.g. ".next-build") so `next build`
  // never clobbers the .next directory a running `next dev` is serving from.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Pin the tracing root; a stray lockfile in $HOME otherwise wins the guess.
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
