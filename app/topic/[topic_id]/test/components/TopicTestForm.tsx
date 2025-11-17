"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { generateTopicTest } from "@/lib/topicTest";
import { getChaptersByTopicId } from "@/lib/chapters";
import { getTopicById } from "@/lib/topics";
import { Test, TestResults, Topic, Chapter } from "@/lib/models";
import { Loader2 } from "lucide-react";
import QuestionCard from "@/app/placement-test/components/QuestionCard";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { QuestionResult } from "@/lib/models";
import TopicTestResultsCard from "./TopicTestResultsCard";

function TopicTestForm() {
  const router = useRouter();
  const { topic_id } = useParams();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [topicTest, setTopicTest] = useState<Test | null>(null);
  const [topicTestCompleted, setTopicTestCompleted] = useState(false);
  const [topicTestResults, setTopicTestResults] = useState<TestResults>({
    topic: "",
    questions: [],
  });
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const hasRequestedTest = useRef(false);

  // Get topic and chapters data
  useEffect(() => {
    if (!topic_id) {
      router.push("/dashboard");
      return;
    }

    const loadTopicData = async () => {
      setLoading(true);

      // Get topic information
      const { data: topicData, error: topicError } = await getTopicById({
        id: topic_id as string,
      });
      if (topicError) {
        console.log("Error loading topic:", topicError);
        router.push("/dashboard");
        return;
      }
      if (topicData && topicData.length > 0) {
        setTopic(topicData[0]);
        setTopicTestResults((prev) => ({ ...prev, topic: topicData[0].title }));
      }

      // Get chapters
      const { data: chaptersData, error: chaptersError } = await getChaptersByTopicId(
        topic_id as string
      );
      if (chaptersError) {
        console.log("Error loading chapters:", chaptersError);
        return;
      }
      if (chaptersData) {
        setChapters(chaptersData);
      }

      setLoading(false);
    };

    loadTopicData();
  }, [topic_id, router]);

  // Generate test when topic and chapters are loaded
  useEffect(() => {
    if (!topic || chapters.length === 0) {
      return;
    }

    // Prevent duplicate API calls in Strict Mode
    if (hasRequestedTest.current) {
      return;
    }

    hasRequestedTest.current = true;

    const getTopicTest = async () => {
      setLoading(true);

      const { data, error } = await generateTopicTest(topic.title, chapters);
      if (error) {
        console.log("Error generating topic test:", error);
      }
      if (data) {
        console.log("Topic test generated successfully.");
        setTopicTest(data);
        // Initialize questions array with empty QuestionResult objects
        const initialQuestions: QuestionResult[] = data.questions.map(
          (question: any) => ({
            prompt: question.prompt,
            answer: "",
            correctAnswer:
              question.answerOptions.find((option: any) => option.isCorrect)
                ?.answer || "",
          })
        );

        setTopicTestResults({
          topic: topic.title || "",
          questions: initialQuestions,
        });
      }
      setLoading(false);
    };

    // Initialize with empty array first
    setTopicTestResults({
      topic: topic.title || "",
      questions: [],
    });

    getTopicTest();
  }, [topic, chapters]);

  // Check if all questions are answered
  useEffect(() => {
    const isAllQuestionsAnswered = topicTestResults.questions.every(
      (question) => question.answer !== ""
    );

    console.log("topicTestResults", topicTestResults);
    setTopicTestCompleted(isAllQuestionsAnswered);
  }, [topicTestResults]);

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
          <p className="text-center font-bold">Generating final test...</p>
          <p className="text-center text-muted-foreground text-xs">
            This may take a few seconds
          </p>
        </div>
      </motion.div>
    );
  }

  if (!topicTest || !topic) {
    return (
      <div className="flex-1 min-h-0 flex items-center justify-center">
        <p>Failed to load final test. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold">Final Test</h1>
        <p className="text-l text-center text-muted-foreground">
          Test your knowledge of {topic.title} with this comprehensive final exam.
        </p>
      </div>
      <div className="flex flex-col gap-2 w-full max-w-3xl">
        {topicTest.questions.map((question, index) => (
          <QuestionCard
            key={index}
            question={question}
            index={index}
            showResults={showResults}
            placementTestResults={topicTestResults}
            setPlacementTestResults={setTopicTestResults}
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
          disabled={!topicTestCompleted || showResults}
          onClick={() => {
            setShowResults(true);
            // Wait for the results card to render before scrolling
            setTimeout(() => {
              const resultsCard = document.getElementById("topicTestResultsCard");
              if (resultsCard) {
                resultsCard.scrollIntoView({ behavior: "smooth" });
              }
            }, 100); // Small delay to ensure the component has rendered
          }}
        >
          Submit Final Test
        </Button>
      </motion.div>

      <TopicTestResultsCard
        topic={topic}
        topicTestResults={topicTestResults}
        showResults={showResults}
      />
    </div>
  );
}

export default TopicTestForm;
