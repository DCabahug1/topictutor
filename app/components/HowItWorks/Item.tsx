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
    <Card className={`min-w-0 h-full p-4 flex-1 flex flex-col items-center shadow-xl border-primary/40 hover:border-primary transition-all duration-150 ${autoHoverIndex === index ? "border-primary" : ""}`}>
      <h2 className="text-center text-lg font-semibold">
        {index + 1}. {title}
      </h2>
      {icon}
      <p className="text-center text-sm font-medium">{description}</p>
    </Card>
  );
}

export default Item;
