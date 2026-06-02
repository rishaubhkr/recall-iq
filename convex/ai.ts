import { action } from "./_generated/server";
import { v } from "convex/values";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export const generateCardsFromText = action({
  args: {
    text: v.string(),
    subtopicId: v.id("subtopics"),
  },
  handler: async (ctx, args) => {
    if (!genAI) {
      throw new Error("GEMINI_API_KEY is not set in environment variables.");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });

    const prompt = `
      You are an expert JEE (Joint Entrance Examination) professor and mnemonic specialist.
      Generate 4-6 high-quality cards based on: "${args.text}"

      Diversify cognitive pathways by using these 11 types:
      - "flashcard": Standard retrieval.
      - "mcq": Selection among 4 options.
      - "cloze": Fill-in-the-blank [[blank]].
      - "elaborative": Why-based interrogation.
      - "numerical": Physics/Math calculations.
      - "assertion_reason": Causal clarity (A-E keys).
      - "error_spotting": Debugging multi-line derivations.
      - "matrix_match": Relational pairing (Column A to B).
      - "sequencing": Ordering by magnitude/time.
      - "concept_interleave": Connecting two isolated terms.
      - "image_occlusion": Visual label recall (provide image masking boxes).
      - "true_false_justify": Binary choice + written reasoning.

      Output ONLY a JSON array of objects following this schema:
      {
        "type": string,
        "front": string, // Question face (Markdown+KaTeX)
        "back": string,  // Answer/Explanation (Markdown+KaTeX)
        "options"?: string[], // For mcq/multi_select/sequencing
        "correctOption"?: number, // For mcq
        "correctOptions"?: number[], // For multi_select
        "clozeTemplate"?: string, // For cloze
        "whyPrompt"?: string,
        "tags": string[],
        "advancedMetadata"?: {
          "numericalAnswer"?: number,
          "assertion"?: string,
          "reason"?: string,
          "correctAssertionReasonKey"?: "A" | "B" | "C" | "D" | "E",
          "matrixA"?: string[],
          "matrixB"?: string[],
          "matrixMapping"?: Record<number, number[]>, // e.g. {0: [1, 2]}
          "sequenceOrder"?: number[], // Indices in correct order
          "justification"?: string,
          "errorLine"?: number,
          "imageUrl"?: string, // For image_occlusion
          "boxes"?: Array<{x: number, y: number, w: number, h: number, label: string}>
        }
      }

      CRITICAL: Use KaTeX ($..$ or $$..$$) for formulas. Diversify the types aggressively.
    `;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const jsonText = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
      
      try {
        const cards = JSON.parse(jsonText);
        return cards;
      } catch (parseErr) {
        console.error("Failed to parse JSON:", jsonText);
        throw new Error("AI returned malformed JSON. Please try again.");
      }
    } catch (error: any) {
      console.error("Gemini AI error:", error);
      // Return the specific error message to help debugging
      throw new Error(`AI Error: ${error.message || "Unknown error"}`);
    }
  },
});
