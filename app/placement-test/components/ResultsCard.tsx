import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TestResults } from "@/lib/models";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DialogClose } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { generateCourse } from "@/lib/course";
import { redirect } from "next/navigation";

function ResultsCard({
  topic,
  placementTestResults,
  showResults,
}: {
  topic: string;
  placementTestResults: TestResults;
  showResults: boolean;
}) {
  const score = placementTestResults.questions.filter(
    (question) => question.answer === question.correctAnswer
  ).length;
  const percentage = (score / placementTestResults.questions.length) * 100;
  const [progressMessage, setProgressMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerateCourse = async () => {
    setLoading(true);
    
    // Progress messages to keep user engaged
    const progressMessages = [
      "Analyzing your test results...",
      "Identifying knowledge gaps...",
      "Designing personalized curriculum...",
      "Creating chapter content...",
      "Optimizing learning path...",
      "Finalizing your course...",
    ];
    
    let messageIndex = 0;
    setProgressMessage(progressMessages[0]);
    
    // Iterate through progress messages once, every 5 seconds
    const progressInterval = setInterval(() => {
      messageIndex++;
      if (messageIndex < progressMessages.length) {
        setProgressMessage(progressMessages[messageIndex]);
      } else {
        clearInterval(progressInterval);
      }
    }, 5000);

    try {
      const { data, error } = await generateCourse({
        topic,
        placementTestResults,
      });

      clearInterval(progressInterval);
      
      if (error) {
        console.log(error);
        setProgressMessage("Error generating course. Please try again.");
      }
      if (data) {
        setProgressMessage("Course created successfully! Redirecting...");
        console.log(data);
        setTimeout(() => {
          redirect(`/topic/${data.id}`);
        }, 1000);
      }
    } catch (error) {
      clearInterval(progressInterval);
      setProgressMessage("Something went wrong. Please try again.");
      console.error(error);
    }
    
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      viewport={{ once: true }}
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
            <h2 className="text-xl max-w-md text-center font-bold">
              {percentage >= 70
                ? "Looks like you already have a strong foundation!"
                : "That's okay! That's why we're here."}
            </h2>
            <p className="text-center text-muted-foreground">
              {percentage >= 70
                ? "Let's reinforce your knowledge."
                : "Let's cover the basics."}
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full max-w-3xl" onClick={handleGenerateCourse} disabled={loading}>
                Generate Course
              </Button>
            </DialogTrigger>
            <DialogContent 
              onEscapeKeyDown={(e) => e.preventDefault()}
              onPointerDownOutside={(e) => e.preventDefault()}
              onInteractOutside={(e) => e.preventDefault()}
              showCloseButton={false}
            >
              <DialogHeader className="flex flex-col items-center justify-center">
                <DialogTitle className="text-center">Generating Course...</DialogTitle>
                <DialogDescription className="text-center">
                  This may take a while. Please do not leave this page.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center justify-center gap-4 py-6">
                <Loader2 className="w-8 h-8 animate-spin" />
                {progressMessage && (
                  <p className="text-center text-muted-foreground animate-pulse">
                    {progressMessage}
                  </p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default ResultsCard;
