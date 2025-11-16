import React, { useState } from "react";
import {
  Play,
  Monitor,
  Smartphone,
  CheckCircle,
  Loader2,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import Link from "next/link";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { usePathname } from "next/navigation";

const demoFeatures = [
  {
    title: "Dashboard",
    description: "Your personalized learning hub",
    preview: "View your courses and track progress",
    url: "/dashboard",
    image: "/Demo/dashboard.png",
  },
  {
    title: "Placement Test",
    description: "Quick assessment to determine your starting level",
    preview: "Answer questions to get your personalized course",
    url: "/placement-test",
    image: "/Demo/placement-test.png",
  },
  {
    title: "Course View",
    description: "Browse course topics and chapters",
    preview: "Explore structured learning content",
    url: "/topic/[topic_id]",
    image: "/Demo/topic.png",
  },
  {
    title: "Chapter View",
    description: "Browse course chapters",
    preview: "Explore structured learning content",
    url: "/topic/[topic_id]/chapter/[chapter_id]",
    image: "/Demo/chapter.png",
  },
];

export function Demo() {
  const [isInView, setIsInView] = useState(false);
  const [activeDemo, setActiveDemo] = useState(0);
  const [navInView, setNavInView] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [origin, setOrigin] = useState("");

  // Set origin on client side only
  React.useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  // Reset loading states when demo changes
  React.useEffect(() => {
    setImageLoading(false);
    setImageError(false);
  }, [activeDemo]);

  return (
    <motion.div
      className="w-full"
      onViewportEnter={() => setIsInView(true)}
      viewport={{ amount: 0.2, once: true }}
    >
      <div className="w-full flex flex-col xl:flex-row items-center xl:justify-between gap-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.75 }}
          className="flex flex-col gap-2 text-center xl:text-left"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            See It In Action
          </p>
          <h2 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">
            Experience <span className="text-primary">TopicTutor</span>
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Get a preview of how{" "}
            <span className="text-primary font-semibold">TopicTutor</span>{" "}
            creates personalized learning experiences just for you.
          </p>
        </motion.div>

        <div className="w-full xl:max-w-3xl">
          {/* Demo Preview Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.75, delay: 0.2 }}
            className="mb-8"
          >
            <Card className="p-6 border-2 border-primary/30 bg-linear-to-br from-primary/5 to-transparent shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Monitor className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    {demoFeatures[activeDemo].title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {demoFeatures[activeDemo].description}
                  </p>
                </div>
              </div>

              <div className="bg-card rounded-lg border border-border overflow-hidden">
                <div className="flex items-center gap-2 p-4 border-b">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <div className="flex-1 bg-black/10 rounded px-3 py-1 text-xs text-muted-foreground overflow-hidden text-ellipsis">
                    {origin + demoFeatures[activeDemo].url}
                  </div>
                </div>

                <div className="bg-muted/50 min-h-[120px] flex items-center justify-center">
                  <div className="text-center w-full">
                    <div className="relative w-full h-full flex items-center justify-center">
                      <Image
                        src={demoFeatures[activeDemo].image}
                        alt={`Demo screenshot of ${demoFeatures[activeDemo].title}`}
                        width={1333}
                        height={2547}
                        className={` object-cover rounded transition-opacity duration-300 ${
                          imageLoading ? "hidden" : ""
                        }`}
                        onLoad={() => {
                          console.log("Image loaded");
                          setImageLoading(false);
                        }}
                        onError={() => {
                          console.log("Image error");
                          setImageError(true);
                          setImageLoading(false);
                        }}
                      />
                      {imageLoading ? (
                        <div className="text-center">
                          <Loader2 className="w-12 h-12 text-primary mx-auto mb-2 animate-spin" />
                        </div>
                      ) : imageError ? (
                        <div className="text-center flex flex-col items-center justify-center">
                          <X className="w-12 h-12 text-primary mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Image not found
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Demo Navigation */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            onViewportEnter={() => setNavInView(true)}
            viewport={{ amount: 0.3, once: true }}
          >
            {demoFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: navInView ? 1 : 0,
                  y: navInView ? 0 : 20,
                }}
                transition={{
                  opacity: { duration: 1, delay: 0.4 + index * 0.1 },
                  y: { duration: 0.75, delay: 0.3 + index * 0.1 },
                }}
              >
                <Card
                  className={`h-full p-4 cursor-pointer transition-all duration-300 hover:translate-y-[-2px] border shadow-xl ${
                    activeDemo === index
                      ? "border-primary bg-primary/5"
                      : "border-primary/30 hover:border-primary"
                  }`}
                  onClick={() => setActiveDemo(index)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activeDemo === index
                          ? "bg-primary text-white"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm text-foreground">
                        {feature.title}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
