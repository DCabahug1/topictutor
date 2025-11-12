import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Plus, Loader2 } from "lucide-react";
import React, { useEffect } from "react";
import SubjectItem from "./SubjectItem";
import { Subject } from "@/lib/models";
import NewSubjectButton from "./NewSubjectButton";
import { useState } from "react";
import { subjectService } from "@/lib/subjects";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function SubjectList() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    setLoadingSubjects(true);
    const { data, error } = await subjectService.getSubjects();
    if (!error && data) {
      setSubjects(data);
    }
    setLoadingSubjects(false);
  };

  const fetchSubjectsByQuery = async () => {
    setLoadingSubjects(true);
    const { data, error } = await subjectService.getSubjectsByQuery({
      query: searchQuery,
    });
    if (!error && data) {
      setSubjects(data);
    }
    setLoadingSubjects(false);
  };

  const getFilteredSubjects = (
    filter: "all" | "unopened" | "in-progress" | "finished"
  ) => {
    if (filter === "all") {
      return subjects;
    }
    if (filter === "unopened") {
      return subjects?.filter((subject) => subject.status === "Unopened");
    }
    if (filter === "in-progress") {
      return subjects?.filter((subject) => subject.status === "In Progress");
    }
    if (filter === "finished") {
      return subjects?.filter((subject) => subject.status === "Finished");
    }
    return subjects;
  };

  return (
    <Card className="flex flex-col flex-1 min-h-0 gap-2">
      <CardHeader>
        <CardTitle>Your Subjects</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col flex-1 min-h-0 gap-2">
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            fetchSubjectsByQuery();
          }}
        >
          <Input
            placeholder="Search"
            onChange={(e) => {
              setSearchQuery(e.target.value);
            }}
            value={searchQuery}
          />
          <Button disabled={loadingSubjects} type="submit">
            <Search />
          </Button>
        </form>

        <div className="flex flex-col flex-1 min-h-0 gap-2 rounded-md overflow-hidden">
          <NewSubjectButton fetchSubjects={fetchSubjects} />
          <Tabs defaultValue="all" className="flex-1 min-h-0">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unopened">Unopened</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress</TabsTrigger>
              <TabsTrigger value="finished">Finished</TabsTrigger>
            </TabsList>
            <TabsContent
              value="all"
              className=" min-h-0 flex-1! flex flex-col overflow-y-auto rounded-md gap-2"
            >
              {loadingSubjects ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="animate-spin" />
                </div>
              ) : getFilteredSubjects("all") &&
                getFilteredSubjects("all")?.length > 0 ? (
                getFilteredSubjects("all")?.map((subject) => (
                  <SubjectItem key={subject.id} subject={subject} />
                ))
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No subjects found
                </div>
              )}
            </TabsContent>
            <TabsContent
              value="unopened"
              className="h-0 flex-1 flex flex-col overflow-y-auto rounded-md gap-2"
            >
              {loadingSubjects ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="animate-spin" />
                </div>
              ) : getFilteredSubjects("unopened") &&
                getFilteredSubjects("unopened")?.length > 0 ? (
                getFilteredSubjects("unopened")?.map((subject) => (
                  <SubjectItem key={subject.id} subject={subject} />
                ))
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No subjects found
                </div>
              )}
            </TabsContent>
            <TabsContent
              value="in-progress"
              className="flex-1 flex flex-col overflow-y-auto rounded-md gap-2"
            >
              {loadingSubjects ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="animate-spin" />
                </div>
              ) : getFilteredSubjects("in-progress") &&
                getFilteredSubjects("in-progress")?.length > 0 ? (
                getFilteredSubjects("in-progress")?.map((subject) => (
                  <SubjectItem key={subject.id} subject={subject} />
                ))
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No subjects found
                </div>
              )}
            </TabsContent>
            <TabsContent
              value="finished"
              className="flex-1 flex flex-col overflow-y-auto rounded-md gap-2"
            >
              {loadingSubjects ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="animate-spin" />
                </div>
              ) : getFilteredSubjects("finished") &&
                getFilteredSubjects("finished")?.length > 0 ? (
                getFilteredSubjects("finished")?.map((subject) => (
                  <SubjectItem key={subject.id} subject={subject} />
                ))
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No subjects found
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}

export default SubjectList;
