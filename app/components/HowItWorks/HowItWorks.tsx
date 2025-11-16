import React, { useState } from "react";
import { Book, Clipboard, Search, Target } from "lucide-react";
import Item from "./Item";
import { Description } from "@radix-ui/react-dialog";
import { motion } from "motion/react";

const items = [
  {
    title: "Pick a Topic",
    icon: <Search size={80} />,
    description: "Choose what you want to learn.",
  },
  {
    title: "Take the Test",
    icon: <Clipboard size={80} />,
    description: "Answer a quick quiz to gauge your level.",
  },
  {
    title: "Get Your Course",
    icon: <Book size={80} />,
    description: "Get a personalized course based on your level.",
  },
  {
    title: "Start Learning",
    icon: <Target size={80} />,
    description: "Follow clear lessons and track your progress.",
  },
];

function HowItWorks() {
  const [isInView, setIsInView] = useState(false);

  return (
    <motion.div 
      className="flex flex-col lg:flex-row w-full items-center lg:justify-center gap-4 lg:gap-8"
      onViewportEnter={() => setIsInView(true)}
      viewport={{ amount: 0.2, once: true }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 1 }}
        className="flex flex-col gap-2 text-center lg:text-left"
      >
        <h1 className="text-4xl lg:text-7xl font-bold text-nowrap">How It Works:</h1>
        <h2 className="text-lg  ">
          <span className="text-primary">TopicTutor</span> creates a custom course for you in four steps.
        </h2>
      </motion.div>
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item, index) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 1, delay: (index * 0.2) + 1 }}
            key={item.title}
          >
            <Item
              title={item.title}
              icon={item.icon}
              description={item.description}
              index={index}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export default HowItWorks;
