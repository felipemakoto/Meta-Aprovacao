import { readPublicSiteStatus } from "@/lib/site-status/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const { announcement, maintenance } = await readPublicSiteStatus();
  return Response.json({ announcement, maintenance }, {
    headers: { "Cache-Control": "no-store" },
  });
}
