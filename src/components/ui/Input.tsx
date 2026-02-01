import type { InputHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm " +
          "placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-yellow/35",
        className
      )}
      {...props}
    />
  );
}
