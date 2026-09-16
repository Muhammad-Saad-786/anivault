// src/components/ai/SuggestedPrompts.jsx
import { cn } from "@/lib/utils";

const DEFAULT_PROMPTS = [
  "What is this anime about?",
  "Should I watch this?",
  "Is it suitable for beginners?",
  "What order should I watch this in?",
  "How many seasons are there?",
  "Who is the main character?",
  "Recommend similar anime",
];

export default function SuggestedPrompts({
  prompts = DEFAULT_PROMPTS,
  onPick,
  disabled,
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {prompts.map((p) => (
        <button
          key={p}
          onClick={() => onPick?.(p)}
          disabled={disabled}
          className={cn(
            "rounded-full border border-border-dark bg-surface-dark px-3 py-1.5 text-[11px] font-medium text-text-secondary transition",
            !disabled && "hover:border-brand/60 hover:text-text-primary",
            disabled && "cursor-not-allowed opacity-40",
          )}
        >
          {p}
        </button>
      ))}
    </div>
  );
}
