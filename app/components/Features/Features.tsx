import React, { useState } from "react";
import { Brain, Sparkles, LayoutPanelTop, BarChart3 } from "lucide-react";
import { motion } from "motion/react";

const features = [
  {
    title: "Personalized Courses",
    description:
      "TopicTutor builds every course around your weak areas so you spend time where it matters.",
    icon: Brain,
  },
  {
    title: "Smart Topic Categorization",
    description:
      "Your topic is mapped to the right field behind the scenes, which helps shape the course structure.",
    icon: Sparkles,
  },
  {
    title: "Structured Lessons",
    description:
      "Each chapter follows a clear, consistent layout so you always know what to expect when you study.",
    icon: LayoutPanelTop,
  },
  {
    title: "Progress Tracking",
    description:
      "See what you have finished and what is left with simple checkpoints that keep you moving forward.",
    icon: BarChart3,
  },
];

export function Features() {
  const [isInView, setIsInView] = useState(false);
  const [itemsInView, setItemsInView] = useState(false);

  return (
    <motion.div
      className="w-full"
      onViewportEnter={() => setIsInView(true)}
      viewport={{ amount: 0.2, once: true }}
    >
      <div className="w-full flex flex-col xl:flex-row items-center xl:justify-between gap-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.75 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ amount: 0.2, once: true }}
          className="flex flex-col gap-2 text-center xl:text-left xl:order-2"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            Features
          </p>
          <h2 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">
            What Makes TopicTutor Effective
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Learn with a course that adapts to you, stays organized, and keeps
            your progress clear.
          </p>
        </motion.div>

        <motion.div
          className="grid gap-6 md:grid-cols-2 xl:order-1 xl:max-w-3xl"
          onViewportEnter={() => setItemsInView(true)}
          viewport={{ amount: 0.3, once: true }}
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={
                  itemsInView
                    ? {
                        opacity: 1,
                        y: 0,
                      }
                    : { opacity: 0, y: 20 }
                }
                transition={{
                  opacity: { duration: 0.75, delay: index * 0.2 },
                  y: { duration: 0.75, delay: index * 0.2 },
                }}
                viewport={{ amount: 0.3, once: true }}
                className="group flex h-full gap-4 rounded-2xl border border-primary/20 hover:border-primary bg-card p-6 shadow-xl transition-all duration-150 hover:-translate-y-1  cursor-default"
              >
                <div className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </motion.div>
  );
}
