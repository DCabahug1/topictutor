"use client";

import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";

/** "Name something you want to learn": hands the topic to Start a series, which reads `topic`. */
export function TopicForm() {
  const id = useId();
  const router = useRouter();
  const [topic, setTopic] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const text = topic.trim();
    router.push(text ? `/series/new?topic=${encodeURIComponent(text)}` : "/series/new");
  };

  return (
    <form onSubmit={submit} className="mt-11 max-w-[600px] border-0 border-t border-solid border-(--rule) pt-[18px]">
      <label htmlFor={id} className="block text-[18px] italic text-(--ink-soft)">
        Or name something you want to learn, and we’ll build a series.
      </label>
      <div className="mt-[10px] flex gap-[10px]">
        <input
          id={id}
          type="text"
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          placeholder="Basics of Web Development"
          autoComplete="off"
          className="h-12 min-w-0 flex-auto border-0 border-b-[1.5px] border-solid border-(--ink) bg-transparent px-[2px] font-serif text-[20px] text-(--ink)"
        />
        <button
          type="submit"
          className="h-12 flex-none cursor-pointer border-[1.5px] border-solid border-(--ink) bg-transparent px-4 font-mono text-[14px] text-(--ink) transition-colors duration-(--duration-instant) hover:bg-(--paper-sunk)"
        >
          Build series
        </button>
      </div>
    </form>
  );
}
