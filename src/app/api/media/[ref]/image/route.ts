import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const revalidate = 0;

// GET /api/media/[ref]/image — proxy a stone's photo through our own domain.
// Fetches the stored supplier URL server-side (so http links work and the browser
// only ever sees this same-origin https URL) and streams the image back. The supplier
// link is never exposed to the customer, and only the ref (not an arbitrary URL) is
// accepted, so this can't be used to fetch anything we didn't store.
export async function GET(_req: Request, { params }: { params: Promise<{ ref: string }> }) {
  const session = await getSession();
  if (!session) return new NextResponse(null, { status: 401 });

  const { ref } = await params;
  const stone = await db.stone.findUnique({ where: { ref }, select: { mediaPhotoUrl: true } });
  const url = stone?.mediaPhotoUrl?.trim();
  if (!url || !/^https?:\/\//i.test(url)) return new NextResponse(null, { status: 404 });

  let upstream: Response;
  try {
    upstream = await fetch(url, { redirect: "follow" });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
  if (!upstream.ok || !upstream.body) return new NextResponse(null, { status: 502 });

  const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": contentType,
      // Fetched once from the supplier, then served from Vercel's edge cache.
      "Cache-Control": "public, max-age=86400, s-maxage=604800",
    },
  });
}
