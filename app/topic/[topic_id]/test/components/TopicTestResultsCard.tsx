import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TestResults, Topic } from "@/lib/models";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Trophy, CheckCircle, XCircle } from "lucide-react";
import { updateTopicCompletion } from "@/lib/topics";
import { saveTestResult } from "@/lib/testResults";

function TopicTestResultsCard({
  topic,
  topicTestResults,
  showResults,
}: {
  topic: Topic;
  topicTestResults: TestResults;
  showResults: boolean;
}) {
  const router = useRouter();
  const [isUpdatingCompletion, setIsUpdatingCompletion] = useState(false);
  const score = topicTestResults.questions.filter(
    (question) => question.answer === question.correctAnswer
  ).length;
  const percentage = (score / topicTestResults.questions.length) * 100;
  const passed = percentage >= 70;

  // Save test results and update topic completion status when test is completed
  useEffect(() => {
    if (showResults && topicTestResults.questions.length > 0) {
      const handleTestCompletion = async () => {
        setIsUpdatingCompletion(true);
        try {
          // Always save test results regardless of pass/fail
          await saveTestResult({
            result: topicTestResults,
            type: 'topic',
            topic_id: topic.id,
          });
          console.log("Topic test results saved successfully");

          // Only mark topic as completed if test was passed and not already completed
          if (passed && !topic.completed) {
            const { success } = await updateTopicCompletion(topic.id, true);
            if (success) {
              console.log("Topic marked as completed!");
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
  }, [showResults, passed, topic.completed, topic.id, topicTestResults]);


  const getScoreMessage = () => {
    if (percentage >= 90) return "Outstanding! You've mastered this topic!";
    if (percentage >= 70) return "Great job! You've completed the course successfully!";
    if (percentage >= 50) return "Good effort! Consider reviewing the material.";
    return "Keep studying! Review the chapters and try again.";
  };

  const getScoreDescription = () => {
    if (percentage >= 90) return "You've demonstrated excellent understanding of the material.";
    if (percentage >= 70) return "You've shown solid comprehension of the key concepts.";
    if (percentage >= 50) return "You have a basic understanding but could benefit from more practice.";
    return "Consider reviewing the course material before retaking the test.";
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      viewport={{ once: true }}
      className={`${showResults ? "" : "hidden"} w-full flex items-center justify-center`}
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
          <div className={`flex flex-col items-center justify-center h-40 w-40 gap-2 ${
            passed ? 'bg-green-500 border-border/40' : 'bg-red-500 border-border/40'
          } border-8 rounded-full`}>
            <h2 className="text-xl font-bold text-white">Score</h2>
            <p className={`text-3xl font-bold text-white`}>
              {score} / {topicTestResults.questions.length}
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
                  {isUpdatingCompletion ? "Saving Results & Marking Complete..." : "Course Completed!"}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full max-w-md">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.push(`/topic/${topic.id}`)}
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
            
            {passed && (
              <Button
                className="flex-1"
                onClick={() => router.push("/dashboard")}
              >
                Dashboard
              </Button>
            )}
          </div>

          {/* Question breakdown */}
          {/* <div className="w-full max-w-md mt-4">
            <h3 className="text-lg font-semibold mb-2">Question Breakdown</h3>
            <div className="space-y-2">
              {topicTestResults.questions.map((question, index) => {
                const isCorrect = question.answer === question.correctAnswer;
                return (
                  <div
                    key={index}
                    className={`flex items-center gap-2 p-2 rounded ${
                      isCorrect ? 'bg-green-500/40 border border-green-500' : 'bg-red-500/40 border border-red-500'
                    }`}
                  >
                    {isCorrect ? (
                      <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                    <span className={`text-sm ${isCorrect ? 'text-green-600' : 'text-red-600'} truncate`}>
                      Question {index + 1}
                    </span>
                    {!isCorrect && (
                      <span className="text-xs text-red-600 ml-auto">
                        Incorrect
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div> */}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default TopicTestResultsCard;
