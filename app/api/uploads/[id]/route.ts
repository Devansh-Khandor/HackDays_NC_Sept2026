import { readImage } from "@/lib/server/uploads";
import { apiError } from "@/lib/server/errors";
export const runtime = "nodejs";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const buffer = await readImage(id);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": id.endsWith(".png")
          ? "image/png"
          : id.endsWith(".webp")
            ? "image/webp"
            : "image/jpeg",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    return apiError(e);
  }
}
