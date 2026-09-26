import { getRepository } from "@/lib/incidents";
import { submitIncident } from "@/lib/incidents/submission";
import { apiError, readJson } from "@/lib/server/errors";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return Response.json(await (await getRepository()).getIncidents());
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
