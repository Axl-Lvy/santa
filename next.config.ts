import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A self-contained server for the Docker image on the mini PC.
  output: "standalone",
  // Built-in gzip can buffer text/event-stream; Cloudflare compresses at the edge.
  compress: false,
  serverExternalPackages: ["better-sqlite3"],
  // Dev logs server function arguments, which would print message bodies (privacy rule 6).
  logging: { serverFunctions: false },
};

export default nextConfig;
