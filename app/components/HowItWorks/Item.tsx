import { Card } from "@/components/ui/card";
import React from "react";

interface ItemProps {
  title: string;
  icon: React.ReactNode;
  description: string;
  index: number;
  isAutoHovering?: boolean;
}

function Item({ title, icon, description, index, isAutoHovering }: ItemProps) {
  return (
    <Card
      className={`min-w-0 h-full p-4 flex-1 flex flex-col items-center shadow-xl hover:translate-y-[-10px] border-2 transition-all duration-300 cursor-default ${
        isAutoHovering
          ? "border-primary"
          : "border-primary/30 hover:border-primary"
      }`}
    >
      <h2 className="text-center text-lg font-semibold">
        {index + 1}. {title}
      </h2>
      <div className="flex justify-center items-center bg-primary text-white border-10 border-background/20 p-4 rounded-full">
        {icon}
      </div>
      <p className="text-center text-sm font-medium">{description}</p>
    </Card>
  );
}

export default Item;
