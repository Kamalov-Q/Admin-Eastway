"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StarRating({
  value,
  onChange,
  readOnly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  readOnly?: boolean;
}) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const active = hover ? n <= hover : n <= value;
        return (
          <Star
            key={n}
            className={cn(
              "cursor-pointer transition",
              active ? "fill-yellow-400 text-yellow-500" : "text-gray-400",
              readOnly && "cursor-default"
            )}
            onMouseEnter={() => !readOnly && setHover(n)}
            onMouseLeave={() => !readOnly && setHover(0)}
            onClick={() => !readOnly && onChange?.(n)}
          />
        );
      })}
    </div>
  );
}
