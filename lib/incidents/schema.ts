import { z } from "zod";
export const categories = [
  "plumbing",
  "electrical",
  "hvac",
  "furniture",
  "building",
  "elevator",
  "technology",
  "network",
  "parking",
  "accessibility",
  "sanitation",
  "grounds",
  "safety",
  "other",
] as const;
export const severities = [
  "routine",
  "priority",
  "urgent",
  "emergency",
] as const;
export const departments = [
  "Facilities",
  "University Housing",
  "Transportation",
  "OIT",
  "CampusFix Review",
] as const;
export const statuses = [
  "reported",
  "acknowledged",
  "assigned",
  "in_progress",
  "resolved",
] as const;
const text = z.string().trim().min(1).max(3000);
const short = z.string().trim().max(250);
export const locationSchema = z.object({
  building: short,
  floor: short,
  room: short,
  locationDescription: short,
});
export const analysisSchema = z.object({
  issueTitle: text.max(180),
  detectedObject: short.nullable(),
  category: z.enum(categories),
  subcategory: short,
  summary: text,
  visibleEvidence: z.array(text).max(12),
  hazards: z.array(text).max(12),
  severity: z.enum(severities),
  severityReason: text,
  confidence: z.number().min(0).max(1),
  missingInformation: z.array(short).max(6),
  clarifyingQuestions: z.array(text).max(4),
  suggestedDepartment: z.enum(departments),
  routingReason: text,
  immediateSafetyMessage: z.string().max(2000).nullable(),
});
export const imagePathSchema = z
  .string()
  .regex(/^\/api\/uploads\/[a-f0-9-]{36}\.(jpg|png|webp)$/)
  .nullable();
export const draftSchema = z.object({
  analysis: analysisSchema,
  location: locationSchema,
  image: imagePathSchema,
  mode: z.enum(["live", "demo"]),
});
export const hasLocation = (l: z.infer<typeof locationSchema>) =>
  l.building.trim().length >= 3 || l.locationDescription.trim().length >= 5;
export const submissionSchema = draftSchema
  .extend({ userApproved: z.literal(true), submissionKey: z.string().uuid() })
  .refine((d) => hasLocation(d.location), {
    message: "Add a building or a usable campus location.",
    path: ["location"],
  });
export const duplicateSchema = z.object({
  isLikelyDuplicate: z.boolean(),
  candidateIncidentId: z.string().nullable(),
  similarityScore: z.number().min(0).max(1),
  reason: z.string().max(1500),
});
export const incidentSchema = draftSchema.extend({
  id: z.string().uuid(),
  displayId: z.string(),
  department: z.enum(departments),
  status: z.enum(statuses),
  confirmations: z.number().int().min(0),
  confirmationKeys: z.array(z.string()),
  submissionKey: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  timeline: z.array(z.object({ status: z.enum(statuses), at: z.string() })),
  seeded: z.boolean(),
});
export type Analysis = z.infer<typeof analysisSchema>;
export type Location = z.infer<typeof locationSchema>;
export type Draft = z.infer<typeof draftSchema>;
export type Incident = z.infer<typeof incidentSchema>;
export type Status = (typeof statuses)[number];
export type Department = (typeof departments)[number];
export const emptyLocation: Location = {
  building: "",
  floor: "",
  room: "",
  locationDescription: "",
};
