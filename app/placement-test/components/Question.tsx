import { Card, CardContent, CardHeader } from "@/components/ui/card";
import React from "react";
import { PlacementTestResults } from "@/lib/models";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { motion } from "motion/react";
function Question({
  question,
  index,
  placementTestResults,
  setPlacementTestResults,
}: {
  question: {
    question: string;
    answers: { answer: string; isCorrect: boolean }[];
  };
  index: number;
  placementTestResults: PlacementTestResults;
  setPlacementTestResults: React.Dispatch<
    React.SetStateAction<PlacementTestResults>
  >;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }}>
      <Card className="gap-2">
        <CardHeader>
          <h1 className="font-bold">
            Q{index + 1}. {question.question}
          </h1>
        </CardHeader>
        <CardContent>
          <RadioGroup>
            {question.answers.map((answer, answerIndex) => (
              <div className="flex items-center space-x-2" key={answerIndex}>
                <RadioGroupItem
                  value={answer.answer}
                  id={answer.answer}
                  onClick={() => {
                    setPlacementTestResults({
                      ...placementTestResults,
                      [`q${index + 1}`]: {
                        question: question.question,
                        answer: answer.answer,
                        isCorrect: answer.isCorrect,
                      },
                    });
                  }}
                />
                <Label htmlFor={answer.answer}>{answer.answer}</Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default Question;
