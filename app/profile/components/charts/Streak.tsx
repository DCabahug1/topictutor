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

export default function Streak() {
  return (
    <Card className="md:order-2">
        <CardHeader>
            <CardTitle>Streak</CardTitle>
        </CardHeader>
        <CardContent>
            <Flame />
        </CardContent>
    </Card>
  )
}
