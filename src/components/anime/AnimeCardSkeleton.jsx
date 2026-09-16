export default function AnimeCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-card border border-border-dark bg-surface-card">
      <div className="skeleton aspect-[2/3] w-full rounded-none" />
      <div className="space-y-2 p-3">
        <div className="skeleton h-3 w-3/4" />
        <div className="skeleton h-3 w-1/2" />
      </div>
    </div>
  );
}
