export interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
  image_url?: string;
}

export interface Subject {
  id: string;
  user_id: string;
  title: string;
  category: string;
  status: "Not Started" | "In Progress" | "Completed";
  description: string;
  created_at: string;
  updated_at: string;
}

export interface PlacementTest {
  questions: {
    question: string;
    answers: {
      answer: string;
      isCorrect: boolean;
    }[];
  }[];
}

export interface PlacementTestResults {
  subject: string;
  q1: {
    question: string;
    answer: string;
    isCorrect: boolean;
  };
  q2: {
    question: string;
    answer: string;
    isCorrect: boolean;
  };
  q3: {
    question: string;
    answer: string;
    isCorrect: boolean;
  };
  q4: {
    question: string;
    answer: string;
    isCorrect: boolean;
  };
  q5: {
    question: string;
    answer: string;
    isCorrect: boolean;
  };
  q6: {
    question: string;
    answer: string;
    isCorrect: boolean;
  };
  q7: {
    question: string;
    answer: string;
    isCorrect: boolean;
  };
  q8: {
    question: string;
    answer: string;
    isCorrect: boolean;
  };
  q9: {
    question: string;
    answer: string;
    isCorrect: boolean;
  };
  q10: {
    question: string;
    answer: string;
    isCorrect: boolean;
  };
}
