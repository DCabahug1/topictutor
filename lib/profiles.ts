import { createClient } from "@/utils/supabase/client";
import { Profile } from "@/lib/models";

export const createProfile = async (profile: Omit<Profile, "id" | "created_at" | "updated_at">) => {
  const supabase = createClient();

  const { error } = await supabase.from("profiles").insert([profile]);

  if (error) {
    console.log("Error creating profile:", error);
    return { success: false, error };
  }

  return { success: true };
};

export const getProfileByEmail = async (email: string) => {
  const supabase = createClient();

  const { data, error } = await supabase.from("profiles").select().eq("email", email);

  if (error) {
    return { success: false, error };
  }

  return { success: true, data };
};