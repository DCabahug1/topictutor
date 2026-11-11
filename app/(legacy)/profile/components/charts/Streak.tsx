import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Flame } from "lucide-react";
import React from "react";
import { motion } from "motion/react";
import { getStreak } from "@/lib/topics";

export default function Streak() {
  const [streak, setStreak] = React.useState(0);

  React.useEffect(() => {
    const loadStreak = async () => {
      const { data, error } = await getStreak();

      if (error) {
        console.log("Error loading streak:", error);
      } else {
        setStreak(data || 0);
      }
    };

    loadStreak();
  }, []);
  return (
    <Card className="sm:order-2 p-4 items-center justify-center gap-4">
      <CardHeader className="w-full flex flex-col items-center gap-1">
        <CardTitle className="text-center text-2xl sm:text-5xl md:text-6xl">
          Streak
        </CardTitle>
        <CardDescription className="text-center text-sm sm:text-base md:text-xl">
          Days of consistent learning
        </CardDescription>
      </CardHeader>
      <div className="flex items-center justify-center">
        <motion.h1
          key={streak}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={` font-bold text-8xl sm:text-[10rem] ${
            streak === 0 ? "text-gray-400" : "text-primary"
          }`}
        >
          {streak}
        </motion.h1>
        {streak > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Flame
              fill={"#e05d38"}
              className={`dark:text-white text-[#e04c38] h-20 w-20 sm:h-35 sm:w-35 transition-all duration-200 `}
              strokeWidth={2}
            />
          </motion.div>
        )}
      </div>
    </Card>
  );
}
