import { z } from "zod";

export const ViewingContextSchema = z.object({
  platform: z.enum(["netflix", "prime"]),
  contentId: z.string().min(1).optional(),
  title: z.string().min(1).max(300).optional(),
  season: z.number().int().positive().optional(),
  episode: z.number().int().positive().optional(),
  episodeTitle: z.string().min(1).max(300).optional(),
  currentTimeSeconds: z.number().finite().min(0),
  durationSeconds: z.number().finite().positive().optional(),
  url: z.string().url(),
  locale: z.string().min(2).max(35)
}).refine((context) => context.contentId || context.title, {
  message: "A content identifier or title is required."
});

export const QuizRequestSchema = z.object({
  context: ViewingContextSchema,
  spoilerLevel: z.enum(["light", "moderate", "advanced"]).default("light")
});

export const QuizSchema = z.object({
  hint: z.string().min(1).max(420).describe("A short warning that names the kind of future event being spoiled."),
  question: z.string().min(1).max(420).describe("A question that explicitly reveals part of a canonical future plot event and asks for the missing fact."),
  choices: z.array(z.string().min(1).max(180)).length(3),
  correctChoiceIndex: z.number().int().min(0).max(2),
  reveal: z.string().min(1).max(420).describe("One or two sentences that restate only the canonical spoiled event and the correct answer, with no secondary plot details."),
  viewerProgressSeconds: z.number().int().nonnegative()
});

export type QuizRequest = z.infer<typeof QuizRequestSchema>;
export type Quiz = z.infer<typeof QuizSchema>;
