import { createClient } from "@/utils/supabase/client";

const createChapters = async (subject: { name: string; category: string; description: string }) => {
  const supabase = createClient();

  const { data, error } = await supabase.from("chapters").insert([subject]);

  if (error) {
    console.log("Error creating subject:", error);
    return { success: false, error };
  }

  return { success: true, data };
};
