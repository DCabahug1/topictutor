import { Card } from "@/components/ui/card";
import React from "react";

interface ItemProps {
  title: string;
  icon: React.ReactNode;
  description: string;
  index: number;
  autoHoverIndex: number;
}

function Item({ title, icon, description, index, autoHoverIndex }: ItemProps) {
  return (
    <Card
      className={`min-w-0 h-full p-4 flex-1 flex flex-col gap-4 items-center shadow-xl border-primary/40 hover:border-primary transition-all duration-150 ${
        autoHoverIndex === index ? "border-primary" : ""
      }`}
    >
      <div className="flex flex-col">
        <h2 className="text-center text-lg font-semibold">
          {index + 1}. {title}
        </h2>
        <p className="text-center text-sm font-thin text-muted-foreground">{description}</p>
      </div>
      <div className="h-20 w-20 flex items-center justify-center rounded-full bg-primary text-white border-6 border-background/40">
        {icon}
      </div>
    </Card>
  );
}

export default Item;
