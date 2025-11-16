"use client";

import React, { useEffect, useRef, useState } from "react";
import { redirect, useParams } from "next/navigation";
import { getChapterById } from "@/lib/chapters";
import { authService } from "@/lib/auth";
import NavBar from "@/components/NavBar/NavBar";
import { Chapter } from "@/lib/models";
import { Profile } from "@/lib/models";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { getNeighboringChapters } from "@/lib/chapters";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { updateTopicProgress } from "@/lib/chapters";
import { Check } from "lucide-react";

function page() {
  const { topic_id, chapter_id } = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [prevChapter, setPrevChapter] = useState<Chapter | null>(null);
  const [nextChapter, setNextChapter] = useState<Chapter | null>(null);
  const updatedTopicForChapterIdRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchChapter = async () => {
      const { data, error } = await getChapterById(chapter_id as string);
      if (error) {
        console.log("Error getting chapter:", error);
      } else {
        const fetchNeighboringChapters = await getNeighboringChapters(
          data?.[0]
        );

        if (fetchNeighboringChapters.data) {
          setPrevChapter(fetchNeighboringChapters.data.prevChapter);
          setNextChapter(fetchNeighboringChapters.data.nextChapter);
        }

        const currentChapterId = data?.[0]?.id as string | undefined;
        console.log(
          "updatedTopicForChapterIdRef.current",
          updatedTopicForChapterIdRef.current
        );

        if (
          currentChapterId &&
          updatedTopicForChapterIdRef.current !== currentChapterId
        ) {
          updatedTopicForChapterIdRef.current = currentChapterId;
          console.log("Chapter completed:", data?.[0]?.completed);
          if (data?.[0]?.completed === false) {
            console.log("Updating topic progress for chapter:", data?.[0]);
            const updateTopic = await updateTopicProgress(
              topic_id as string,
              data?.[0]
            );

            if (updateTopic.error) {
              console.log("Error updating topic:", updateTopic.error);
            }
          }
        }

        setChapter(data?.[0]);
      }
    };
    fetchChapter();
  }, [chapter_id]);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await authService.getUserAndProfile();
      if (error) {
        console.log("Error getting profile:", error);
      } else {
        setProfile(data?.profile?.[0]);
      }
    };
    fetchProfile();
  }, []);

  if (!chapter) {
    return (
      <div className="flex flex-col h-screen min-h-0">
        <NavBar profile={profile} explicitPath={"/topic/" + topic_id} />
        <div className="flex-1 min-h-0 flex justify-center p-4">
          <div className="flex-1 min-h-0 flex justify-center max-w-6xl">
            <Card className="w-full max-w-4xl">
              <CardHeader className="flex flex-col items-center gap-4">
                <Skeleton className="h-6 w-[70%]" />
                <Skeleton className="h-6 w-[90%]" />
              </CardHeader>
              <CardContent className="flex flex-col gap-8">
                <div className="flex flex-col gap-4">
                  <div className="pl-8">
                    <Skeleton className="h-4 w-full" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <div className="pr-8">
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="pl-8">
                    <Skeleton className="h-4 w-full" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <div className="pr-8">
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              </CardContent>
              <CardFooter></CardFooter>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <NavBar profile={profile} explicitPath={"/topic/" + topic_id} />
      <div className="flex-1 min-h-0 flex justify-center">
        <div className="flex-1 min-h-0 flex justify-center max-w-6xl p-4">
          <Card className="flex-1 min-h-0 w-full h-min max-h-full max-w-4xl overflow-y-auto">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-2xl font-bold">
                  {chapter?.chapter_number}. {chapter?.title}
                </h1>
                {chapter?.completed && (
                  <Check className="h-6 w-6" color="green" strokeWidth={2} />
                )}
              </div>
              <p className="text-muted-foreground">{chapter?.description}</p>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {chapter?.content_paragraphs?.map((paragraph, index) => (
                <p key={index} className="indent-6">
                  {paragraph}
                </p>
              ))}
            </CardContent>
            <CardFooter
              className={`flex ${
                nextChapter && prevChapter
                  ? "justify-between"
                  : nextChapter
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              {prevChapter && (
                <Button
                  onClick={() =>
                    redirect(`/topic/${topic_id}/chapter/${prevChapter?.id}`)
                  }
                >
                  <ArrowLeft className=" h-4 w-4" />
                  <span className="block sm:hidden">Previous</span>
                  <span className="hidden sm:block">Previous Chapter</span>
                </Button>
              )}
              {nextChapter && (
                <Button
                  onClick={() =>
                    redirect(`/topic/${topic_id}/chapter/${nextChapter?.id}`)
                  }
                >
                  <span className="block sm:hidden">Next</span>
                  <span className="hidden sm:block">Next Chapter</span>
                  <ArrowRight className=" h-4 w-4" />
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default page;
