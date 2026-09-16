import { Minus, Plus, Play } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProgressControl({ progress, total, onBump, pending }) {
  return (
    <div className="space-y-2">
      <div className="h-1.5 overflow-hidden rounded-full bg-border-dark">
        <div
          className="h-full rounded-full bg-brand transition-all"
          style={{ width: `${total ? (progress / total) * 100 : 0}%` }}
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onBump(-1)}
            disabled={pending || progress <= 0}
            className="grid h-7 w-7 place-items-center rounded-md border border-border-dark text-text-secondary transition hover:border-brand/60 hover:text-text-primary disabled:opacity-40"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="min-w-[52px] text-center text-xs font-semibold tabular-nums">
            {progress} / {total || "?"}
          </span>
          <button
            onClick={() => onBump(1)}
            disabled={pending || (total && progress >= total)}
            className={cn(
              "grid h-7 w-7 place-items-center rounded-md text-white transition",
              "bg-brand hover:bg-brand-hover disabled:opacity-40",
            )}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        <button
          className="flex items-center gap-1 rounded-md border border-border-dark px-2 py-1 text-[11px] font-semibold text-text-secondary transition hover:border-brand/60 hover:text-text-primary"
          onClick={() => onBump(1)}
        >
          <Play className="h-3 w-3" />
          Next
        </button>
      </div>
    </div>
  );
}
