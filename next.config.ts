import type { NextConfig } from "next";
import {execFileSync} from "node:child_process";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {version} from "./package.json";

let releaseBuild=process.env.VERCEL_GIT_COMMIT_SHA ?? "";
if(!releaseBuild){try{
  // A local build may contain uncommitted changes: fingerprint its actual sources.
  const files=execFileSync("git",["ls-files","-co","--exclude-standard","--","src","public","next.config.ts","package.json","package-lock.json","tsconfig.json","postcss.config.mjs"],{encoding:"utf8",stdio:["ignore","pipe","ignore"]}).trim().split(/\r?\n/);
  const hash=createHash("sha256");for(const file of [...new Set(files)].sort())hash.update(file).update(readFileSync(file));releaseBuild=hash.digest("hex");
}catch{}}

const nextConfig: NextConfig = {
  env:{NEXT_PUBLIC_APP_VERSION:version,NEXT_PUBLIC_APP_BUILD:releaseBuild},
  async headers() {
    const development = process.env.NODE_ENV === "development";
    // Keep remote resources limited to the named analytics and payment services.
    const policy = [
      "default-src 'self'", "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com/gtag/js" + (development ? " 'unsafe-eval'" : ""),
      "style-src 'self' 'unsafe-inline'", "img-src 'self' data: blob:", "font-src 'self'",
      "connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://clxnqrkdalimrqcnhegr.supabase.co wss://clxnqrkdalimrqcnhegr.supabase.co" + (development ? " ws://localhost:* ws://127.0.0.1:*" : ""),
      "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'",
      "frame-src https://fatweb.s3.amazonaws.com https://assets.fatvestibulares.com.br https://concurso30.fundacaocefetminas.org.br https://ifsp.edu.br https://*.ifsp.edu.br",
      ...(development ? [] : ["upgrade-insecure-requests"]),
    ].join("; ");
    return [{source:"/sw.js",headers:[{key:"Cache-Control",value:"no-cache, no-store, must-revalidate"},{key:"Service-Worker-Allowed",value:"/"}]},{source:"/app-version.json",headers:[{key:"Cache-Control",value:"no-store, max-age=0"}]},{source: "/:path*", headers: [
      {key: "Content-Security-Policy", value: policy},
      {key: "X-Frame-Options", value: "DENY"},
      {key: "X-Content-Type-Options", value: "nosniff"},
      {key: "Referrer-Policy", value: "no-referrer"},
    ]}, ...(process.env.CAKTO_DIRECT_CHECKOUT_ENABLED==="true"?[{source:"/premium/pagamento",headers:[{key:"Content-Security-Policy",value:policy
      .replace("script-src 'self'", "script-src https://cakto-sdk.pages.dev https://d354c9v5bptm0r.cloudfront.net 'self'")
      .replace("connect-src 'self'", "connect-src https://api.cakto.com.br https://kvnpji2t.jjysjnuego.com 'self'")
    }]}]:[])];
  },
};

export default nextConfig;
