import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Plus, Loader2 } from "lucide-react";
import React, { useEffect } from "react";
import TopicItem from "./TopicItem";
import { Topic } from "@/lib/models";
import NewTopicButton from "./NewTopicButton";
import { useState } from "react";
import {topicService} from "@/lib/topics"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function TopicList() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    setLoadingTopics(true);
    const { data, error } = await topicService.getTopics();
    console.log("data", data);
    if (!error && data) {
      setTopics(data);
    }
    setLoadingTopics(false);
  };

  const fetchTopicsByQuery = async () => {
    setLoadingTopics(true);
    const { data, error } = await topicService.getTopicsByQuery({
      query: searchQuery,
    });
    if (!error && data) {
      setTopics(data);
    }
    setLoadingTopics(false);
  };

  const getFilteredTopics = (
    filter: "all" | "not-started" | "in-progress" | "completed"
  ) => {
    if (filter === "all") {
      return topics;
    }
    if (filter === "not-started") {
      return topics?.filter((topic) => topic.status === "Not Started");
    }
    if (filter === "in-progress") {
      return topics?.filter((topic) => topic.status === "In Progress");
    }
    if (filter === "completed") {
      return topics?.filter((topic) => topic.status === "Completed");
    }
    return topics;
  };

  return (
    <Card className="flex flex-col flex-1 min-h-0 gap-2">
      <CardHeader>
        <CardTitle>Your Topics</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col flex-1 min-h-0 gap-2">
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            fetchTopicsByQuery();
          }}
        >
          <Input
            placeholder="Search"
            onChange={(e) => {
              setSearchQuery(e.target.value);
            }}
            value={searchQuery}
          />
          <Button disabled={loadingTopics} type="submit">
            <Search />
          </Button>
        </form>

        <div className="flex flex-col flex-1 min-h-0 gap-2 rounded-md overflow-hidden">
          <NewTopicButton fetchTopics={fetchTopics} />
          <Tabs defaultValue="all" className="flex-1 min-h-0">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="not-started">Not Started</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            <TabsContent
              value="all"
              className=" min-h-0 flex-1! flex flex-col overflow-y-auto rounded-md gap-2"
            >
              {loadingTopics ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="animate-spin" />
                </div>
              ) : getFilteredTopics("all") &&
                getFilteredTopics("all")?.length > 0 ? (
                getFilteredTopics("all")?.map((topic) => (
                  <TopicItem key={topic.id} topic={topic} />
                ))
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No topics found
                </div>
              )}
            </TabsContent>
            <TabsContent
              value="not-started"
              className="h-0 flex-1 flex flex-col overflow-y-auto rounded-md gap-2"
            >
              {loadingTopics ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="animate-spin" />
                </div>
              ) : getFilteredTopics("not-started") &&
                getFilteredTopics("not-started")?.length > 0 ? (
                getFilteredTopics("not-started")?.map((topic) => (
                  <TopicItem key={topic.id} topic={topic} />
                ))
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No topics found
                </div>
              )}
            </TabsContent>
            <TabsContent
              value="in-progress"
              className="flex-1 flex flex-col overflow-y-auto rounded-md gap-2"
            >
              {loadingTopics ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="animate-spin" />
                </div>
              ) : getFilteredTopics("in-progress") &&
                getFilteredTopics("in-progress")?.length > 0 ? (
                getFilteredTopics("in-progress")?.map((topic) => (
                  <TopicItem key={topic.id} topic={topic} />
                ))
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No topics found
                </div>
              )}
            </TabsContent>
            <TabsContent
              value="completed"
              className="flex-1 flex flex-col overflow-y-auto rounded-md gap-2"
            >
              {loadingTopics ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="animate-spin" />
                </div>
              ) : getFilteredTopics("completed") &&
                getFilteredTopics("completed")?.length > 0 ? (
                getFilteredTopics("completed")?.map((topic) => (
                  <TopicItem key={topic.id} topic={topic} />
                ))
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No topics found
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}

export default TopicList;
