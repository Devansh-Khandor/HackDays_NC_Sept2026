import { requireUser } from "@/lib/auth/server";
import { getRepository } from "@/lib/incidents";
import { incidentActionSchema } from "@/lib/incidents/workflow";
import { forViewer } from "@/lib/incidents/visibility";
import { apiError, AppError, readJson } from "@/lib/server/errors";
type Context = { params: Promise<{ id: string }> };
export async function GET(_: Request, { params }: Context) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const row = await (await getRepository()).getIncident(id);
    if (!row) throw new AppError("That report could not be found.", 404);
    return Response.json(forViewer(row, user));
  } catch (e) {
    return apiError(e);
  }
}
// Workflow actions: the database re-checks the signed-in role and assignment.
export async function PATCH(request: Request, { params }: Context) {
  try {
    const user = await requireUser();
    if (user.role === "student")
      throw new AppError("Only CampusFix staff can update reports.", 403);
    const { id } = await params;
    const parsed = incidentActionSchema.safeParse(await readJson(request));
    if (!parsed.success)
      throw new AppError(
        parsed.error.issues[0]?.message ?? "Choose a valid action.",
      );
    const row = await (
      await getRepository()
    ).applyAction(id, parsed.data, user);
    return Response.json(forViewer(row, user));
  } catch (e) {
    return apiError(e);
  }
}
