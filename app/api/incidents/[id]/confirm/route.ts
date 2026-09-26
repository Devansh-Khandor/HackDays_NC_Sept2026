import { z } from "zod";
import { getRepository } from "@/lib/incidents";
import { apiError, readJson } from "@/lib/server/errors";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { confirmationKey } = z
      .object({ confirmationKey: z.string().uuid() })
      .parse(await readJson(request));
    return Response.json(
      await getRepository().addConfirmation(id, confirmationKey),
    );
  } catch (e) {
    return apiError(e);
  }
}
