import { z } from "zod";
import { markNotificationsRead } from "@/lib/notifications";
import { apiError, readJson } from "@/lib/server/errors";
// Body: { ids: string[] } for specific notifications, or {} to mark everything read.
export async function POST(request: Request) {
  try {
    const { ids } = z
      .object({ ids: z.array(z.string().uuid()).max(100).optional() })
      .parse(await readJson(request));
    await markNotificationsRead(ids ?? null);
    return Response.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
