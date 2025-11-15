import { Topic } from "./models";
import { createClient } from "@/utils/supabase/client";

// Topic Retrieval Process

const getTopics = async () => {
  const supabase = createClient();

  const { data, error } = await supabase.from("topics").select("*");

  if (error) {
    console.log("Error getting topics:", error);
    return { success: false, error };
  }

  return { success: true, data };
};

// Checks title, category, description
const getTopicsByQuery = async ({ query }: { query: string }) => {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("topics")
    .select("*")
    .or(
      `title.ilike.%${query}%,category.ilike.%${query}%,description.ilike.%${query}%`
    );

  if (error) {
    console.log("Error getting topics:", error);
    return { success: false, error };
  }

  return { success: true, data };
};

export const topicService = {
  getTopics,
  getTopicsByQuery,
};
