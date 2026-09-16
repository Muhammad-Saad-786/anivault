import { Star } from "lucide-react";
import { cn, formatScore } from "@/lib/utils";

export default function ScoreBadge({ score, className }) {
  if (score == null) return null;
  const tone =
    score >= 8
      ? "bg-green-500/90"
      : score >= 6
        ? "bg-amber-500/90"
        : "bg-red-500/90";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-bold text-white backdrop-blur",
        tone,
        className,
      )}
    >
      <Star className="h-3 w-3 fill-white" />
      {formatScore(score)}
    </span>
  );
}
