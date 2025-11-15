"use server";
import { createClient } from "@/utils/supabase/server";
import { Chapter } from "./models";
import { getTopicById } from "./topics";

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

  const { data, error } = await supabase
    .from("chapters")
    .insert(chaptersWithTopicId);

  if (error) {
    console.log("Error creating chapters:", error);
    return { data: null, error };
  }

  return { data: data, error: null };
};

export const getChaptersByTopicId = async (topic_id: string) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("chapters")
    .select("*")
    .eq("topic_id", topic_id)
    .order("chapter_number", { ascending: true });

  if (error) {
    console.log("Error getting chapters:", error);
    return { data: null, error };
  }

  return { data, error: null };
};

export const getChapterById = async (chapter_id: string) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("chapters")
    .select("*")
    .eq("id", chapter_id);

  if (error) {
    console.log("Error getting chapter:", error);
    return { data: null, error };
  }

  return { data, error: null };
};

export const getNeighboringChapters = async (chapter: Chapter) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("chapters")
    .select("*")
    .eq("topic_id", chapter.topic_id)
    .order("chapter_number", { ascending: true });


  if (error) {
    console.log("Error getting chapter:", error);
    return { data: null, error };
  }
  
  const thisChapter = data.find((tempChapter) => tempChapter.id === chapter.id);
  // Get chapter where chapter_number is 1 less than chapter.chapter_number
  const prevChapter = data.find((tempChapter) => tempChapter.chapter_number === chapter.chapter_number - 1);
  
  // Get chapter where chapter_number is 1 more than chapter.chapter_number
  const nextChapter = data.find((tempChapter) => tempChapter.chapter_number === chapter.chapter_number + 1);


  return { data: { prevChapter, nextChapter }, error: null };
};

export const updateTopicProgress = async (topic_id: string, chapter: Chapter) => {
  console.log("Updating topic progress for chapter:", chapter);
  const supabase = await createClient();
  const topic = await getTopicById({ id: topic_id });

  const { data, error } = await supabase
    .from("chapters")
    .update({ completed: true })
    .eq("id", chapter.id);

  if (error) {
    console.log("Error updating chapter:", error);
    return { data: null, error };
  }

  // Increment topic.chapters_completed by 1
  const { data: topicData, error: topicError } = await supabase
    .from("topics")
    .update({ chapters_completed: topic.data?.[0].chapters_completed + 1 })
    .eq("id", topic_id);

  if (topicError) {
    console.log("Error updating topic:", topicError);
    return { data: null, error: topicError };
  }

  return { data: topicData, error: null };
};