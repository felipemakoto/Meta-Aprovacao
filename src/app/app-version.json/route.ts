import {appRelease} from "@/lib/pwa/release";
export const dynamic="force-static";
export function GET(){return Response.json(appRelease,{headers:{"Cache-Control":"no-store, max-age=0"}});}
