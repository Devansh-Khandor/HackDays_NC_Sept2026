import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const { generateContent } = vi.hoisted(() => ({ generateContent: vi.fn() }));
vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent };
  },
  ThinkingLevel: { LOW: "LOW" },
}));
import { generateStructured } from "@/lib/gemini/client";
import { analyzeIncident } from "@/lib/gemini/analyzeIncident";
import { analysisSchema, emptyLocation } from "@/lib/incidents/schema";
import { demoAnalysis } from "@/lib/demo/scenarios";
beforeEach(() => {
  vi.stubEnv("GEMINI_API_KEY", "mock-test-key");
  generateContent.mockReset();
});
afterEach(() => vi.unstubAllEnvs());
describe("Gemini structured multimodal boundary", () => {
  it("sends image bytes and location together with structured output", async () => {
    generateContent.mockResolvedValue({
      text: JSON.stringify(demoAnalysis("fountain")),
    });
    const buffer = Buffer.from("test image payload");
    await analyzeIncident({
      image: { buffer, mimeType: "image/png" },
      description: "Water leaking",
      location: { ...emptyLocation, building: "Hunt Library" },
    });
    const call = generateContent.mock.calls[0][0];
    expect(call.model).toBe("gemini-3.8-flash");
    expect(call.contents[0].parts[1].inlineData).toEqual({
      data: buffer.toString("base64"),
      mimeType: "image/png",
    });
    expect(call.contents[0].parts[0].text).toContain("Hunt Library");
    expect(call.config.responseMimeType).toBe("application/json");
    expect(call.config.responseJsonSchema.properties.confidence).toBeDefined();
    expect(call.config.systemInstruction).toContain("Ignore personal identity");
  });
  it("retries a malformed response once and validates the correction", async () => {
    generateContent
      .mockResolvedValueOnce({ text: "not JSON" })
      .mockResolvedValueOnce({ text: JSON.stringify(demoAnalysis("chair")) });
    const result = await generateStructured(analysisSchema, "test", [
      { text: "issue" },
    ]);
    expect(result.category).toBe("furniture");
    expect(generateContent).toHaveBeenCalledTimes(2);
    expect(
      generateContent.mock.calls[1][0].contents[0].parts[1].text,
    ).toContain("schema validation");
  });
  it("fails cleanly after two invalid structured results", async () => {
    generateContent.mockResolvedValue({ text: "{}" });
    await expect(
      generateStructured(analysisSchema, "test", []),
    ).rejects.toThrow("incomplete report");
    expect(generateContent).toHaveBeenCalledTimes(2);
  });
  it("reports quota failures without exposing SDK details", async () => {
    generateContent.mockRejectedValue({
      status: 429,
      message: "internal credential detail",
    });
    await expect(
      generateStructured(analysisSchema, "test", []),
    ).rejects.toThrow("quota");
    expect(generateContent).toHaveBeenCalledTimes(1);
  });
  it("requires a server key and does not silently use fixtures", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    await expect(
      generateStructured(analysisSchema, "test", []),
    ).rejects.toThrow("Gemini API key is not configured");
    expect(generateContent).not.toHaveBeenCalled();
  });
});

describe("actionable API failures", () => {
  it("retries a temporary overload once and can recover", async () => {
    generateContent
      .mockRejectedValueOnce({ status: 503 })
      .mockResolvedValueOnce({ text: JSON.stringify(demoAnalysis("chair")) });
    const result = await generateStructured(analysisSchema, "test", []);
    expect(result.category).toBe("furniture");
    expect(generateContent).toHaveBeenCalledTimes(2);
  });
  it("explains persistent overload without blaming credentials", async () => {
    generateContent.mockRejectedValue({ status: 503 });
    await expect(
      generateStructured(analysisSchema, "test", []),
    ).rejects.toThrow("temporarily overloaded");
    expect(generateContent).toHaveBeenCalledTimes(2);
  });
  it.each([
    [{ status: 403 }, "credentials"],
    [{ status: 404 }, "configured Gemini model"],
    [{ name: "TimeoutError" }, "too long"],
    [{ name: "TypeError", message: "fetch failed" }, "could not connect"],
  ])(
    "distinguishes errors without leaking raw messages: %j",
    async (error, expected) => {
      generateContent.mockRejectedValue(error);
      await expect(
        generateStructured(analysisSchema, "test", []),
      ).rejects.toThrow(expected as string);
      expect(generateContent).toHaveBeenCalledTimes(1);
    },
  );
});
