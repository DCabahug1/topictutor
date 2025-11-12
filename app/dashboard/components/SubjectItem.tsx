import React from "react";
import { Subject } from "@/lib/models";
import { Button } from "@/components/ui/button";

function SubjectItem({ subject }: { subject: Subject }) {
  return (
    <div
      className="flex items-center justify-between gap-2 border-b"
    >
      <div className="flex flex-col py-2 px-4">
        <p className="text-sm text-muted-foreground">
          {subject.category}{" "}
          <span className={subject.status == "started" ? "text-green-500" : subject.status == "finished" ? "text-red-500" : "text-yellow-500"}>
            |{" "}
            {subject.status == "started"
              ? "Started"
              : subject.status == "finished"
              ? "Finished"
              : "Not Started"}
          </span>
        </p>
        <h2 className="text-lg font-semibold">{subject.name}</h2>
      </div>
    </div>
  );
}

export default SubjectItem;
