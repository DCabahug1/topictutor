import React from "react";
import { BookOpen, GraduationCap } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full flex items-center py-6 px-2 justify-center bg-card border-t border-border ">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 h-full">
        <div className="flex items-center justify-center gap-2">
          <GraduationCap className="w-8 h-8" />
          <span className="text-xl font-bold text-foreground">
            <span className="text-primary">Topic</span>Tutor
          </span>
        </div>
        <div className="hidden sm:block h-full min-h-0 w-[0.5px] bg-muted-foreground" />
        <p className="hidden sm:block text-sm text-muted-foreground max-w-md text-center sm:text-left">
          Personalized learning that adapts to you. Master any topic with
          courses tailored to your level and learning style.
        </p>
      </div>
    </footer>
  );
}
