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
  description: string;
  chapters_count: number;
  chapters_completed: number;
  created_at: string;
  updated_at: string;
}

export interface Chapter {
  id: string;
  user_id: string;
  topic_id: string;
  title: string;
  description: string;
  content_paragraphs: string[];
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Test {
  questions: Question[];
}

export interface TestResults {
  topic: string;
  questions: QuestionResult[];
}

export interface Question {
  prompt: string;
  answerOptions: {
    answer: string;
    isCorrect: boolean;
  }[];
}

export interface QuestionResult {
  prompt: string;
  answer: string;
  correctAnswer: string;
}