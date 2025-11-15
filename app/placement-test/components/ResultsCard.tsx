import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PlacementTestResults } from "@/lib/models";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";

function ResultsCard({
  placementTestResults,
  showResults,
}: {
  placementTestResults: PlacementTestResults;
  showResults: boolean;
}) {

  const score = placementTestResults.questions.filter(
    (question) => question.answer === question.correctAnswer
  ).length;
  const percentage = (score / placementTestResults.questions.length) * 100;

  return (
    <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        viewport={{once: true }}
        className={`${showResults ? "" : "hidden"} w-full`}
      >
    <Card id="resultsCard" className="w-full max-w-3xl">
      <CardHeader>
        <h1 className="text-2xl font-bold">Results</h1>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-2">
        <div className="flex flex-col items-center justify-center h-40 w-40 gap-2 bg-primary text-primary-foreground border-8 border-border/40 rounded-full">
          <h2 className="text-xl font-bold">Score</h2>
          <p className="text-3xl font-bold">
            {placementTestResults.questions.filter(
              (question) => question.answer === question.correctAnswer
            ).length +
              " / " +
              placementTestResults.questions.length}
          </p>
        </div>
        <div className="flex flex-col items-center justify-center">
          <h2 className="text-xl max-w-md text-center font-bold">{percentage >= 70 ? "Looks like you already have a strong foundation!" : "That's okay! That's why we're here."}</h2>
          <p className="text-center text-muted-foreground">
            {percentage >= 70
              ? "Let's reinforce your knowledge."
            : "Let's cover the basics."}
          </p>
        </div>
        <Button className="w-full max-w-3xl">Get Started</Button>
      </CardContent>
    </Card>
    </motion.div>
  );
}

export default ResultsCard;
