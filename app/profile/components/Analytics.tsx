import { Card, CardContent, CardHeader } from "@/components/ui/card";
import React from "react";
import { Activity } from "./charts/Activity";
import Streak from "./charts/Streak";

function Analytics() {
  return (
    <div className=" grid grid-cols-1 md:grid-cols-2  gap-4">
      <Streak />
      <Activity />
    </div>
  );
}

export default Analytics;
