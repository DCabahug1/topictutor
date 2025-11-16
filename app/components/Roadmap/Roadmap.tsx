import React, { useState } from "react";
import {
  CheckCircle,
  Clock,
  Zap,
  Brain,
  Users,
  Smartphone,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "motion/react";

const roadmapItems = [
  {
    title: "Core Learning Engine",
    description: "Personalized course generation based on placement tests",
    status: "Completed",
    date: "NOV 2025",
    icon: <Brain size={24} />,
    features: ["Placement testing", "Course generation", "Progress tracking"],
  },
  {
    title: "Enhanced User Experience",
    description: "Improved interface and interactive learning components",
    status: "In Progress",
    date: "NOV 2025",
    icon: <Zap size={24} />,
    features: ["Interactive exercises", "Better UI/UX", "Mobile optimization"],
  },
];

const statusColors = {
  Completed: "bg-green-600",
  "In Progress": "bg-yellow-500",
  "Not Started": "bg-red-500",
};

export function Roadmap() {
  const [isInView, setIsInView] = useState(false);

  return (
    <motion.div
      className="w-full"
      onViewportEnter={() => setIsInView(true)}
      viewport={{ amount: 0.3, once: true }}
    >
      <div className="w-full flex flex-col items-center gap-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.75 }}
          className="flex flex-col gap-2 text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            Roadmap
          </p>
          <h2 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">
            What's Coming Next
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base max-w-2xl">
            We're constantly improving{" "}
            <span className="text-primary font-semibold">TopicTutor</span>.
            Here's what we're working on and what's planned for the future.
          </p>
        </motion.div>

        <div className="flex flex-col w-full max-w-4xl">
          {roadmapItems.map((item, index) => {
            return (
              <div key={index} className="flex">
                <div className=" flex flex-col items-center">
                  <div className="flex items-center justify-center h-12 w-12 border-6 border-background/40 rounded-full bg-primary">
                    {item.icon}
                  </div>
                  {index < roadmapItems.length - 1 && (
                    <div className="w-0.5 flex-1 min-h-0 bg-border" />
                  )}
                </div>
                <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.75, delay: index * 0.2 }}
                className="flex-1 min-w-0 px-4 pb-4">
                  <Card className=" py-4 px-6 flex-1 min-w-0 gap-6 shadow-xl border-primary/40 hover:border-primary hover:translate-y-[-2px] cursor-default transition-all duration-150">
                    <div className="flex flex-row justify-between gap-6">
                      <div>
                        <h3 className="text-xl font-semibold">{item.title}</h3>
                        <p className="text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge
                          variant="outline"
                          className={
                            statusColors[
                              item.status as keyof typeof statusColors
                            ] + " text-white"
                          }
                        >
                          {item.status}
                        </Badge>
                        <p className="text-primary font-bold text-sm">
                          {item.date}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.features.map((feature, index) => (
                        <div key={index} className="flex gap-2">
                          <p
                            className="text-sm text-muted-foreground"
                          >
                            {feature}
                          </p>
                          {index < item.features.length - 1 && (
                            <span className="text-muted-foreground">|</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              </div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.75, delay: 0.8 }}
          className="text-center"
        >
          <p className="text-sm text-muted-foreground">
            Have suggestions for our roadmap?{" "}
            <a
              href="mailto:duanecabahug6@gmail.com"
              className="text-primary hover:underline font-semibold"
            >
              Let us know!
            </a>
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
