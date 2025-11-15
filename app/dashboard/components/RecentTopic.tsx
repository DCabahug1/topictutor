"use client";
import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLatestTopic } from "@/lib/topics";
import { Topic } from "@/lib/models";
import TopicItem from "./TopicItem";

function RecentTopic() {
  const [topic, setTopic] = React.useState<Topic | null>(null);

  useEffect(() => {
    const fetchTopic = async () => {
      const { data, error } = await getLatestTopic();

      if (error) {
        console.log(error);
      }

      if (data && data.length > 0) {
        setTopic(data[0]);
      }
    };

    fetchTopic();
  }, []);

  if (!topic) {
    return null;
  }

  return (
      <Card className="gap-2">
        <CardHeader>
          <CardTitle>Jump Back In</CardTitle>
        </CardHeader>
        <CardContent>
          <TopicItem topic={topic} index={0} noAnimation={true} />
        </CardContent>
      </Card>
  );
}

export default RecentTopic;
