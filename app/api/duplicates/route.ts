import { requireUser } from "@/lib/auth/server";
import { draftSchema } from "@/lib/incidents/schema";
import { getRepository } from "@/lib/incidents";
import { detectDuplicate } from "@/lib/gemini/duplicateDetection";
import { apiError, readJson } from "@/lib/server/errors";
export async function POST(request: Request) {
  try {
    await requireUser();
    const draft = draftSchema.parse(await readJson(request));
    try {
      return Response.json({
        duplicate: await detectDuplicate(
          draft,
          await (await getRepository()).getOpenIncidents(draft),
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
