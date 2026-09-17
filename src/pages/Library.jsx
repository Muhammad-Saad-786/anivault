import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { getLibrary } from "@/lib/api/library";
import LibraryCard from "@/components/library/LibraryCard";
import Spinner from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import {
  Heart,
  Bookmark,
  Play,
  Pause,
  Check,
  X,
  RotateCcw,
} from "lucide-react";
import SEO from "@/components/SEO";

const TABS = [
  { value: "watching", label: "Watching", icon: Play },
  { value: "completed", label: "Completed", icon: Check },
  { value: "plan_to_watch", label: "Plan", icon: Bookmark },
  { value: "on_hold", label: "On Hold", icon: Pause },
  { value: "dropped", label: "Dropped", icon: X },
  { value: "rewatching", label: "Rewatching", icon: RotateCcw },
  { value: "favorites", label: "Favorites", icon: Heart },
];

export default function Library() {
  const { user } = useAuth();
  const [tab, setTab] = useState("watching");

  const { data, isLoading } = useQuery({
    queryKey: ["library", "all", user?.id],
    queryFn: () => getLibrary(user.id),
    enabled: !!user,
  });

  const entries = data || [];
  const filtered = entries.filter((e) =>
    tab === "favorites" ? e.is_favorite : e.status === tab,
  );

  const counts = TABS.reduce((acc, t) => {
    acc[t.value] = entries.filter((e) =>
      t.value === "favorites" ? e.is_favorite : e.status === t.value,
    ).length;
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <SEO
        title="My Library"
        description="Track your anime, watch progress, favorites, and personal lists in AniVault."
      />
      <div className="mb-6">
        <h1 className="text-2xl font-black sm:text-3xl">My Library</h1>
        <p className="text-sm text-text-secondary">
          {entries.length} anime tracked
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-border-dark pb-px">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition",
              tab === t.value
                ? "border-brand text-text-primary"
                : "border-transparent text-text-secondary hover:text-text-primary",
            )}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
            {counts[t.value] > 0 && (
              <span className="ml-1 rounded-full bg-surface-elevated px-1.5 text-[10px]">
                {counts[t.value]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid place-items-center py-20">
          <Spinner className="h-8 w-8" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-lg font-semibold">Nothing here yet</p>
          <p className="mt-1 text-sm text-text-secondary">
            Start adding anime to this list from any details page.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((entry) => (
            <LibraryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
