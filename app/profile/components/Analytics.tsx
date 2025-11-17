import { Card, CardContent, CardHeader } from "@/components/ui/card";
import React from "react";
import { Activity } from "./charts/Activity";
import Streak from "./charts/Streak";
import { motion } from "motion/react";
function Analytics() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className=" grid grid-cols-1 sm:grid-cols-2  gap-4"
    >
      <Streak />
      <Activity />
    </motion.div>
  );
}

export default Analytics;
