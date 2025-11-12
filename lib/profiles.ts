import { createClient } from "@/utils/supabase/client";
import { createServerClient } from "@supabase/ssr";
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

// Server-side functions for middleware
export const getProfileByEmailServer = async (email: string, supabase: any) => {
  const { data, error } = await supabase.from("profiles").select().eq("email", email);

  if (error) {
    return { success: false, error };
  }

  return { success: true, data };
};

export const createProfileServer = async (profile: Omit<Profile, "id" | "created_at" | "updated_at">, supabase: any) => {
  const { error } = await supabase.from("profiles").insert([profile]);

  if (error) {
    console.log("Error creating profile:", error);
    return { success: false, error };
  }

  return { success: true };
};

export const ensureProfileExists = async (user: any, supabase: any) => {
  if (!user?.email) {
    return { success: false, error: { message: "No user email found" } };
  }

  // Check if profile exists
  const { success: getSuccess, data: existingProfile, error: getError } = 
    await getProfileByEmailServer(user.email, supabase);

  if (!getSuccess) {
    return { success: false, error: getError };
  }

  // If profile exists, return success
  if (existingProfile && existingProfile.length > 0) {
    return { success: true, profileExists: true };
  }

  // Create profile if it doesn't exist
  const profileData = {
    user_id: user.id,
    name: user.user_metadata?.name || user.user_metadata?.full_name || "",
    email: user.email,
    image_url: user.user_metadata?.avatar_url || user.user_metadata?.picture
  };

  const { success: createSuccess, error: createError } = 
    await createProfileServer(profileData, supabase);

  if (!createSuccess) {
    return { success: false, error: createError };
  }

  return { success: true, profileExists: false, created: true };
};