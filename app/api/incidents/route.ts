import { getRepository } from "@/lib/incidents";
import { submitIncident } from "@/lib/incidents/submission";
import { forViewer } from "@/lib/incidents/visibility";
import { requireUser } from "@/lib/auth/server";
import { apiError, readJson } from "@/lib/server/errors";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const user = await requireUser();
    const rows = await (await getRepository()).getIncidents();
    return Response.json(rows.map((i) => forViewer(i, user)));
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(request: Request) {
  try {
    return Response.json(await submitIncident(await readJson(request)), {
      status: 201,
    });
  } catch (e) {
    return apiError(e);
  }
}
