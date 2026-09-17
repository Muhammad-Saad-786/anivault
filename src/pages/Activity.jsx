// src/pages/Activity.jsx
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Activity as ActivityIcon,
  Star,
  CheckCircle2,
  List,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getActivityFeed } from "@/lib/api/social";
import Spinner from "@/components/ui/Spinner";
import SEO from "@/components/SEO";

export default function Activity() {
  const { user } = useAuth();

  const feed = useQuery({
    queryKey: ["activity", user?.id],
    queryFn: () => getActivityFeed(user.id),
    enabled: !!user,
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <SEO
        title="Activity"
        description="See what the people you follow are watching and sharing on AniVault."
      />
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-black sm:text-3xl">
          <ActivityIcon className="h-6 w-6 text-brand" /> Activity
        </h1>
        <p className="text-sm text-text-secondary">
          What people you follow are up to
        </p>
      </div>

      {feed.isLoading && (
        <div className="grid place-items-center py-16">
          <Spinner className="h-6 w-6" />
        </div>
      )}

      {!feed.isLoading && (feed.data || []).length === 0 && (
        <div className="card p-12 text-center">
          <ActivityIcon className="mx-auto h-10 w-10 text-text-muted" />
          <p className="mt-3 text-lg font-semibold">No activity yet</p>
          <p className="mt-1 text-sm text-text-secondary">
            Follow some users to see their updates here.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {(feed.data || []).map((item) => (
          <ActivityItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function ActivityItem({ item }) {
  const author = item.author || {};
  const initial = (author.username || "U")[0].toUpperCase();

  return (
    <div className="card flex items-start gap-3 p-4">
      <Link to={`/u/${author.username}`} className="shrink-0">
        {author.avatar_url ? (
          <img
            src={author.avatar_url}
            alt=""
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <span className="grid h-9 w-9 place-items-center rounded-full bg-brand text-xs font-black text-white">
            {initial}
          </span>
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <Link
            to={`/u/${author.username}`}
            className="font-semibold hover:text-brand"
          >
            {author.display_name || author.username}
          </Link>{" "}
          {item.type === "review" && "reviewed"}
          {item.type === "completed" && "completed"}
          {item.type === "list" && "created a list"}
          {item.anime && (
            <>
              {" "}
              <Link
                to={`/anime/${item.anime.id}`}
                className="font-semibold text-brand hover:underline"
              >
                {item.anime.title_en || item.anime.title_romaji}
              </Link>
            </>
          )}
          {item.type === "list" && (
            <>
              {" "}
              <Link
                to={`/lists/${item.listId}`}
                className="font-semibold text-brand hover:underline"
              >
                {item.listName}
              </Link>
            </>
          )}
        </p>

        {item.anime && (
          <Link to={`/anime/${item.anime.id}`} className="mt-2 inline-block">
            <img
              src={item.anime.poster_url}
              alt=""
              className="h-20 w-14 rounded object-cover"
            />
          </Link>
        )}

        {item.rating > 0 && (
          <span className="ml-2 inline-flex items-center gap-1 rounded-md bg-green-500/90 px-2 py-0.5 text-xs font-bold text-white">
            <Star className="h-3 w-3 fill-white" /> {item.rating}
          </span>
        )}

        {item.text && (
          <p className="mt-2 line-clamp-2 text-xs text-text-secondary">
            {item.text}
          </p>
        )}

        <p className="mt-1 text-[10px] text-text-muted">
          {new Date(item.at).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
