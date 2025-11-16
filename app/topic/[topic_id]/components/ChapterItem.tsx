"use client";
import React from "react";
import { Chapter } from "@/lib/models";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Check, ChevronRight } from "lucide-react";

function ChapterItem({ chapter }: { chapter: Chapter }) {
  return (
    <Card
      className={`h-full p-0 flex-row justify-between gap-2 hover:bg-black/10 transition-colors duration-100 cursor-pointer overflow-hidden ${
        chapter.completed && "border-green-500/50 hover:border-green-500" 
      }`}
    >
      <div className="flex-1 min-w-0 flex flex-col gap-2 py-4">
        <CardHeader className="flex items-center">
          <h2 className="text-lg font-semibold">
            {chapter.chapter_number}. {chapter.title}
          </h2>
          {/* {chapter.completed && (
            <Check className="h-6 w-6" color="green" strokeWidth={2} />
          )} */}
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{chapter.description}</p>
        </CardContent>
      </div>
      <div className="h-full w-10 bg-black/5 flex items-center justify-center">
      <ChevronRight />
      </div>
    </Card>
  );
}

export default ChapterItem;
