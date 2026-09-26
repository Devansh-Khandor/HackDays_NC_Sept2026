import { z } from "zod";
import { addEmployee, listEmployees, removeEmployee } from "@/lib/team";
import { credentialsSchema } from "@/lib/auth/policy";
import { apiError, AppError, readJson } from "@/lib/server/errors";
export const dynamic = "force-dynamic";
const emailBody = z.object({ email: credentialsSchema.shape.email });
async function parseEmail(request: Request) {
  const parsed = emailBody.safeParse(await readJson(request));
  if (!parsed.success)
    throw new AppError(
      parsed.error.issues[0]?.message ?? "Enter an @ncsu.edu email address.",
    );
  return parsed.data.email;
}
export async function GET() {
  try {
    return Response.json(await listEmployees());
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(request: Request) {
  try {
    await addEmployee(await parseEmail(request));
    return Response.json(await listEmployees(), { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
export async function DELETE(request: Request) {
  try {
    await removeEmployee(await parseEmail(request));
    return Response.json(await listEmployees());
  } catch (e) {
    return apiError(e);
  }
}
