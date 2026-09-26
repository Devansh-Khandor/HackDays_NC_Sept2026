import "server-only";
import { GoogleGenAI, ThinkingLevel, type Part } from "@google/genai";
import { z } from "zod";
import { AppError } from "@/lib/server/errors";
let client: GoogleGenAI | undefined;
export function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY)
    throw new AppError(
      "Gemini API key is not configured. Add GEMINI_API_KEY to .env.local and restart the development server. You can also try Demo Mode.",
      503,
    );
  return (client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }));
}
export const getModel = () => process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
export async function generateStructured<T extends z.ZodType>(
  schema: T,
  system: string,
  parts: Part[],
): Promise<z.infer<T>> {
  const ai = getGeminiClient();
  let correction = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    let response;
    try {
      response = await ai.models.generateContent({
        model: getModel(),
        contents: [
          {
            role: "user",
            parts: [...parts, ...(correction ? [{ text: correction }] : [])],
          },
        ],
        config: {
          systemInstruction: system,
          responseMimeType: "application/json",
          responseJsonSchema: z.toJSONSchema(schema),
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW,
            includeThoughts: false,
          },
          abortSignal: AbortSignal.timeout(40_000),
        },
      });
    } catch (error) {
      const failure = error as {
        status?: number;
        name?: string;
        message?: string;
        cause?: { code?: string };
      };
      const status = failure.status;
      // One bounded retry for temporary provider capacity failures, never for credentials/quota.
      if ((status === 503 || status === 500) && attempt === 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }
      if (status === 503 || status === 500)
        throw new AppError(
          "Google Gemini is temporarily overloaded. We retried once, but it is still unavailable. Please try again in a minute, or use Demo Mode. This is not a subscription or API-key error.",
          503,
        );
      if (status === 429)
        throw new AppError(
          "Gemini's API rate limit or quota has been reached. Check your project's limits in Google AI Studio, wait and retry, or use Demo Mode. Google AI Plus app limits are separate from API limits.",
          429,
        );
      if (
        status === 401 ||
        status === 403 ||
        /API_KEY_INVALID|API key not valid|API key expired/i.test(
          failure.message ?? "",
        )
      )
        throw new AppError(
          "Google rejected the API credentials or project permissions. Check the Gemini API key and its restrictions in Google AI Studio, then restart the server.",
          502,
        );
      if (status === 404)
        throw new AppError(
          "The configured Gemini model is unavailable to this API project. Check GEMINI_MODEL and the models available in Google AI Studio.",
          502,
        );
      if (failure.name === "TimeoutError" || failure.name === "AbortError")
        throw new AppError(
          "Gemini took too long to respond. Please try again, or use Demo Mode.",
          504,
        );
      if (failure.name === "TypeError" || failure.cause?.code)
        throw new AppError(
          "The CampusFix server could not connect to Google Gemini. Check the server's internet connection and try again.",
          502,
        );
      if (status === 400)
        throw new AppError(
          "Google rejected the analysis request. The image or model settings may be unsupported. Try a different JPG, PNG, or WebP photo.",
          400,
        );
      // Never return raw SDK errors: they can include request bodies or credentials.
      throw new AppError(
        "Gemini could not complete the analysis right now. Please try again, or use Demo Mode.",
        502,
      );
    }
    try {
      return schema.parse(JSON.parse(response.text ?? ""));
    } catch {
      correction =
        "Your previous output did not pass schema validation. Return a complete JSON object matching every required field and constraint. Do not include markdown.";
    }
  }
  throw new AppError(
    "Gemini returned an incomplete report. Please try again.",
    502,
  );
}
