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
  name: string;
  status: "created" | "started" | "finished";
  category: string;
  description: string;
  created_at: string;
  updated_at: string;
}
