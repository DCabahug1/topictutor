"use server";
import { z } from "zod";
import { generateStructured } from "./claude";
import { Chapter, TestResults } from "./models";

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

const topicTestSchema = z.object({
  questions: z.array(
    z.object({
      prompt: z.string(),
      answerOptions: z.array(
        z.object({ answer: z.string(), isCorrect: z.boolean() })
      ),
    })
  ),
});

export const generateTopicTest = async (Topic: string, chapters: Chapter[], placementTestResults: TestResults) => {
  console.log("Generating final test using Claude...");

  try {
    const topicTestData = await generateStructured({
      system:
        "You are a helpful assistant that generates a final test for a course. You are to generate a final test for the course. The final test should have 10 multiple choice questions with 4 UNIQUE options each, one correct answer. The questions should be limited to the contents of the chapters provided. Analyze the question format, phrasing style, answer option structure, and difficulty progression from the provided placement test results, then apply the same patterns to create a consistent testing experience for the final test.",
      user: JSON.stringify({
        Topic,
        chapters,
        placementTestResults,
      }),
      schema: topicTestSchema,
    });
    console.log("Topic test generated:", topicTestData);

    return { data: topicTestData, error: null };
  } catch (error) {
    console.log("Error generating topic test:", error);
    return {
      data: null,
      error: {
        message:
          error instanceof Error
            ? error.message
            : "Failed to generate topic test",
      },
    };
  }
};
