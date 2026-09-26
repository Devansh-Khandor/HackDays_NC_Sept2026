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
