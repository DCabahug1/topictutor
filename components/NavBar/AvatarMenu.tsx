"use client";
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Profile } from "@/lib/models";
import { authService } from "@/lib/auth";

function AvatarMenu({ profile }: { profile: Profile }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full cursor-pointer">
        <Avatar>
          <AvatarImage src={profile.image_url || ""} />
          <AvatarFallback className="text-primary-foreground bg-primary">
            {profile.name?.[0]?.toUpperCase() ||
              profile.email?.[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>{profile?.name || profile?.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Profile</DropdownMenuItem>
        <DropdownMenuItem>Settings</DropdownMenuItem>
        <DropdownMenuItem
          className="hover:bg-red-500/20!"
          onClick={async () => {
            await authService.signOut();

            window.location.reload();
          }}
        >
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default AvatarMenu;
