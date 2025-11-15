import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { topicService } from "@/lib/topics";
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
import { redirect } from "next/navigation";

function NewTopicButton({ fetchTopics }: { fetchTopics: () => void }) {
  const [newTopic, setNewTopic] = useState<string>("");

  const [message, setMessage] = useState<{
    type: "success" | "error" | "warning" | "info";
    text: string;
  }>({
    type: "info",
    text: "",
  });
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const toPlacementTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    redirect(
      "/placement-test?topic=" + encodeURIComponent(newTopic)
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="w-full" asChild>
        <Button variant="outline" className="w-full">
          <p>New Topic</p>
          <Plus />
        </Button>
      </DialogTrigger>

      <DialogContent className="gap-3">
        <DialogHeader>
          <DialogTitle>New Topic</DialogTitle>
          <DialogDescription>
            Describe what you want to learn, and we’ll create a course for you.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={toPlacementTest} className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            {/* <Label>Topic/Description</Label> */}
            <Input
              required
              placeholder="e.g. Basics of Web Development"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
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
            setNewTopic("");
          }}
        >
          Cancel
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export default NewTopicButton;
