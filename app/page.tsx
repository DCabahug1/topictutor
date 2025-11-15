"use client";

import React, { useEffect } from "react";
import { motion } from "motion/react";
import NavBar from "@/components/NavBar/NavBar";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { authService } from "@/lib/auth";
import { Profile } from "@/lib/models";

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
    <div className="flex flex-col">
      <NavBar profile={profile} />
      <div className="hero h-[500px] flex flex-col items-center justify-center px-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          {profile?.name ? (
            <h1 className="text-center text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold max-w-[700px] md:max-w-[900px]">
              Welcome, {profile.name
              .split(" ")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")}
            </h1>
          ) : (
            <h1 className="text-center text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold max-w-[700px] md:max-w-[900px]">
              Build Your Knowledge One <span className="text-primary">Topic</span> at a Time.
            </h1>
          )}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <Link href={profile ? "/dashboard" : "/auth/login"}>
            <Button className="" size="lg">
              {profile ? "Dashboard" : <>Get Started</>}
              <ArrowRight />
            </Button>
          </Link>
        </motion.div>
      </div>
      <div className="h-[400px] w-full rounded-t-xl border-2 border-border shadow-[0_0_2px_0_rgba(0,0,0,0.1)] bg-card text-card-foreground"></div>
    </div>
  );
}

export default page;
