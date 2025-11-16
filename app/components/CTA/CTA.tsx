import React, { useState } from "react";
import { ArrowRight, Zap, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Profile } from "@/lib/models";

const benefits = [
  {
    icon: <Zap size={24} />,
    title: "Instant Access",
    description: "Start learning immediately with personalized courses",
  },
  {
    icon: <Shield size={24} />,
    title: "Completely Free",
    description: "No hidden costs, no subscriptions, just learning",
  },
  {
    icon: <Sparkles size={24} />,
    title: "Personalized",
    description: "Every course is tailored to your current knowledge level",
  },
];

export function CTA({ profile }: { profile: Profile | null }) {
  const [isInView, setIsInView] = useState(false);

  return (
    <motion.div
      className="w-full flex justify-center"
      onViewportEnter={() => setIsInView(true)}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.75 }}
      viewport={{ amount: 0.25, once: true }}
    >
      <Card className=" max-w-3xl px-16 py-12">
        <div className="flex flex-col items-center text-center gap-8">
          <div className="flex flex-col gap-4">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground">
              Ready to Start Learning?
            </h2>
            <p className="text-lg text-muted-foreground">
              Experience personalized education with{" "}
              <span className="text-primary font-semibold">TopicTutor</span>.
              Take a placement test and get a custom course built just for you.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link href={profile ? "/dashboard" : "/auth/register"}>
              <Button size="lg" className="text-lg px-8 py-6">
                Start Learning
                <ArrowRight className="ml-2" />
              </Button>
            </Link>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.75, delay: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-8 w-full max-w-4xl mt-8"
          >
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={
                  isInView
                    ? { opacity: 1, scale: 1 }
                    : { opacity: 0, scale: 0.8 }
                }
                transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                className="flex flex-col items-center gap-3 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  {benefit.icon}
                </div>
                <div className="text-lg font-semibold text-foreground">
                  {benefit.title}
                </div>
                <div className="text-sm text-muted-foreground">
                  {benefit.description}
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.75, delay: 0.8 }}
            className="text-sm text-muted-foreground"
          >
            No credit card required • Completely free • Start immediately
          </motion.p>
        </div>
      </Card>
    </motion.div>
  );
}
