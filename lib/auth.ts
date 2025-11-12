import { createClient } from "@/utils/supabase/client";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { getProfileByEmail, ensureProfileExists } from "./profiles";

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

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError || !authData.user) {
    return { success: false, error: authError };
  }

  console.log("Successfully signed up:", authData);

  return { success: true, data: { authData } };
};

// Server-side signup function that creates profile
const signUpWithEmailAndPasswordServer = async (email: string, password: string) => {
  const supabase = await createServerClient();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError || !authData.user) {
    return { success: false, error: authError };
  }

  // Create profile immediately after successful signup
  try {
    const profileResult = await ensureProfileExists(authData.user, supabase);
    if (!profileResult.success) {
      console.error("Failed to create profile during signup:", profileResult.error);
      // Don't fail the signup, just log the error
    }
  } catch (error) {
    console.error("Error creating profile during signup:", error);
    // Don't fail the signup, just log the error
  }

  console.log("Successfully signed up and created profile:", authData);

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
  const redirectUrl = window.origin + "/auth/callback";

  console.log("Redirect URL:", redirectUrl);

  const { data: authData, error: authError } =
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {

        redirectTo: redirectUrl,
      }
    });

  if (authError) {
    return { success: false, error: authError };
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
  signUpWithEmailAndPasswordServer,
  signInWithEmailAndPassword,
  signInWithGoogle,
  signOut,
  getUserAndProfile,
};
