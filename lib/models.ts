export interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
  image_url?: string;
}

export interface Topic {
  id: string;
  user_id: string;
  title: string;
  category: string;
  status: "Not Started" | "In Progress" | "Completed";
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Question {
  prompt: string;
  answerOptions: {
    answer: string;
    isCorrect: boolean;
  }[];
}

export interface PlacementTest {
  questions: Question[];
}


export interface QuestionResult {
  prompt: string;
  answer: string;
  correctAnswer: string;
}

export interface PlacementTestResults {
  topic: string;
  questions: QuestionResult[];
}
