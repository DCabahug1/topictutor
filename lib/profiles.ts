import { createClient } from "@/utils/supabase/client";
import { Profile } from "@/lib/models";

export const createProfile = async (
  profile: Omit<Profile, "id" | "created_at" | "updated_at">
) => {
  const supabase = createClient();

  const { error } = await supabase.from("profiles").insert([profile]);

  if (error) {
    console.log("Error creating profile:", error);
    return { success: false, error };
  }

  return { success: true };
};

export const updateProfile = async (profile_id: string, name: string) => {
  const supabase = createClient();

  const { error } = await supabase.from("profiles").update({ name }).eq("id", profile_id);

  if (error) {
    console.log("Error updating profile:", error);
    return { success: false, error };
  }

  return { success: true };
};

export const uploadProfileImage = async (image: File, profile_id: string, user_id: string) => {
  const supabase = createClient();
  const bucketName = "profile_files";
  const folderPath = user_id + "/avatars";

  // List all existing files for this profile, ordered by creation date
  // Note: Try 'created_at' first, fallback to 'updated_at' if needed
  const { data: existingFiles, error: listError } = await supabase.storage
    .from(bucketName)
    .list(folderPath, {
      search: `${profile_id}_avatar`,
      sortBy: { column: "created_at", order: "desc" }
    });

  if (listError) {
    console.log("Bucket Name:", bucketName);
    console.log("Folder Path:", folderPath);
    console.log("Error listing existing files:", listError);
    return { success: false, error: listError };
  }

  // Get the latest version number from the most recent file
  let latestVersion = 0;
  if (existingFiles && existingFiles.length > 0) {
    const latestFile = existingFiles[0]; // First file is the most recent due to desc order
    
    // Extract version number from the latest file
    const match = latestFile.name.match(new RegExp(`${profile_id}_avatar_(\\d+)$`));
    if (match) {
      latestVersion = parseInt(match[1]);
    } else if (latestFile.name === `${profile_id}_avatar`) {
      // Handle unversioned file (treat as version 0)
      latestVersion = 0;
    }
  }

  // Create new filename with incremented version
  const newVersion = latestVersion + 1;
  const newFileName = `${profile_id}_avatar_${newVersion}`;

  // Upload new versioned file
  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(`${folderPath}/${newFileName}`, image);

  if (uploadError) {
    console.log("Error uploading profile image:", uploadError);
    return { success: false, error: uploadError };
  }

  // Get URL for the new file
  const { data: { publicUrl } } = await supabase.storage
    .from(bucketName)
    .getPublicUrl(`${folderPath}/${newFileName}`);

  // Update profile with new image URL
  const { data, error: updateError } = await supabase
    .from("profiles")
    .update({ image_url: publicUrl })
    .eq("id", profile_id);

  if (updateError) {
    console.log("Error updating profile image:", updateError);
    return { success: false, error: updateError };
  }

  return { success: true, data, version: newVersion };
};


export const getProfileByEmail = async (email: string) => {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select()
    .eq("email", email);

  if (error) {
    return { success: false, error };
  }

  return { success: true, data };
};

// Server-side functions for middleware
export const getProfileByEmailServer = async (email: string, supabase: any) => {
  const { data, error } = await supabase
    .from("profiles")
    .select()
    .eq("email", email);

  if (error) {
    return { success: false, error };
  }

  return { success: true, data };
};

export const createProfileServer = async (
  profile: Omit<Profile, "id" | "created_at" | "updated_at">,
  supabase: any
) => {
  const { error } = await supabase.from("profiles").insert([profile]);

  if (error) {
    console.log("Error creating profile:", error);
    return { success: false, error };
  }

  return { success: true };
};

export const ensureProfileExists = async (user: any, supabase: any, name?: string | null) => {
  if (!user?.email) {
    return { success: false, error: { message: "No user email found" } };
  }

  // Check if profile exists
  const {
    success: getSuccess,
    data: existingProfile,
    error: getError,
  } = await getProfileByEmailServer(user.email, supabase);

  if (!getSuccess) {
    return { success: false, error: getError };
  }

  // If profile exists, return success
  if (existingProfile && existingProfile.length > 0) {
    console.log("Profile exists", existingProfile);
    return { success: true, profileExists: true };
  }

  // Create profile if it doesn't exist
  const profileData = {
    user_id: user.id,
    name: user.user_metadata?.name || user.user_metadata?.full_name || name || "",
    email: user.email,
    image_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
  };

  const { success: createSuccess, error: createError } =
    await createProfileServer(profileData, supabase);

  console.log("Profile created", createSuccess);

  if (!createSuccess) {
    return { success: false, error: createError };
  }

  return { success: true, profileExists: false, created: true };
};
