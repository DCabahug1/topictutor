"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { generatePlacementTest } from "@/lib/placementTests";
import { Test, TestResults } from "@/lib/models";
import { Loader2 } from "lucide-react";
import QuestionCard from "./QuestionCard";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { QuestionResult } from "@/lib/models";
import ResultsCard from "./ResultsCard";

function PlacementTestForm() {
  const router = useRouter();
  const [topic, setTopic] = useState<string>("");
  const [placementTest, setPlacementTest] = useState<Test | null>(null);
  const [placementTestCompleted, setPlacementTestCompleted] = useState(false);
  const [placementTestResults, setPlacementTestResults] = useState<TestResults>(
    {
      topic: "",
      questions: [],
    }
  );
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const hasRequestedTest = useRef(false);

  // Get topic from sessionStorage and redirect if not found
  useEffect(() => {
    const storedTopic = sessionStorage.getItem("placementTestTopic");

    if (!storedTopic) {
      router.push("/dashboard");
      return;
    }

    setTopic(storedTopic);
    setPlacementTestResults((prev) => ({ ...prev, topic: storedTopic }));
  }, []);

  // Initialize placement test results when Topic changes
  useEffect(() => {
    // Only run if topic is available
    if (!topic) {
      return;
    }

    // Prevent duplicate API calls in Strict Mode
    if (hasRequestedTest.current) {
      return;
    }

    hasRequestedTest.current = true;

    const getPlacementTest = async () => {
      const { data, error } = await generatePlacementTest(topic);
      if (error) {
        console.log(error);
      }
      if (data) {
        setPlacementTest(data);
        // Initialize questions array with empty QuestionResult objects
        const initialQuestions: QuestionResult[] = data.questions.map(
          (question) => ({
            prompt: question.prompt,
            answer: "",
            correctAnswer:
              question.answerOptions.find((option) => option.isCorrect)
                ?.answer || "",
          })
        );

        setPlacementTestResults({
          topic: topic || "",
          questions: initialQuestions,
        });
      }
      setLoading(false);
    };

    // Initialize with empty array first
    setPlacementTestResults({
      topic: topic || "",
      questions: [],
    });

    getPlacementTest();
  }, [topic]);

  // Check if all questions are answered
  useEffect(() => {
    const isAllQuestionsAnswered = placementTestResults.questions.every(
      (question) => question.answer !== ""
    );

    console.log("placementTestResults", placementTestResults);

    setPlacementTestCompleted(isAllQuestionsAnswered);
  }, [placementTestResults]);


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
    <div className="flex flex-col items-center gap-2">
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold">Quick Level Check</h1>
        <p className="text-l text-center text-muted-foreground">
          Take a quick assessment to see where you stand in your Topic.
        </p>
      </div>
      <div className="flex flex-col gap-2 w-full max-w-3xl">
        {placementTest.questions.map((question, index) => (
          <QuestionCard
            key={index}
            question={question}
            index={index}
            showResults={showResults}
            placementTestResults={placementTestResults}
            setPlacementTestResults={setPlacementTestResults}
          />
        ))}
      </div>
      <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1 }}
            viewport={{ once: true, amount: "all" }}
            className="w-full"
          >
            <Button
              className="w-full max-w-3xl"
              disabled={!placementTestCompleted || showResults}
              onClick={() => {
                setShowResults(true);
                // Wait for the results card to render before scrolling
                setTimeout(() => {
                  const resultsCard = document.getElementById("resultsCard");
                  if (resultsCard) {
                    resultsCard.scrollIntoView({ behavior: "smooth" });
                  }
                }, 100); // Small delay to ensure the component has rendered
              }}
            >
              Submit
            </Button>
          </motion.div>

      <ResultsCard
        topic={topic}
        placementTestResults={placementTestResults}
        showResults={showResults}
      />
    </div>
  );
}

export default PlacementTestForm;
