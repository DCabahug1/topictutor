"use client";
import React, { useEffect, useState, Suspense } from "react";
import NavBar from "@/components/NavBar/NavBar";
import { createClient } from "@/utils/supabase/client";
import { Profile } from "@/lib/models";
import { Loader2 } from "lucide-react";
import PlacementTestForm from "./components/PlacementTestForm";

function page() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const getProfile = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.log(error);
      }
      if (data) {
        setProfile(data.user?.user_metadata as Profile);
      }
    };
    getProfile();
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <NavBar profile={profile} />
      <div className="flex-1 min-h-0 flex flex-col items-center p-6 gap-2 overflow-y-auto">
        <Suspense
          fallback={
            <div className="flex-1 min-h-0 flex items-center justify-center flex-col gap-2">
              <Loader2 className="w-8 h-8 animate-spin" />
              <div className="flex flex-col items-center justify-center">
                <p className="text-center font-bold">Loading...</p>
                <p className="text-center text-muted-foreground text-xs">
                  Please wait
                </p>
              </div>
            </div>
          }
        >
          <PlacementTestForm />
        </Suspense>
      </div>
    </div>
  );
}

export default page;
