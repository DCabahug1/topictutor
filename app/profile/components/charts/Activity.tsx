"use client";

import { TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useEffect, useState } from "react";
import { getTopicsUpdatedAtDateAndCompleted } from "@/lib/topics";

export const description = "A bar chart";



const chartConfig = {
  topicsCompleted: {
    label: "Topics Completed",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function Activity() {
  const [chartData, setChartData] = useState<{ date: Date; topicsCompleted: number }[]>([]);

  useEffect(() => {
    const loadActivityData = async () => {
      const dates: Date[] = [];
      
      // Generate past 8 days (including today)
      for (let i = 7; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date);
      }

      // Fetch data for all dates
      const activityPromises = dates.map(async (date) => {
        const { data, error } = await getTopicsUpdatedAtDateAndCompleted({ date });
        
        if (error) {
          console.log("Error getting topics updated at date:", error);
          return { date, topicsCompleted: 0 };
        }
        
        return { date, topicsCompleted: data?.length || 0 };
      });

      // Wait for all promises to resolve
      const activityData = await Promise.all(activityPromises);
      
      // Update chart data once with all results
      setChartData(activityData);
    };

    loadActivityData();
  }, []);

  return (
    <Card className="sm:order-1">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Topics completed in the last 7 days</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', { weekday: 'short' });
              }}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="topicsCompleted" fill="var(--color-topicsCompleted)" radius={8} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Keep up the momentum! <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Track your daily learning progress and completed topics
        </div>
      </CardFooter>
    </Card>
  );
}
