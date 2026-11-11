"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { authService } from "@/lib/auth";
import { Profile } from "@/lib/models";
import NavBar from "@/components/NavBar/NavBar";
import Analytics from "./components/Analytics";
import ProfileCard from "./components/ProfileCard";

function page() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);

  const fetchProfile = async () => {
    const { success, data, error } = await authService.getUserAndProfile();

    if (error) {
      console.error("Error fetching profile:", error);
      return;
    }

    if (success) {
      setProfile(data?.profile[0]);
    }
  };

  useEffect(() => {

    fetchProfile();
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <NavBar profile={profile} />
      <div className="flex-1 min-h-0 p-4 flex justify-center overflow-y-auto">
        <div className="flex flex-col h-min w-full max-w-4xl gap-4">
          <Analytics />
          {profile && <ProfileCard profile={profile} fetchProfile={fetchProfile} />}
        </div>
      </div>
    </div>
  );
}

export default page;
