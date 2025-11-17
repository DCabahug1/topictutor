import React from "react";
import { Topic } from "@/lib/models";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { CircularProgress } from "@/components/customized/progress/progress-09";
import Link from "next/link";
import { motion } from "motion/react";

function TopicItem({
  topic,
  index,
  noAnimation,
  type,
}: {
  topic: Topic;
  index: number;
  noAnimation?: boolean;
  type?: "recent" | null;
}) {
  return (
    <Link href={`/topic/${topic.id}`}>
      <motion.div
        initial={noAnimation ? undefined : { opacity: 0, y: 20 }}
        animate={noAnimation ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        viewport={{ once: true }}
        className="w-full"
      >
        <Card className="flex flex-row justify-between items-center gap-2 border-b px-4 py-3 cursor-pointer hover:bg-black/10 transition-colors duration-100">
          {/* Text */}
          <div className="flex flex-col">
            <div className="flex gap-2 items-center">
              <p className="text-sm text-muted-foreground">{topic.category}</p>
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
            </div>
            <h2 className="text-lg font-semibold">{topic.title}</h2>
            <p
              className={`text-sm text-muted-foreground ${
                type === "recent" && "hidden sm:block"
              }`}
            >
              {topic.description}
            </p>
          </div>
          {/* Icon */}
          <div className="flex items-center">
            <CircularProgress
              value={(topic.chapters_completed / topic.chapters_count) * 100}
              showLabel={true}
              size={80}
              strokeWidth={5}
            />
          </div>
        </Card>
      </motion.div>
    </Link>
  );
}

export default TopicItem;
