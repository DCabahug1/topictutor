"use client";

import React, { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import NavBar from "@/components/NavBar/NavBar";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { authService } from "@/lib/auth";
import { Profile } from "@/lib/models";
import HowItWorks from "./components/HowItWorks/HowItWorks";
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
    <div className="flex flex-col h-screen overflow-y-auto bg-linear-to-t from-primary/40 to-secondary">
      <div className="relative flex flex-col">
        <NavBar profile={profile} />
        <div className="hero h-[600px] flex flex-col items-center justify-center px-8 gap-6">
          <AnimatePresence mode="wait">
            {profile?.name ? (
              <motion.h1
                key="welcome"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="text-center text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold max-w-[700px] md:max-w-[900px]"
              >
                Welcome,{" "}
                <span className="text-primary">
                  {profile.name
                    .split(" ")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
                </span>
              </motion.h1>
            ) : (
              <motion.h1
                key="default"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="text-center text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold max-w-[700px] md:max-w-[900px]"
              >
                Build Your Knowledge One{" "}
                <span className="text-primary">Topic</span> at a Time.
              </motion.h1>
            )}
          </AnimatePresence>
          <div className="">
            <AnimatePresence mode="wait">
              {profile ? (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  <Link href="/dashboard">
                    <Button className="" size="lg">
                      Dashboard
                      <ArrowRight />
                    </Button>
                  </Link>
                </motion.div>
              ) : (
                <motion.div
                  key="get-started"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  <Link href="/auth/login">
                    <Button className="" size="lg">
                      Get Started
                      <ArrowRight />
                    </Button>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="flex flex-col px-4 py-8 items-center w-full rounded-t-xl border-2 border-border shadow-[0_0_2px_0_rgba(0,0,0,0.1)] bg-card text-card-foreground">
          <div className="flex flex-col w-full max-w-7xl">
            <HowItWorks />
          </div>
        </div>
      </div>
    </div>
  );
}

export default page;
