import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";
import React from "react";
import SubjectItem from "./SubjectItem";
import { Subject } from "@/lib/models";
import NewSubjectButton from "./NewSubjectButton";

function SubjectList() {
  const subjects: Subject[] = [
    {
      id: "1",
      user_id: "1",
      name: "Algebra",
      category: "Mathematics",
      description: "This covers basic algebraic concepts.",
      status: "created",
      created_at: "2025-11-11T00:00:00.000Z",
      updated_at: "2025-11-11T00:00:00.000Z",
    },
    {
      id: "2",
      user_id: "1",
      name: "Grammar",
      category: "English",
      description: "This covers basic grammar rules.",
      status: "started",
      created_at: "2025-11-12T00:00:00.000Z",
      updated_at: "2025-11-12T00:00:00.000Z",
    },
    {
      id: "3",
      user_id: "1",
      name: "Chemistry",
      category: "Science",
      description: "This covers basic chemistry concepts.",
      status: "finished",
      created_at: "2025-11-13T00:00:00.000Z",
      updated_at: "2025-11-13T00:00:00.000Z",
    },
    {
      id: "3",
      user_id: "1",
      name: "Chemistry",
      category: "Science",
      description: "This covers basic chemistry concepts.",
      status: "finished",
      created_at: "2025-11-13T00:00:00.000Z",
      updated_at: "2025-11-13T00:00:00.000Z",
    },
    {
      id: "3",
      user_id: "1",
      name: "Chemistry",
      category: "Science",
      description: "This covers basic chemistry concepts.",
      status: "finished",
      created_at: "2025-11-13T00:00:00.000Z",
      updated_at: "2025-11-13T00:00:00.000Z",
    },
  ];

  return (
    <Card className="flex flex-col flex-1 min-h-0 gap-2">
      <CardHeader>
        <CardTitle>Your Subjects</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col flex-1 min-h-0 gap-2">
        <div className="flex items-center gap-2">
          <Input placeholder="Search" />
          <Button>
            <Search />
          </Button>
        </div>

        <div className="flex flex-col flex-1 min-h-0 gap-2 rounded-md overflow-hidden">
          <NewSubjectButton />

          {/* key: h-0 + flex-1 + overflow-auto */}
          <div className="h-0 flex-1 overflow-auto rounded-md">
            {subjects.map((subject) => (
              <SubjectItem key={subject.id} subject={subject} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default SubjectList;
