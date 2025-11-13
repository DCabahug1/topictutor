import { Subject } from "./models";
import { createClient } from "@/utils/supabase/client";





// Subject Retrieval Process

const getSubjects = async () => {
  const supabase = createClient();

  const { data, error } = await supabase.from("subjects").select("*");

  if (error) {
    console.log("Error getting subjects:", error);
    return { success: false, error };
  }

  return { success: true, data };
};

// Checks title, category, description
const getSubjectsByQuery = async ({ query }: { query: string }) => {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("subjects")
    .select("*")
    .or(
      `title.ilike.%${query}%,category.ilike.%${query}%,description.ilike.%${query}%`
    );

  if (error) {
    console.log("Error getting subjects:", error);
    return { success: false, error };
  }

  return { success: true, data };
};

export const subjectService = {
  getSubjects,
  getSubjectsByQuery,
};
