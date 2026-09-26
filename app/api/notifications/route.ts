import { listNotifications } from "@/lib/notifications";
import { apiError } from "@/lib/server/errors";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return Response.json(await listNotifications());
  } catch (e) {
    return apiError(e);
  }
}
