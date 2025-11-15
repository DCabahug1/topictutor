import { createClient } from "@/utils/supabase/client";

const createChapters = async (topic: { name: string; category: string; description: string }) => {
  const supabase = createClient();

  const { data, error } = await supabase.from("chapters").insert([topic]);

  if (error) {
    console.log("Error creating topic:", error);
    return { success: false, error };
  }

  return { success: true, data };
};
