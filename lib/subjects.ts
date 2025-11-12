import { Subject } from "./models";
import { createClient } from "@/utils/supabase/client";
import { generateSubjectInfo } from "./aigenerations";

const createSubject = async (subject: { title: string }) => {
  const supabase = createClient();

  const { data: generatedSubjectInfo, error: subjectInfoError } = await generateSubjectInfo(subject);

  if (subjectInfoError) {
    console.log("Error generating subject info:", subjectInfoError);
    return { data: null, error: subjectInfoError };
  }

  const subjectInfo = {title: subject.title, ...generatedSubjectInfo};

  const { data, error } = await supabase.from("subjects").insert([subjectInfo]);

  if (error) {
    console.log("Error creating subject:", error);
    return { data: null, error };
  }

  return { data, error: null };
};



const getSubjects = async () => {
  const supabase = createClient();

  const { data, error } = await supabase.from("subjects").select("*");

  if (error) {
    console.log("Error getting subjects:", error);
    return { success: false, error };
  }

  return { success: true, data };
};

// Checks title, category, description
const getSubjectsByQuery = async ({ query }: { query: string }) => {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("subjects")
    .select("*")
    .or(
      `title.ilike.%${query}%,category.ilike.%${query}%,description.ilike.%${query}%`
    );

  if (error) {
    console.log("Error getting subjects:", error);
    return { success: false, error };
  }

  return { success: true, data };
};

export const subjectService = {
  createSubject,
  getSubjects,
  getSubjectsByQuery,
};
