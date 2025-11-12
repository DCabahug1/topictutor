"use server"

import { z } from "zod";
import { OpenAI } from "openai";
import { zodTextFormat } from "openai/helpers/zod";

const subjectSchema = z.object({
  description: z.string(),
  category: z.string(),
});

export const generateSubjectInfo = async (subject: { title: string }) => {
  const apiKey = process.env.OPENAI_API_KEY;
  console.log(apiKey);
  const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const response = await openaiClient.responses.parse({
      model: "gpt-5-nano",
      input: [
      {
        role: 'system',
        content: 'You are a helpful assistant that generates information about a course. You are to generate a description and category for the course. For the category, pick the best category from the list (Choose from: Mathematics & Logic, Science & Engineering, Technology & Computing, Arts & Design, Humanities & Culture, Social Sciences, Business & Economics, Health & Medicine, Education & Communication, Personal Development & Life Skills). For the description, use a short description of what the course covers (1-2 sentences, e.g. "This course covers the basics of calculus and its applications in real life.").'
      },
      {
        role: 'user',
        content: subject.title
      }
    ],
    text: {
      format: zodTextFormat(subjectSchema, "subjectData"),
    },
  });

  const subjectData = response.output_parsed;
  
  return { data: subjectData, error: null };
  } catch (error) {
    return { 
      data: null, 
      error: { 
        message: error instanceof Error ? error.message : 'Failed to generate subject information' 
      } 
    };
  }
};