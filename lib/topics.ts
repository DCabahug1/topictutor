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

export const getStreak = async () => {
  const supabase = await createClient();
  
  // Get all topics ordered by updated_at descending
  const { data: topics, error } = await supabase
    .from("topics")
    .select("updated_at, chapters_completed, chapters_count")
    .order("updated_at", { ascending: false });

  if (error) {
    console.log("Error getting topics for streak:", error);
    return { data: 0, error };
  }

  if (!topics || topics.length === 0) {
    return { data: 0, error: null };
  }

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check each day starting from today going backwards
  for (let i = 0; i < 365; i++) { // Max 365 days to prevent infinite loop
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    
    const startOfDay = new Date(checkDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(checkDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Check if any topics were completed on this day
    const completedOnDay = topics.filter(topic => {
      const updatedAt = new Date(topic.updated_at);
      return (
        updatedAt >= startOfDay &&
        updatedAt <= endOfDay &&
        topic.chapters_completed === topic.chapters_count
      );
    });

    if (completedOnDay.length > 0) {
      streak++;
    } else {
      // If no activity on this day, break the streak
      // Exception: if it's today and we haven't found any activity yet, continue checking yesterday
      if (i === 0) {
        continue;
      }
      break;
    }
  }

  return { data: streak, error: null };
};
