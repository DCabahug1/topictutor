import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Book, ArrowRight } from "lucide-react";

function RecentTopic() {
  return (
    <Card className="gap-2">
      <CardHeader>
        <CardTitle>Continue where you left off</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-2 bg-black/15  p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <Book className="h-12 w-12" />
            <div className="flex flex-col gap-1">
              <p className="text-sm text-muted-foreground">Mathematics</p>
              <h2 className="text-2xl font-semibold">Algebra</h2>
            </div>
          </div>
          <Button>
            Continue <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default RecentTopic;
