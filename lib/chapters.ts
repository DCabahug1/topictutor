"use server"
import { createClient } from "@/utils/supabase/server";

export const createChapters = async ({
  topic_id,
  chapters,
}: {
  topic_id: string;
  chapters: {
    title: string;
    description: string;
    content_paragraphs: string[];
  }[];
}) => {
  const supabase = await createClient();

  const chaptersWithTopicId = chapters.map((chapter) => ({
    ...chapter,
    topic_id,
  }));

  const { data, error } = await supabase.from("chapters").insert(chaptersWithTopicId);

  if (error) {
    console.log("Error creating chapters:", error);
    return { data: null, error };
  }

  return { data: data, error: null };
};

export const getChaptersByTopicId = async (topic_id: string) => {
  const supabase = await createClient();

  const { data, error } = await supabase.from("chapters").select("*").eq("topic_id", topic_id);

  if (error) {
    console.log("Error getting chapters:", error);
    return { data: null, error };
  }

  return { data, error: null };
};
