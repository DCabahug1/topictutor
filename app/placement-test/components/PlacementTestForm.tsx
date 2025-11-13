"use client";
import React, { useEffect, useState } from "react";
import { redirect, useSearchParams } from "next/navigation";
import { generatePlacementTest } from "@/lib/aigenerations";
import { PlacementTest, PlacementTestResults } from "@/lib/models";
import { Loader2 } from "lucide-react";
import Question from "./Question";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";

function PlacementTestForm() {
  const searchParams = useSearchParams();
  const subject = searchParams.get("subject");
  
  const [placementTest, setPlacementTest] = useState<PlacementTest | null>(null);
  const [placementTestCompleted, setPlacementTestCompleted] = useState(false);
  const [placementTestResults, setPlacementTestResults] = useState<PlacementTestResults>({
    subject: subject || "",
    q1: { question: "", answer: "", isCorrect: false },
    q2: { question: "", answer: "", isCorrect: false },
    q3: { question: "", answer: "", isCorrect: false },
    q4: { question: "", answer: "", isCorrect: false },
    q5: { question: "", answer: "", isCorrect: false },
    q6: { question: "", answer: "", isCorrect: false },
    q7: { question: "", answer: "", isCorrect: false },
    q8: { question: "", answer: "", isCorrect: false },
    q9: { question: "", answer: "", isCorrect: false },
    q10: { question: "", answer: "", isCorrect: false },
  });
  const [loading, setLoading] = useState(true);

  // Redirect if no subject
  if (!subject) {
    redirect("/dashboard");
  }

  // Initialize placement test results when subject changes
  useEffect(() => {
    setPlacementTestResults({
      subject: subject || "",
      q1: { question: "", answer: "", isCorrect: false },
      q2: { question: "", answer: "", isCorrect: false },
      q3: { question: "", answer: "", isCorrect: false },
      q4: { question: "", answer: "", isCorrect: false },
      q5: { question: "", answer: "", isCorrect: false },
      q6: { question: "", answer: "", isCorrect: false },
      q7: { question: "", answer: "", isCorrect: false },
      q8: { question: "", answer: "", isCorrect: false },
      q9: { question: "", answer: "", isCorrect: false },
      q10: { question: "", answer: "", isCorrect: false },
    });

    const getPlacementTest = async () => {
      const { data, error } = await generatePlacementTest(subject);
      if (error) {
        console.log(error);
      }
      if (data) {
        setPlacementTest(data);
      }
      setLoading(false);
    };
    getPlacementTest();
  }, [subject]);

  // Check if all questions are answered
  useEffect(() => {
    const isAllQuestionsAnswered = Object.values(placementTestResults).every(
      (question) => {
        if (typeof question === "string") return true; // subject field
        return question.answer !== "";
      }
    );

    setPlacementTestCompleted(isAllQuestionsAnswered);
  }, [placementTestResults]);

  const handleSubmit = () => {
    console.log("placementTestResults", placementTestResults);
    // TODO: Handle submission logic
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex-1 min-h-0 flex items-center justify-center flex-col gap-2"
      >
        <Loader2 className="w-8 h-8 animate-spin" />
        <div className="flex flex-col items-center justify-center">
          <p className="text-center font-bold">Generating placement test...</p>
          <p className="text-center text-muted-foreground text-xs">
            This may take a few seconds
          </p>
        </div>
      </motion.div>
    );
  }

  if (!placementTest) {
    return (
      <div className="flex-1 min-h-0 flex items-center justify-center">
        <p>Failed to load placement test. Please try again.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold">Quick Level Check</h1>
        <p className="text-l text-center text-muted-foreground">
          Take a quick assessment to see where you stand in your subject.
        </p>
      </div>
      <div className="flex flex-col gap-2 w-full max-w-3xl">
        {placementTest.questions.map((question, index) => (
          <Question
            key={index}
            question={question}
            index={index}
            placementTestResults={placementTestResults}
            setPlacementTestResults={setPlacementTestResults}
          />
        ))}
      </div>
      <Button
        className="w-full max-w-3xl"
        disabled={!placementTestCompleted}
        onClick={handleSubmit}
      >
        Submit
      </Button>
    </>
  );
}

export default PlacementTestForm;
