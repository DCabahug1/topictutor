"use server";
import { z } from "zod";
import { OpenAI } from "openai";
import { zodTextFormat } from "openai/helpers/zod";

// 1. Generate Placement Test
// 2. Generate Topic:
//    a) Generate Topic info (title, description, category)
//    b) Generate 10 chapters
//    c) Generate chapter content

// export interface Question {
//   prompt: string;
//   answerOptions: {
//     answer: string;
//     isCorrect: boolean;
//   }[];
// }

// export interface PlacementTest {
//   questions: Question[];
// }

const placementTestSchema = z.object({
  questions: z.array(
    z.object({
      prompt: z.string(),
      answerOptions: z.array(
        z.object({ answer: z.string(), isCorrect: z.boolean() })
      ),
    })
  ),
});

export const generatePlacementTest = async (Topic: string) => {
  console.log("Generating placement test using GPT-4.1-mini...");
  const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const response = await openaiClient.responses.parse({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "You are a helpful assistant that generates a placement test for a course. You are to generate a placement test for the course. The placement test should have 5 multiple choice questions with 4 UNIQUE options each, one correct answer. The questions should be related to the course, with a mix of easy, medium, and hard questions.",
        },
        {
          role: "user",
          content: Topic,
        },
      ],
      text: {
        format: zodTextFormat(placementTestSchema, "placementTestData"),
      },
    });

    const placementTestData = response.output_parsed;
    console.log("Placement test generated:", placementTestData);

    return { data: placementTestData, error: null };
  } catch (error) {
    console.log("Error generating placement test:", error);
    return {
      data: null,
      error: {
        message:
          error instanceof Error
            ? error.message
            : "Failed to generate placement test",
      },
    };
  }
};
