"use client";

import Link from "next/link";
import React from "react";
import { usePathname } from "next/navigation";
import { Button } from "../ui/button";
import { Profile } from "@/lib/models";
import AvatarMenu from "./AvatarMenu";
import { ArrowLeftFromLine, GraduationCap } from "lucide-react";

function NavBar({
  profile,
  explicitPath,
}: {
  profile: Profile | null;
  explicitPath?: string | null;
}) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const showBackButton =
    pathname.startsWith("/topic/") || pathname.startsWith("/placement-test") || pathname.startsWith("/profile");

  return (
    <div className="sticky top-0 z-50 flex justify-between items-center w-full px-4 py-2 bg-card text-card-foreground shadow-md">
      <Link href="/" className="flex items-center gap-2">
        <GraduationCap className="w-8 h-8" strokeWidth={2} />
        <h1 className="text-2xl font-bold">
          <span className="text-primary">Topic</span>Tutor
        </h1>
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
        <div className="flex gap-2">
          {showBackButton && (
            <Link href={explicitPath || "/dashboard"}>
              <Button variant="ghost">
                <ArrowLeftFromLine className="w-4 h-4" />
                {pathname.includes("/chapter") ? "Chapters" : "Dashboard"}
              </Button>
            </Link>
          )}
          <AvatarMenu profile={profile} />
        </div>
      ) : (
        <></>
      )}
    </div>
  );
}

export default NavBar;
