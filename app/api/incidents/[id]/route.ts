import { requireAdmin } from "@/lib/auth/server";
import { z } from "zod";
import { statuses } from "@/lib/incidents/schema";
import { getRepository } from "@/lib/incidents";
import { apiError, AppError, readJson } from "@/lib/server/errors";
type Context = { params: Promise<{ id: string }> };
export async function GET(_: Request, { params }: Context) {
  try {
    const { id } = await params;
    const row = await (await getRepository()).getIncident(id);
    if (!row) throw new AppError("That report could not be found.", 404);
    return Response.json(row);
  } catch (e) {
    return apiError(e);
  }
}
export async function PATCH(request: Request, { params }: Context) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { status } = z
      .object({ status: z.enum(statuses) })
      .parse(await readJson(request));
    return Response.json(await (await getRepository()).updateStatus(id, status));
  } catch (e) {
    return apiError(e);
  }
}
