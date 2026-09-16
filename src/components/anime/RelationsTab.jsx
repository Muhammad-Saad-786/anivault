// src/components/anime/RelationsTab.jsx
import { Link } from "react-router-dom";
import { ArrowRight, GitBranch } from "lucide-react";

const RELATION_META = {
  PREQUEL: { label: "Prequel", order: 0, color: "text-blue-400" },
  PARENT: { label: "Parent Story", order: 1, color: "text-text-primary" },
  SEQUEL: { label: "Sequel", order: 2, color: "text-brand" },
  SIDE_STORY: { label: "Side Story", order: 3, color: "text-purple-400" },
  SPIN_OFF: { label: "Spin-off", order: 4, color: "text-amber-400" },
  ALTERNATIVE: { label: "Alternative", order: 5, color: "text-cyan-400" },
  SUMMARY: { label: "Summary", order: 6, color: "text-text-muted" },
  CHARACTER: { label: "Shared Characters", order: 7, color: "text-text-muted" },
  OTHER: { label: "Other", order: 8, color: "text-text-muted" },
};

export default function RelationsTab({ anime }) {
  const relations = anime?.relations || [];

  if (relations.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-text-secondary">
        No related titles.
      </p>
    );
  }

  // Group by relation type
  const grouped = {};
  for (const r of relations) {
    const key = r.relation || "OTHER";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(r.entry);
  }

  // Sort groups by defined order
  const orderedKeys = Object.keys(grouped).sort(
    (a, b) => (RELATION_META[a]?.order ?? 99) - (RELATION_META[b]?.order ?? 99),
  );

  // Compute a suggested watch order if there's a prequel chain
  const watchOrder = buildWatchOrder(relations);

  return (
    <div className="space-y-8">
      {/* Suggested watch order */}
      {watchOrder.length > 1 && (
        <div className="card p-4">
          <div className="mb-3 flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-brand" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">
              Suggested Watch Order
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {watchOrder.map((step, i) => (
              <span key={step.id} className="flex items-center gap-2">
                {i > 0 && <ArrowRight className="h-3 w-3 text-text-muted" />}
                <Link
                  to={`/anime/${step.id}`}
                  className="rounded-full border border-border-dark bg-surface-dark px-3 py-1 font-medium transition hover:border-brand hover:text-brand"
                >
                  {step.title}
                </Link>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Relation groups */}
      {orderedKeys.map((key) => {
        const meta = RELATION_META[key] || {
          label: key,
          color: "text-text-muted",
        };
        const items = grouped[key];
        return (
          <div key={key}>
            <h3
              className={`mb-3 text-xs font-bold uppercase tracking-widest ${meta.color}`}
            >
              {meta.label} · {items.length}
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {items.map((entry, idx) => (
                <RelationCard key={`${entry.id}-${idx}`} anime={entry} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RelationCard({ anime }) {
  const id = anime.mal_id ?? anime.id;
  const title =
    anime.title_english || anime.title_romaji || anime.title || "Untitled";
  const poster =
    anime.images?.webp?.large_image_url ||
    anime.images?.jpg?.large_image_url ||
    anime.images?.jpg?.image_url;

  if (!id || !poster) return null;

  return (
    <Link
      to={`/anime/${id}`}
      className="group block overflow-hidden rounded-card border border-border-dark bg-surface-card transition hover:border-brand/60"
    >
      <div className="aspect-[2/3] overflow-hidden">
        <img
          src={poster}
          alt={title}
          className="h-full w-full object-cover transition group-hover:scale-105"
        />
      </div>
      <div className="p-2">
        <p className="line-clamp-2 text-xs font-semibold">{title}</p>
        <p className="mt-0.5 text-[10px] text-text-muted">
          {anime.type || ""}
          {anime.year ? ` · ${anime.year}` : ""}
        </p>
      </div>
    </Link>
  );
}

/**
 * Build a linear watch order from relations:
 *   Prequels (chain) → Current → Sequels (chain)
 */
function buildWatchOrder(relations) {
  const prequels = relations
    .filter((r) => r.relation === "PREQUEL")
    .map((r) => r.entry);
  const sequels = relations
    .filter((r) => r.relation === "SEQUEL")
    .map((r) => r.entry);

  const out = [];
  for (const p of prequels) {
    out.push({
      id: p.mal_id ?? p.id,
      title: p.title_english || p.title_romaji || p.title,
    });
  }
  return out; // just prequels shown here; add current + sequels if you want
}
