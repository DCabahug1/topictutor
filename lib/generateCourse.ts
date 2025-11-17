"use server";
import OpenAI from "openai";
import z from "zod";
import { zodTextFormat } from "openai/helpers/zod";
import { TestResults } from "./models";
import { createTopic } from "./topics";
import { createChapters } from "./chapters";

const topicSchema = z.object({
  title: z.string(),
  description: z.string(),
  category: z.string(),
  chapters_count: z.number(),
});

const chapterSchema = z.object({
  title: z.string(),
  description: z.string(),
  content_paragraphs: z.array(z.string()),
  chapter_number: z.number(),
});

const topicAndChaptersSchema = z.object({
  topic: topicSchema,
  chapters: z.array(chapterSchema),
});

export const generateCourse = async ({
  topic,
  placementTestResults,
}: {
  topic: string;
  placementTestResults: TestResults;
}) => {
  console.log("Generating topic and chapters using GPT-4.1-mini...");
  console.log("Topic:", topic);
  console.log("Placement test results:", placementTestResults);
  const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const response = await openaiClient.responses.parse({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "You generate a personalized course using two inputs: the topic and the placement test result. Rename the topic to a more specific and accurate title if the test indicates a clearer focus. Assign the topic to the most appropriate category, choosing from: Math, Science, Technology, History, Literature, Business, Finance, Arts, Language, Health and Wellness, Other. Create a 10-chapter course. Each chapter must include a clear and concise title (text only, no chapter numbers), a short description, and an array called content_paragraphs containing 3 paragraphs. Each paragraph must have at least 3 complete sentences. This course is for a single user. Prioritize the areas where the placement test shows the greatest weakness. If any paragraph contains fewer than 3 sentences, you must expand it so it meets the requirement.",
        },
        {
          role: "user",
          content: JSON.stringify({ topic, placementTestResults }),
        },
      ],
      text: {
        format: zodTextFormat(topicAndChaptersSchema, "topicAndChaptersData"),
      },
    });

    const topicAndChaptersData = response.output_parsed;

    if (!topicAndChaptersData) {
      return {
        data: null,
        error: {
          message: "Failed to generate topic and chapters",
        },
      };
    }

    const topicData = topicAndChaptersData.topic;
    const chaptersData = topicAndChaptersData.chapters;

    const { data: topicFromDB, error: topicError } = await createTopic(
      topicData
    );

    if (topicError) {
      return {
        data: null,
        error: topicError,
      };
    }

    const { data: chaptersFromDB, error: chaptersError } = await createChapters(
      {
        topic_id: topicFromDB.id,
        chapters: chaptersData,
      }
    );

    if (chaptersError) {
      return {
        data: null,
        error: chaptersError,
      };
    }

    return { data: topicFromDB, error: null };
  } catch (error) {
    console.log("Error generating topic and chapters:", error);
    return {
      data: null,
      error: {
        message:
          error instanceof Error
            ? error.message
            : "Failed to generate topic and chapters",
      },
    };
  }
};
