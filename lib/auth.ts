import { createClient } from "@/utils/supabase/client";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { callbackPath } from "./next-path";
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
const signUpWithEmailAndPasswordServer = async (email: string, password: string, name?: string, origin?: string) => {
  const supabase = await createServerClient();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options:{
      emailRedirectTo: `${origin}/auth/callback${name ? `?name=${name}` : ''}`
    }
  });

  if (authError || !authData.user) {
    return { success: false, error: authError };
  }

  console.log("Added auth data", authData)

  // // Create profile immediately after successful signup
  // try {
  //   const profileResult = await ensureProfileExists(authData.user, supabase, name);
  //   if (!profileResult.success) {
  //     console.error("Failed to create profile during signup:", profileResult.error);
  //     // Don't fail the signup, just log the error
  //   }
  // } catch (error) {
  //   console.error("Error creating profile during signup:", error);
  //   // Don't fail the signup, just log the error
  // }

  console.log("Successfully signed up:", authData);

  return { success: true, data: { authData } };
};

const signInWithEmailAndPassword = async (email: string, password: string) => {
  const supabase = createClient();

  // A guest signed in on this device: their token proves it to the server after the log-in.
  const { data: current } = await supabase.auth.getSession();
  const guestToken = current.session?.user.is_anonymous ? current.session.access_token : null;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, error };
  }

  // Moves the guest's progress into the account. A failure never blocks the log-in.
  await fetch("/api/almanac/adopt", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ guestToken }),
  }).catch(() => undefined);

  return { success: true, data };
};

/** `next` is where to land after signing in, for example the series a guest asked for. */
const signInWithGoogle = async (next?: string | null) => {
  const supabase = createClient();
  const redirectUrl = window.origin + callbackPath({ next });

  console.log("Redirect URL:", redirectUrl);

  const { data: authData, error: authError } =
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          prompt: 'select_account'
        }
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
