import { Card, CardContent, CardHeader } from "@/components/ui/card";
import React from "react";
import { TestResults } from "@/lib/models";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { motion } from "motion/react";
import { Question } from "@/lib/models";
import { Check, X } from "lucide-react";

function QuestionCard({
  question,
  index,
  placementTestResults,
  setPlacementTestResults,
  showResults = false,
}: {
  question: Question;
  index: number;
  placementTestResults: TestResults;
  setPlacementTestResults: React.Dispatch<React.SetStateAction<TestResults>>;
  showResults: boolean;
}) {
  const [isCorrect, setIsCorrect] = React.useState(false);

  const handleQuestionAnswer = (answer: string) => {
    const newPlacementTestResults = [...placementTestResults.questions];
    newPlacementTestResults[index].answer = answer;

    setIsCorrect(
      newPlacementTestResults[index].answer ===
        newPlacementTestResults[index].correctAnswer
    );
    setPlacementTestResults({
      ...placementTestResults,
      questions: newPlacementTestResults,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
    >
      <Card className="gap-2">
        <CardHeader>
          <div className="flex gap-1">
            {showResults ? (
              isCorrect ? (
                <Check strokeWidth={3} stroke="green" size={20} />
              ) : (
                <X strokeWidth={3} stroke="red" size={20} />
              )
            ) : (
              ""
            )}
            <h1 className="flex-1 min-w-0 font-bold">
              Q{index + 1}: {question.prompt}
            </h1>
          </div>
        </CardHeader>
        <CardContent>
          <RadioGroup>
            {question.answerOptions.map((answerOption, answerIndex) => (
              <div className="flex items-center space-x-2" key={answerIndex}>
                <RadioGroupItem
                  value={answerOption.answer + index}
                  id={answerOption.answer + index}
                  onClick={() => {
                    handleQuestionAnswer(answerOption.answer);
                  }}
                  disabled={showResults}
                  className={`${
                    showResults &&
                    answerOption.answer ===
                      placementTestResults.questions[index].correctAnswer
                      ? "border-green-500"
                      : ""
                  } ${
                    showResults &&
                    answerOption.answer !==
                      placementTestResults.questions[index].correctAnswer
                      ? "border-red-500"
                      : ""
                  }`}
                />
                <Label
                  htmlFor={answerOption.answer + index}
                  className="cursor-pointer leading-5"
                >
                  {answerOption.answer}
                </Label>
              </div>
            ))}
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value={"Not sure"}
                id={"Not sure" + index}
                onClick={() => {
                  handleQuestionAnswer("Not sure");
                }}
                disabled={showResults}
                className={`${showResults ? "border-yellow-500" : ""}`}
              />
              <Label
                htmlFor={"Not sure" + index}
                className="cursor-pointer leading-5"
              >
                {"Not sure"}
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default QuestionCard;
