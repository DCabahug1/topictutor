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
  console.log("Generating topic and chapters...");
  const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const response = await openaiClient.responses.parse({
      model: "gpt-4o-mini",
      input: [
        {
          role: "system",
          content:
            "You generate a personalized course using two inputs, the topic and the placement test result.Rename the topic to a more specific title if the test suggests a clearer focus. Assign the topic to the most suitable category, choosing from: Math, Science, History, English, Computer Science, Business, Art, Music, Physical Education, Other. Create a 10-chapter course. For each chapter, the title should be clear and concise (Title text only, no need for Chapter #). The description should also be clear and consise (Such as but not limited to: This chapter covers the topic of... ). This course is for a single user. Each chapter must contain 5 paragraphs (3 sentences per paragraph) of clear instructional content. content_paragraphs should be an array of 5 paragraphs. Prioritize the areas where the student shows the greatest weakness based on the placement test.",
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
