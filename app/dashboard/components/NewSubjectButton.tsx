import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { subjectService } from "@/lib/subjects";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

function NewSubjectButton({ fetchSubjects }: { fetchSubjects: () => void }) {
  const [newSubject, setNewSubject] = useState<{
    title: string;
  }>({
    title: "",
  });

  const [message, setMessage] = useState<{
    type: "success" | "error" | "warning" | "info";
    text: string;
  }>({
    type: "info",
    text: "",
  });
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const createSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await subjectService.createSubject(newSubject);

    if (!error) {
      fetchSubjects();
      setMessage({
        type: "success",
        text: "Subject created successfully",
      });
      // Close dialog and reset form on success
      setTimeout(() => {
        setOpen(false);
        setNewSubject({ title: "" });
        setMessage({ type: "info", text: "" });
      }, 1000); // Show success message briefly before closing
    }

    if (error) {
      setMessage({
        type: "error",
        text: error.message || "An error occurred while creating the subject",
      });
      console.log("error", error);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="w-full" asChild>
        <Button variant="outline" className="w-full">
          <Plus />
        </Button>
      </DialogTrigger>

      <DialogContent className="gap-3">
        <DialogHeader>
          <DialogTitle>New Subject</DialogTitle>
          <DialogDescription>
            Describe what you want to learn, and we’ll create a course for you.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={createSubject} className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            {/* <Label>Topic/Description</Label> */}
            <Input
              required
              placeholder="e.g. Basics of Web Development"
              value={newSubject.title}
              onChange={(e) =>
                setNewSubject({ ...newSubject, title: e.target.value })
              }
            />
          </div>
          {message.text && (
            <p
              className={
                message.type === "success" ? "text-green-500" : "text-red-500"
              }
            >
              {message.text}
            </p>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="animate-spin" /> Generating Course...
              </>
            ) : (
              "Create Course"
            )}
          </Button>
        </form>
        <Button
          variant="outline"
          type="button"
          onClick={() => {
            setOpen(false);
            setMessage({ type: "info", text: "" });
            setNewSubject({ title: "" });
          }}
        >
          Cancel
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export default NewSubjectButton;
