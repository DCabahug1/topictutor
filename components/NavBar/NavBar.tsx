"use client";

import Link from "next/link";
import React from "react";
import { usePathname } from "next/navigation";
import { Button } from "../ui/button";
import { Profile } from "@/lib/models";
import AvatarMenu from "./AvatarMenu";

function NavBar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <div className="sticky top-0 z-50 flex justify-between items-center px-4 py-2 bg-card text-card-foreground shadow-md">
      <Link href="/">
        <h1 className="text-2xl font-bold">TopicTutor</h1>
      </Link>
      {isHome && !profile ? (
        <>
          <div className="flex gap-2">
            <Link href="/auth/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/auth/register">
              <Button variant="default">Register</Button>
            </Link>
          </div>
        </>
      ) : profile ? (
        <AvatarMenu profile={profile} />
      ) : (
        <></>
      )}
    </div>
  );
}

export default NavBar;
