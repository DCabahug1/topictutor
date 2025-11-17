"use server";
import { Topic } from "./models";
import { createClient } from "@/utils/supabase/server";

export const createTopic = async ({
  title,
  category,
  description,
  chapters_count,
}: {
  title: string;
  category: string;
  description: string;
  chapters_count: number;
}) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("topics")
    .insert([
      {
        title,
        category,
        description,
        chapters_count,
        updated_at: new Date().toISOString(),
      },
    ])
    .select("*");

  if (error) {
    console.log("Error creating topic:", error);
    return { data: null, error };
  }

  if (data && data.length > 0) {
    return { data: data[0], error: null };
  }

  return { data: null, error: null };
};

// Topic Retrieval Process

export const getTopics = async () => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("topics")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    console.log("Error getting topics:", error);
    return { data: null, error };
  }

  return { data, error: null };
};

export const getTopicById = async ({ id }: { id: string }) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("topics")
    .select("*")
    .eq("id", id);

  if (error) {
    console.log("Error getting topic:", error);
    return { data: null, error };
  }

  return { data, error: null };
};

// Checks title, category, description
export const getTopicsByQuery = async ({ query }: { query: string }) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("topics")
    .select("*")
    .or(
      `title.ilike.%${query}%,category.ilike.%${query}%,description.ilike.%${query}%`
    )
    .order("updated_at", { ascending: false });

  if (error) {
    console.log("Error getting topics:", error);
    return { data: null, error };
  }

  return { data, error: null };
};

export const getLatestTopic = async () => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("topics")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1);

  if (error) {
    console.log("Error getting latest topic:", error);
    return { data: null, error };
  }

  return { data, error: null };
};

// Data
export const getTopicsUpdatedAtDateAndCompleted = async ({
  date,
}: {
  date: Date;
}) => {
  const supabase = await createClient();

  // Create start and end of the day for the given date
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from("topics")
    .select("*")
    .gte("updated_at", startOfDay.toISOString())
    .lte("updated_at", endOfDay.toISOString());

  if (error) {
    console.log("Error getting topics updated at date:", error);
    return { data: null, error };
  }

  // Filter client-side for completed topics
  const completedTopics =
    data?.filter(
      (topic) => topic.chapters_completed === topic.chapters_count
    ) || [];

  return { data: completedTopics, error: null };
};
