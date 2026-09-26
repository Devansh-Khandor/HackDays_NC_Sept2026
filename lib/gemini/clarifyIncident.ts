import "server-only";
import { z } from "zod";
import {
  analysisSchema,
  locationSchema,
  placeSchema,
  type Analysis,
  type Location,
} from "@/lib/incidents/schema";
import { generateStructured } from "./client";
import { clarificationPrompt } from "./prompts";
export const clarifyInputSchema = z.object({
  analysis: analysisSchema,
  knownLocation: locationSchema,
  userMessage: z.string().trim().min(3).max(2000),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        text: z.string().max(3000),
      }),
    )
    .max(8),
  mode: z.enum(["live", "demo"]),
});
export async function clarifyIncident(
  analysis: Analysis,
  knownLocation: Location,
  userMessage: string,
  conversationHistory: z.infer<
    typeof clarifyInputSchema
  >["conversationHistory"],
) {
  const result = await generateStructured(
    z.object({
      updatedAnalysis: analysisSchema,
      location: placeSchema,
      readyForReview: z.boolean(),
    }),
    clarificationPrompt,
    [
      {
        text: JSON.stringify({
          analysis,
          knownLocation,
          userMessage,
          conversationHistory: conversationHistory.slice(-6),
        }),
      },
    ],
  );
  // Device coordinates are user-captured facts; the model only edits text fields.
  return {
    ...result,
    location: { ...result.location, coordinates: knownLocation.coordinates },
  };
}
