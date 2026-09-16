// src/components/ai/SpoilerSelector.jsx
import { Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const OPTIONS = [
  {
    value: "none",
    label: "No spoilers",
    icon: ShieldCheck,
    color: "text-green-400",
    hint: "Safe for anyone",
  },
  {
    value: "up_to",
    label: "Up to episode",
    icon: ShieldAlert,
    color: "text-amber-400",
    hint: "Progress-aware",
  },
  {
    value: "full",
    label: "Full spoilers",
    icon: Shield,
    color: "text-brand",
    hint: "Anything goes",
  },
];

export default function SpoilerSelector({
  level,
  upTo,
  totalEpisodes,
  onChange,
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
        Spoiler protection
      </p>

      <div className="flex gap-1.5">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange({ level: o.value, upTo })}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] font-medium transition",
              level === o.value
                ? "border-brand bg-brand/10 text-text-primary"
                : "border-border-dark bg-surface-dark text-text-secondary hover:border-brand/40",
            )}
            title={o.hint}
          >
            <o.icon className={cn("h-3.5 w-3.5", o.color)} />
            {o.label}
          </button>
        ))}
      </div>

      {level === "up_to" && (
        <div className="flex items-center gap-2 pt-1">
          <span className="text-[11px] text-text-secondary">Up to episode</span>
          <input
            type="number"
            min={1}
            max={totalEpisodes || 999}
            value={upTo}
            onChange={(e) =>
              onChange({
                level,
                upTo: Math.max(1, Number(e.target.value) || 1),
              })
            }
            className="input-dark !w-20 !py-1 !text-xs"
          />
          {totalEpisodes > 0 && (
            <span className="text-[11px] text-text-muted">
              of {totalEpisodes}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
