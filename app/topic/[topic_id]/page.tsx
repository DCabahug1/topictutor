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
import Link from "next/link";
import { CircularProgress } from "@/components/customized/progress/progress-09";
import { Badge } from "@/components/ui/badge";

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
      const { data, error } = await getTopicById({
        id: params.topic_id as string,
      });
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
      const { data, error } = await getChaptersByTopicId(
        params.topic_id as string
      );
      if (error) {
        console.log(error);
      }
      if (data) {
        setChapters(data);
      }
      console.log("Chapters fetched:", data);
      setLoading(false);
    };

    fetchChapters();
    fetchTopic();
  }, [params.topic_id]);

  if (!topic) {
    return (
      <div className="flex flex-col h-screen min-h-0">
        <NavBar profile={profile} />
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
      </div>
    );
  }

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
        <div className="flex-1 min-h-0 flex items-center justify-center p-4 ">
          <Card className="h-full w-full max-w-6xl overflow-y-auto gap-2">
            {topic && (
              <CardHeader className="flex flex-col items-center">
                <Badge
                  variant="default"
                  className={`text-xs ${
                    topic.chapters_completed === topic.chapters_count
                      ? "bg-green-500"
                      : topic.chapters_completed > 0
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                >
                  {topic.chapters_completed === topic.chapters_count
                    ? "Completed"
                    : topic.chapters_completed > 0
                    ? "In Progress"
                    : "Not Started"}
                </Badge>
                <h1 className="text-2xl font-bold text-center">
                  {topic.title}
                </h1>

                <p className="text-muted-foreground text-center ">
                  {topic.description}
                </p>
                <Card className="flex flex-row justify-center items-center px-6 py-0">
                  <h1 className="text-xl font-bold">Progress:</h1>
                  <CircularProgress
                    value={
                      (topic.chapters_completed / topic.chapters_count) * 100
                    }
                    labelClassName="text-xl"
                    showLabel={true}
                    size={120}
                    strokeWidth={10}
                  />
                </Card>
              </CardHeader>
            )}
            <CardContent className="flex flex-col gap-2">
              {chapters.map((chapter, index) => (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  initial={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  key={chapter.id}
                >
                  <Link href={`/topic/${topic.id}/chapter/${chapter.id}`}>
                    <ChapterItem chapter={chapter} />
                  </Link>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default page;
