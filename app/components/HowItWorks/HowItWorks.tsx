import React, { useEffect, useState } from "react";
import { Book, SquarePen, Search, Shapes } from "lucide-react";
import Item from "./Item";
import { Description } from "@radix-ui/react-dialog";
import { motion } from "motion/react";

const items = [
  {
    title: "Pick a Topic",
    icon: <Search size={45} />,
    description: "Choose what you want to learn.",
  },
  {
    title: "Take the Test",
    icon: <SquarePen size={45} />,
    description: "Answer a quick quiz to gauge your level.",
  },
  {
    title: "Get Your Course",
    icon: <Book size={45} />,
    description: "Get a personalized course based on your level.",
  },
  {
    title: "Start Learning",
    icon: <Shapes size={45} />,
    description: "Follow clear lessons and track your progress.",
  },
];

function HowItWorks() {
  const [isInView, setIsInView] = useState(false);
  const [itemsInView, setItemsInView] = useState(false);
  const [autoHoverIndex, setAutoHoverIndex] = useState(-1);

  useEffect(() => {
    if (isInView) {
      // Start auto hover animations after initial animations complete
      // Initial animations take 0.75s + (3 * 1s) = 3.75s for all items
      const initialDelay = 2000;

      const startAutoHover = () => {
        items.forEach((_, index) => {
          setTimeout(() => {
            setAutoHoverIndex(index);
            // Reset after animation duration
            setTimeout(() => setAutoHoverIndex(-1), 300);
          }, index * 500);
        });
      };

      const timer = setTimeout(startAutoHover, initialDelay);
      return () => clearTimeout(timer);
    }
  }, [isInView]);

  return (
    <motion.div
      className="flex flex-col xl:flex-row w-full items-center xl:justify-between gap-4 "
      onViewportEnter={() => setIsInView(true)}
      viewport={{ amount: 0.2, once: true }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.75 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="flex flex-col gap-2 text-center xl:text-left"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          How It Works
        </p>
        <h2 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">
          Your Learning Journey in Four Simple Steps
        </h2>
        <h2 className="mt-3 text-sm text-muted-foreground sm:text-base">
          <span className="text-primary font-semibold">TopicTutor</span> creates
          a custom course for you in four steps.
        </h2>
      </motion.div>
      <motion.div
        className="w-full xl:max-w-3xl grid grid-cols-1 sm:grid-cols-2 gap-4"
        onViewportEnter={() => setItemsInView(true)}
        viewport={{ amount: 0.3, once: true }}
      >
        {items.map((item, index) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={
              itemsInView
                ? {
                    opacity: 1,
                    y: 0,
                    translateY: autoHoverIndex === index ? -10 : 0,
                  }
                : { opacity: 0, y: 20, translateY: 0 }
            }
            transition={{
              opacity: { duration: 0.75, delay: index * 0.2 },
              y: { duration: 0.75, delay: index * 0.2 },
              translateY: { duration: 0.3 },
            }}
            viewport={{ amount: 0.3, once: true }}
            key={item.title}
          >
            <Item
              title={item.title}
              icon={item.icon}
              description={item.description}
              index={index}
              autoHoverIndex={autoHoverIndex}
            />
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

export default HowItWorks;
