import { writeFile, mkdir } from "fs/promises";
import path from "path";

/**
 * Store an uploaded file and return a retrievable URL.
 * - Production: Vercel Blob (set BLOB_READ_WRITE_TOKEN).
 * - Dev fallback: writes under .uploads/ and serves via /api/uploads/<folder>/<name>.
 *
 * NOTE: KYC documents are sensitive. For production, prefer a private bucket (S3) or
 * Vercel Blob with access controls; the public-but-unguessable URL here is a starting point.
 */
export async function storeUpload(file: File, folder = "misc"): Promise<string> {
  const bytes = Buffer.from(await file.arrayBuffer());
  const safeName = `${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const { url } = await put(`${folder}/${safeName}`, bytes, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: file.type || undefined,
    });
    return url;
  }

  const dir = path.join(process.cwd(), ".uploads", folder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, safeName), bytes);
  return `/api/uploads/${folder}/${safeName}`;
}
