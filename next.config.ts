import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    const development = process.env.NODE_ENV === "development";
    // Static pages need Next's inline hydration scripts; remote scripts stay blocked.
    const policy = [
      "default-src 'self'", "script-src 'self' 'unsafe-inline'" + (development ? " 'unsafe-eval'" : ""),
      "style-src 'self' 'unsafe-inline'", "img-src 'self' data: blob:", "font-src 'self'",
      "connect-src 'self' https://clxnqrkdalimrqcnhegr.supabase.co wss://clxnqrkdalimrqcnhegr.supabase.co" + (development ? " ws://localhost:* ws://127.0.0.1:*" : ""),
      "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'",
      ...(development ? [] : ["upgrade-insecure-requests"]),
    ].join("; ");
    return [{source: "/:path*", headers: [
      {key: "Content-Security-Policy", value: policy},
      {key: "X-Frame-Options", value: "DENY"},
      {key: "X-Content-Type-Options", value: "nosniff"},
      {key: "Referrer-Policy", value: "no-referrer"},
    ]}];
  },
};

export default nextConfig;
