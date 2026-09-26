import { ZodError } from "zod";
export class AppError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function apiError(error: unknown) {
  if (error instanceof AppError)
    return Response.json({ error: error.message }, { status: error.status });
  if (error instanceof ZodError)
    return Response.json(
      {
        error:
          "Some report details are missing or invalid. Check your location and try again.",
      },
      { status: 400 },
    );
  const message = error instanceof Error ? error.message : "";
  const known: Record<string, [string, number]> = {
    FORBIDDEN: ["You do not have permission to change this report.", 403],
    NOT_EMPLOYEE: [
      "Choose someone from your team list. Add them under Team first.",
      400,
    ],
    NOTE_REQUIRED: ["Add a note explaining what still needs work.", 400],
    INVALID_EMPLOYEE: [
      "Enter an @ncsu.edu email address that is not the administrator's.",
      400,
    ],
  };
  if (known[message])
    return Response.json(
      { error: known[message][0] },
      { status: known[message][1] },
    );
  if (message === "NOT_FOUND")
    return Response.json(
      { error: "That report could not be found." },
      { status: 404 },
    );
  if (message === "INVALID_TRANSITION")
    return Response.json(
      {
        error:
          "The report has changed. Refresh and use its next available action.",
      },
      { status: 409 },
    );
  if (message === "ALREADY_RESOLVED")
    return Response.json(
      {
        error:
          "This report has already been resolved. Please create a new report.",
      },
      { status: 409 },
    );
  // Do not log SDK request bodies, images, or API keys.
  console.error(
    "CampusFix request failed:",
    error instanceof Error ? error.name : "Unknown error",
  );
  return Response.json(
    {
      error:
        "CampusFix could not complete that request. Your report is still available. Please try again.",
    },
    { status: 500 },
  );
}
export async function readJson(request: Request) {
  if (Number(request.headers.get("content-length") ?? 0) > 100_000)
    throw new AppError("Request is too large.", 413);
  const text = await request.text();
  if (text.length > 100_000) throw new AppError("Request is too large.", 413);
  try {
    return JSON.parse(text);
  } catch {
    throw new AppError("Please send valid JSON.");
  }
}
