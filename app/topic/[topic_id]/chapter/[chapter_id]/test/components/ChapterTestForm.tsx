"use client";
import React, { useEffect, useState, useRef } from "react";
import { Test, TestResults, Topic, Chapter, QuestionResult } from "@/lib/models";
import { Loader2 } from "lucide-react";
import QuestionCard from "@/app/placement-test/components/QuestionCard";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import ChapterTestResultsCard from "./ChapterTestResultsCard";
import { getTestResultsByTopicId } from "@/lib/testResults";
import { useParams } from "next/navigation";
import { getChapterById } from "@/lib/chapters";
import { generateChapterTest } from "@/lib/chapterTest";

function ChapterTestForm() {
  const { topic_id, chapter_id } = useParams();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [chapterTest, setChapterTest] = useState<Test | null>(null);
  const [chapterTestResults, setChapterTestResults] = useState<TestResults>({
    topic: "",
    questions: [],
  });
  const [showResults, setShowResults] = useState(false);
  const [failedToGetChapterTest, setFailedToGetChapterTest] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chapterTestCompleted, setChapterTestCompleted] = useState(false);

  const hasRequestedTest = useRef(false);

  useEffect(() => {
    const fetchChapterTest = async () => {
      if (hasRequestedTest.current) {
        return;
      }
      hasRequestedTest.current = true;
      setLoading(true);
      try {
        const { data: allTestResults, error: testResultsError } =
          await getTestResultsByTopicId(topic_id as string);

        if (testResultsError) {
          console.error(
            "Error fetching test results:",
            testResultsError
          );
          return;
        }

        const placementTestResults = allTestResults.filter(
          (testResult) => testResult.type === "placement"
        )[0];

        if (!placementTestResults) {
          console.error("No placement test results found");
          return;
        }

        const { data: chapter, error: chapterError } = await getChapterById(
          chapter_id as string
        );

        if (chapterError || !chapter) {
          console.error("Error fetching chapter:", chapterError);
          return;
        }

        const { data: chapterTest, error: chapterTestError } =
          await generateChapterTest(chapter[0], placementTestResults);

        if (chapterTestError || !chapterTest) {
          console.error("Error generating chapter test:", chapterTestError);
          return;
        }
        
        setChapterTest(chapterTest);
        setChapter(chapter[0]);
        
        // Initialize questions array with empty QuestionResult objects
        const initialQuestions: QuestionResult[] = chapterTest.questions.map(
          (question) => ({
            prompt: question.prompt,
            answer: "",
            correctAnswer:
              question.answerOptions.find((option) => option.isCorrect)
                ?.answer || "",
          })
        );

        setChapterTestResults({
          topic: chapter[0].title || "",
          questions: initialQuestions,
        });
      } catch (error) {
        console.error("Error fetching chapter test:", error);
        setFailedToGetChapterTest(true);
      } finally {
        setLoading(false);
      }
    };
    
    fetchChapterTest();
  }, []);

  // Check if all questions are answered
  useEffect(() => {
    const isAllQuestionsAnswered = chapterTestResults.questions.every(
      (question) => question.answer !== ""
    );

    console.log("chapterTestResults", chapterTestResults);
    setChapterTestCompleted(isAllQuestionsAnswered);
  }, [chapterTestResults]);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex-1 min-h-0 flex items-center justify-center flex-col gap-2"
      >
        <Loader2 className="w-8 h-8 animate-spin" />
        <div className="flex flex-col items-center justify-center animate-pulse">
          <p className="text-center font-bold">Generating mastery check...</p>
          <p className="text-center text-muted-foreground text-xs">
            This may take a few seconds
          </p>
        </div>
      </motion.div>
    );
  }

  if (failedToGetChapterTest) {
    return (
      <div className="flex-1 min-h-0 flex items-center justify-center">
        <p>Failed to load mastery check. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold">Mastery Check</h1>
        <p className="text-l text-center text-muted-foreground">
          Test your knowledge of{" "}
          <span className="font-bold">Chapter {chapter?.chapter_number}: {chapter?.title}</span> with this
          comprehensive assessment.
        </p>
      </div>
      <div className="flex flex-col gap-2 w-full max-w-3xl">
        {chapterTest?.questions.map((question, index) => (
          <QuestionCard
            key={index}
            question={question}
            index={index}
            showResults={showResults}
            placementTestResults={chapterTestResults}
            setPlacementTestResults={setChapterTestResults}
          />
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1 }}
        viewport={{ once: true, amount: "all" }}
        className="w-full flex items-center justify-center"
      >
        <Button
          className="w-full max-w-3xl"
          disabled={!chapterTestCompleted || showResults}
          onClick={() => {
            setShowResults(true);
            // Wait for the results card to render before scrolling
            setTimeout(() => {
              const resultsCard = document.getElementById(
                "topicTestResultsCard"
              );
              if (resultsCard) {
                resultsCard.scrollIntoView({ behavior: "smooth" });
              }
            }, 100); // Small delay to ensure the component has rendered
          }}
        >
          Submit
        </Button>
      </motion.div>

      {chapter && (
        <ChapterTestResultsCard
          chapter={chapter}
          chapterTestResults={chapterTestResults}
          showResults={showResults}
        />
      )}
    </div>
  );
}

export default ChapterTestForm;
