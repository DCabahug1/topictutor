"use client";

import NavBar from "@/components/NavBar/NavBar";
import React, { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Profile } from "@/lib/models";
import { authService } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import SubjectList from "./components/SubjectList";
import RecentSubject from "./components/RecentSubject";

function page() {
  const [profile, setProfile] = React.useState<Profile | null>(null);

  useEffect(() => {
    refreshUserData();
  }, []);

  const refreshUserData = async () => {
    const { success, data, error } = await authService.getUserAndProfile();

    if (error) {
      console.log(error);
    }

    console.log(data);

    if (success && data) {
      setProfile(data.profile[0]);
    }
  };

  return (
    <div className="flex flex-col h-screen min-h-0">
      <NavBar profile={profile} />
      <div className="flex-1 min-h-0 flex flex-col items-center">
        <div className="flex-1 min-h-0 flex flex-col p-2 gap-2 max-w-6xl w-full">
          <RecentSubject />
          <SubjectList />
        </div>
      </div>
    </div>
  );
}

export default page;
