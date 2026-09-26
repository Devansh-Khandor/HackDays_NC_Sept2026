import "server-only";
import { analysisSchema, type Location } from "@/lib/incidents/schema";
import { generateStructured } from "./client";
import { incidentPrompt } from "./prompts";
export async function analyzeIncident(input: {
  image?: { buffer: Buffer; mimeType: string };
  description: string;
  location: Location;
}) {
  return generateStructured(analysisSchema, incidentPrompt, [
    {
      text: JSON.stringify({
        description: input.description,
        location: input.location,
      }),
    },
    ...(input.image
      ? [
          {
            inlineData: {
              data: input.image.buffer.toString("base64"),
              mimeType: input.image.mimeType,
            },
          },
        ]
      : []),
  ]);
}
