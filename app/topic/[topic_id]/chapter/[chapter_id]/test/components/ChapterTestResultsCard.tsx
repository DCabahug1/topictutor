import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TestResults, Chapter } from "@/lib/models";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Trophy, CheckCircle, XCircle } from "lucide-react";
import { updateTopicCompletion } from "@/lib/topics";
import { saveTestResult } from "@/lib/testResults";
import { updateTopicProgress } from "@/lib/chapters";
import { getNeighboringChapters } from "@/lib/chapters";

function ChapterTestResultsCard({
  chapter,
  chapterTestResults,
  showResults,
}: {
  chapter: Chapter;
  chapterTestResults: TestResults;
  showResults: boolean;
}) {
  const router = useRouter();
  const [isUpdatingCompletion, setIsUpdatingCompletion] = useState(false);
  const score = chapterTestResults.questions.filter(
    (question) => question.answer === question.correctAnswer
  ).length;
  const percentage = (score / chapterTestResults.questions.length) * 100;
  const passed = percentage >= 70;
  const [neighboringChapters, setNeighboringChapters] = useState({
    prevChapter: null,
    nextChapter: null,
  });

  useEffect(() => {
    const fetchNeighboringChapters = async () => {
      const { data, error } = await getNeighboringChapters(chapter);
      if (error) {
        console.log("Error fetching neighboring chapters:", error);
      }

      if (data) {
        setNeighboringChapters(data);
      }
    };
    fetchNeighboringChapters();
  }, [chapter]);

  // Update chapter completion status when test is completed
  useEffect(() => {
    if (showResults && chapterTestResults.questions.length > 0) {
      const handleTestCompletion = async () => {
        setIsUpdatingCompletion(true);
        try {
          // Only mark topic as completed if test was passed and not already completed
          if (passed && !chapter.completed) {
            const { data, error } = await updateTopicProgress(
              chapter.topic_id,
              chapter
            );

            if (error) {
              console.log("Error updating topic progress:", error);
            }
          }
        } catch (error) {
          console.error("Error handling test completion:", error);
        } finally {
          setIsUpdatingCompletion(false);
        }
      };

      handleTestCompletion();
    }
  }, [showResults, passed, chapter.completed, chapter.id, chapterTestResults]);

  const getScoreMessage = () => {
    if (percentage >= 90) return "Outstanding! You've mastered this chapter!";
    if (percentage >= 70)
      return "Great job! You've completed the chapter successfully!";
    if (percentage >= 50)
      return "Good effort! Consider reviewing the material.";
    return "Keep studying! Review the chapters and try again.";
  };

  const getScoreDescription = () => {
    if (percentage >= 90)
      return "You've demonstrated excellent understanding of the material.";
    if (percentage >= 70)
      return "You've shown solid comprehension of the key concepts.";
    if (percentage >= 50)
      return "You have a basic understanding but could benefit from more practice.";
    return "Consider reviewing the course material before retaking the test.";
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      viewport={{ once: true }}
      className={`${
        showResults ? "" : "hidden"
      } w-full flex items-center justify-center`}
    >
      <Card id="topicTestResultsCard" className="w-full max-w-3xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            {passed ? (
              <Trophy className="w-6 h-6 text-yellow-500" />
            ) : (
              <XCircle className="w-6 h-6 text-red-500" />
            )}
            <h1 className="text-2xl font-bold">Mastery Results</h1>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <div
            className={`flex flex-col items-center justify-center h-40 w-40 gap-2 ${
              passed
                ? "bg-green-500 border-border/40"
                : "bg-red-500 border-border/40"
            } border-8 rounded-full`}
          >
            <h2 className="text-xl font-bold text-white">Score</h2>
            <p className={`text-3xl font-bold text-white`}>
              {score} / {chapterTestResults.questions.length}
            </p>
          </div>

          <div className="flex flex-col items-center justify-center text-center">
            <h2 className="text-xl max-w-md font-bold mb-2">
              {getScoreMessage()}
            </h2>
            <p className="text-center text-muted-foreground mb-4">
              {getScoreDescription()}
            </p>

            {passed && (
              <div className="flex items-center gap-2 text-green-600 mb-4">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">
                  {isUpdatingCompletion
                    ? "Saving Results & Marking Complete..."
                    : "Course Completed!"}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full max-w-md">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() =>
                router.push(`/topic/${chapter.topic_id}/chapter/${chapter.id}`)
              }
            >
              Back to Course
            </Button>

            {!passed && (
              <Button
                className="flex-1"
                onClick={() => window.location.reload()}
              >
                Retake Test
              </Button>
            )}

            {passed && neighboringChapters.nextChapter && (
              <Button
                className="flex-1"
                onClick={() => router.push(`/topic/${chapter.topic_id}/chapter/${neighboringChapters?.nextChapter?.id}/test`)}
              >
                Next Chapter
                </Button>
              )}
          </div>

          
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default ChapterTestResultsCard;
