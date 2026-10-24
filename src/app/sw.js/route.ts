import {appRelease} from "@/lib/pwa/release";
import {serviceWorker} from "@/lib/pwa/worker";
export const dynamic="force-static";
export function GET(){return new Response(serviceWorker(appRelease.build||"unidentified"),{headers:{"Content-Type":"application/javascript; charset=utf-8","Cache-Control":"no-cache, no-store, must-revalidate","Service-Worker-Allowed":"/","Content-Security-Policy":"default-src 'none'; script-src 'self'; connect-src 'self'"}});}
