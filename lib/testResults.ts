"use server";
import { TestResults, TestResult } from "./models";
import { createClient } from "@/utils/supabase/server";

export const saveTestResult = async ({
  result,
  type,
  topic_id,
}: {
  result: TestResults;
  type: 'placement' | 'topic';
  topic_id?: string;
}) => {
  const supabase = await createClient();

  // Get the current user
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return { success: false, error: { message: "User not authenticated" } };
  }

  const testResultData = {
    user_id: userData.user.id,
    result: result,
    type: type,
    topic_id: topic_id ? parseInt(topic_id) : null,
  };

  const { data, error } = await supabase
    .from("test_results")
    .insert([testResultData])
    .select("*");

  if (error) {
    console.log("Error saving test result:", error);
    return { success: false, error };
  }

  console.log("Test result saved successfully:", data);
  return { success: true, data };
};

export const getTestResultsByTopicId = async (topicId: string) => {
  const supabase = await createClient();

  // Get the current user
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return { success: false, error: { message: "User not authenticated" } };
  }

  const { data, error } = await supabase
    .from("test_results")
    .select("*")
    .eq("topic_id", parseInt(topicId))
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.log("Error getting test results:", error);
    return { success: false, error };
  }

  return { success: true, data };
};

export const getPlacementTestResults = async () => {
  const supabase = await createClient();

  // Get the current user
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return { success: false, error: { message: "User not authenticated" } };
  }

  const { data, error } = await supabase
    .from("test_results")
    .select("*")
    .eq("type", "placement")
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.log("Error getting placement test results:", error);
    return { success: false, error };
  }

  return { success: true, data };
};

export const getTestResultsByType = async (type: 'placement' | 'topic') => {
  const supabase = await createClient();

  // Get the current user
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return { success: false, error: { message: "User not authenticated" } };
  }

  const { data, error } = await supabase
    .from("test_results")
    .select("*")
    .eq("type", type)
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.log("Error getting test results by type:", error);
    return { success: false, error };
  }

  return { success: true, data };
};
