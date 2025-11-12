import { createClient } from "@/utils/supabase/client";
import { createProfile, getProfileByEmail } from "./profiles";

const getUserAndProfile = async () => {
  const supabase = createClient();

  const { data: user, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, data: null, error: userError };
  }

  const { data: profile, error: profileError } = await getProfileByEmail(
    user.user?.email!
  );

  if (profileError) {
    return { success: false, data: null, error: profileError };
  }

  return { success: true, data: { user, profile }, error: null };
};

const signUpWithEmailAndPassword = async (email: string, password: string) => {
  const supabase = createClient();

  // Check if email is already in use

  const { data: existingProfileData, error: existingProfileError } =
    await getProfileByEmail(email);

  if (existingProfileError) {
    return { success: false, error: existingProfileError };
  }

  if (existingProfileData[0]) {
    console.log("Email already in use:", existingProfileData);
    return {
      success: false,
      error: {
        message: "Email already in use",
      },
    };
  }

  // Sign up

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError || !authData.user) {
    return { success: false, error: authError };
  }

  // Create profile
  console.log("Creating profile...");

  const { success: profileSuccess, error: profileError } = await createProfile({
    user_id: authData.user.id,
    name: "",
    email,
  });

  if (!profileSuccess) {
    return { success: false, error: profileError };
  }

  console.log("Successfully signed up:", authData);

  return { success: true, data: { authData } };
};

const signInWithEmailAndPassword = async (email: string, password: string) => {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, error };
  }

  return { success: true, data };
};

const signInWithGoogle = async () => {
  const supabase = createClient();

  const { data: authData, error: authError } =
    await supabase.auth.signInWithOAuth({
      provider: "google",
    });

  if (authError) {
    return { success: false, error: authError };
  }

  // Get user data

  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return { success: false, error: userError };
  }

  // Get profile data

  const { data: existingProfileData, error: existingProfileError } =
    await getProfileByEmail(userData.user.email!);

  if (existingProfileError) {
    return { success: false, error: existingProfileError };
  }

  // Create profile if not found

  if (!existingProfileData) {
    const { success: profileSuccess, error: profileError } =
      await createProfile({
        user_id: userData.user.id,
        name: userData.user.user_metadata.name,
        email: userData.user.email!,
      });

    if (!profileSuccess) {
      return { success: false, error: profileError };
    }

    return { success: true, data: { authData } };
  }

  return { success: true, data: { authData } };
};

const signOut = async () => {
  const supabase = createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    return { success: false, error };
  }

  return { success: true };
};

export const authService = {
  signUpWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithGoogle,
  signOut,
  getUserAndProfile,
};
