import React from "react";
import { Subject } from "@/lib/models";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { CircularProgress } from "@/components/customized/progress/progress-09";

function SubjectItem({ subject }: { subject: Subject }) {
  const [hover, setHover] = React.useState(false);
  return (
    <Card
      className="flex flex-row justify-between items-center gap-2 border-b px-4 py-3 cursor-pointer hover:bg-black/10"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Text */}
      <div className="flex flex-col">
        <div className="flex gap-2 items-center">
          <p className="text-sm text-muted-foreground">{subject.category}</p>
          <Badge
            variant="default"
            className={`text-xs ${
              subject.status === "In Progress"
                ? "bg-yellow-500"
                : subject.status === "Finished"
                ? "bg-green-500"
                : "bg-red-500"
            }`}
          >
            {subject.status === "In Progress"
              ? "In Progress"
              : subject.status === "Finished"
              ? "Finished"
              : "Unopened"}
          </Badge>
        </div>
        <h2 className="text-lg font-semibold">{subject.title}</h2>
        <p className="text-sm text-muted-foreground">{subject.description}</p>
      </div>
      {/* Icon */}
      <div className="flex items-center">
        <CircularProgress value={0} showLabel={true} size={70} strokeWidth={5} />
        {hover && <ArrowRight />}
      </div>
    </Card>
  );
}

export default SubjectItem;
