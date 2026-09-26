import { draftSchema } from "@/lib/incidents/schema";
import { getRepository } from "@/lib/incidents";
import { detectDuplicate } from "@/lib/gemini/duplicateDetection";
import { apiError, readJson } from "@/lib/server/errors";
export async function POST(request: Request) {
  try {
    const draft = draftSchema.parse(await readJson(request));
    try {
      return Response.json({
        duplicate: await detectDuplicate(
          draft,
          await getRepository().getOpenIncidents(),
        ),
        unavailable: false,
      });
    } catch {
      return Response.json({ duplicate: null, unavailable: true });
    }
  } catch (e) {
    return apiError(e);
  }
}
