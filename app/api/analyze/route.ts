import { requireUser } from "@/lib/auth/server";
import { z } from "zod";
import { analyzeIncident } from "@/lib/gemini/analyzeIncident";
import {
  coordinatesSchema,
  locationSchema,
  hasLocation,
} from "@/lib/incidents/schema";
import { demoAnalysis, scenarios } from "@/lib/demo/scenarios";
import { applySafetyRules } from "@/lib/safety/safetyRules";
import { routeIncident } from "@/lib/routing/routingEngine";
import { validateImage, storeImage } from "@/lib/server/uploads";
import { apiError, AppError } from "@/lib/server/errors";
export const runtime = "nodejs";
function parseCoordinates(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value) return null;
  try {
    return coordinatesSchema.parse(JSON.parse(value));
  } catch {
    throw new AppError("The device location could not be read. Try again.");
  }
}
export async function POST(request: Request) {
  try {
    await requireUser();
    if (Number(request.headers.get("content-length") ?? 0) > 6 * 1024 * 1024)
      throw new AppError("Please choose an image smaller than 5 MB.", 413);
    const form = await request.formData();
    const mode = z.enum(["live", "demo"]).parse(form.get("mode") ?? "live");
    const description = z
      .string()
      .max(3000)
      .parse(form.get("description") ?? "");
    const location = locationSchema.parse({
      building: form.get("building") ?? "",
      floor: form.get("floor") ?? "",
      room: form.get("room") ?? "",
      locationDescription: form.get("locationDescription") ?? "",
      coordinates: parseCoordinates(form.get("coordinates")),
    });
    const file = form.get("image");
    const image =
      file instanceof File && file.size ? await validateImage(file) : undefined;
    if (mode === "live" && !image && !description.trim())
      throw new AppError("Add a photo or describe the issue to get started.");
    const scenario = z.string().parse(form.get("scenario") ?? "fountain");
    if (mode === "demo" && !scenarios.some((s) => s.id === scenario))
      throw new AppError("Choose a demo scenario.");
    let analysis =
      mode === "demo"
        ? demoAnalysis(scenario)
        : await analyzeIncident({ image, description, location });
    analysis = routeIncident(applySafetyRules(analysis, description), location);
    if (!hasLocation(location) && !analysis.clarifyingQuestions.length)
      analysis = {
        ...analysis,
        missingInformation: ["location"],
        clarifyingQuestions: ["Which building, floor, and room is this in?"],
      };
    if (mode === "demo" && hasLocation(location))
      analysis = {
        ...analysis,
        missingInformation: [],
        clarifyingQuestions: [],
      };
    const imagePath = image
      ? await storeImage(image.buffer, image.extension)
      : null;
    return Response.json({
      analysis,
      location,
      image: imagePath,
      mode,
      readyForReview:
        hasLocation(location) && analysis.clarifyingQuestions.length === 0,
    });
  } catch (error) {
    return apiError(error);
  }
}
