// src/components/anime/WatchOrder.jsx
import { Link } from "react-router-dom";
import { GitBranch, ArrowRight } from "lucide-react";

export default function WatchOrder({ anime }) {
  const prequels = (anime.relations || []).filter(
    (r) => r.relation === "PREQUEL",
  );
  const sequels = (anime.relations || []).filter(
    (r) => r.relation === "SEQUEL",
  );

  if (prequels.length === 0 && sequels.length === 0) return null;

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center gap-2">
        <GitBranch className="h-4 w-4 text-brand" />
        <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted">
          Watch Order
        </h3>
      </div>

      <div className="space-y-2 text-sm">
        {prequels.length > 0 && (
          <div>
            <p className="mb-1 text-[11px] uppercase tracking-wider text-blue-400">
              Watch first
            </p>
            {prequels.map((r) => (
              <WatchOrderLink key={r.entry.id} entry={r.entry} />
            ))}
          </div>
        )}

        <div className="flex items-center gap-1.5 rounded-md bg-brand/10 px-2.5 py-1.5 text-xs font-semibold text-brand">
          ▶ You are here
        </div>

        {sequels.length > 0 && (
          <div>
            <p className="mb-1 text-[11px] uppercase tracking-wider text-text-secondary">
              Watch next
            </p>
            {sequels.map((r) => (
              <WatchOrderLink key={r.entry.id} entry={r.entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function WatchOrderLink({ entry }) {
  const id = entry.mal_id ?? entry.id;
  const title = entry.title_english || entry.title_romaji || entry.title;
  return (
    <Link
      to={`/anime/${id}`}
      className="flex items-center gap-2 rounded-md px-2 py-1.5 transition hover:bg-surface-elevated"
    >
      <ArrowRight className="h-3 w-3 shrink-0 text-text-muted" />
      <span className="line-clamp-1 text-xs">{title}</span>
    </Link>
  );
}
