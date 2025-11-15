"use client";
import React from "react";
import { Chapter, Topic } from "@/lib/models";
import { getChaptersByTopicId } from "@/lib/chapters";
import { getTopicById } from "@/lib/topics";
import { useParams } from "next/navigation";
import ChapterItem from "./components/ChapterItem";
import NavBar from "@/components/NavBar/NavBar";
import { Profile } from "@/lib/models";
import { authService } from "@/lib/auth";
import { useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";

function page() {
  const params = useParams();
  const [chapters, setChapters] = React.useState<Chapter[]>([]);
  const [topic, setTopic] = React.useState<Topic | null>(null);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    refreshUserData();
  }, []);

  const refreshUserData = async () => {
    setLoading(true);
    const { success, data, error } = await authService.getUserAndProfile();

    if (error) {
      console.log(error);
    }

    console.log(data);

    if (success && data) {
      setProfile(data.profile[0]);
    }
    setLoading(false);
  };

  useEffect(() => {
    const fetchTopic = async () => {
      setLoading(true);
      const { data, error } = await getTopicById({ id: params.id as string });
      if (error) {
        console.log(error);
      }
      if (data) {
        setTopic(data[0]);
      }
      setLoading(false);
    };
    const fetchChapters = async () => {
      setLoading(true);
      const { data, error } = await getChaptersByTopicId(params.id as string);
      if (error) {
        console.log(error);
      }
      if (data) {
        setChapters(data);
      }
      setLoading(false);
    };

    fetchChapters();
    fetchTopic();
  }, [params.id]);

  return (
    <div className="flex flex-col h-screen min-h-0">
      <NavBar profile={profile} />
      {loading ? (
        <div
          // initial={{ opacity: 0, y: 20 }}
          // animate={{ opacity: 1, y: 0 }}
          // transition={{ duration: 0.5, delay: 0.1 }}
          className="flex-1 min-h-0 flex items-center justify-center flex-col gap-2"
        >
          <Loader2 className="w-8 h-8 animate-spin" />
          <div className="flex flex-col items-center justify-center">
            <p className="text-center font-bold">Loading course...</p>
            <p className="text-center text-muted-foreground text-xs">
              Please wait
            </p>
          </div>
        </div>
      ) : (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className="flex-1 min-h-0 flex items-center justify-center p-4 "
        >
          <Card className="h-full w-full max-w-6xl">
            {topic && (
              <CardHeader>
                <h1 className="text-2xl font-bold">{topic.title}</h1>
                <p className="text-muted-foreground">{topic.description}</p>
              </CardHeader>
            )}
            <CardContent className="flex flex-col gap-2 overflow-y-auto">
              {chapters.map((chapter, index) => (
                <ChapterItem key={chapter.id} chapter={chapter} index={index} />
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

export default page;
