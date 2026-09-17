// src/pages/Notifications.jsx
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/api/notifications";
import Spinner from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import SEO from "@/components/SEO";

export default function Notifications() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", "page", user?.id],
    queryFn: () => getNotifications(user.id, 100),
    enabled: !!user,
  });

  const items = data || [];
  const unread = items.filter((n) => !n.read).length;

  const readAll = async () => {
    await markAllNotificationsRead(user.id);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };

  const readOne = async (id) => {
    await markNotificationRead(id);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <SEO
        title="Notifications"
        description="Stay up to date with your AniVault notifications and anime updates."
      />
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Bell className="h-6 w-6 text-brand" /> Notifications
          </h1>
          <p className="text-sm text-text-secondary">
            {unread > 0 ? `${unread} unread` : "All caught up"}
          </p>
        </div>

        {unread > 0 && (
          <button onClick={readAll} className="btn-ghost">
            <CheckCheck className="h-4 w-4" /> Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-20">
          <Spinner className="h-8 w-8" />
        </div>
      ) : items.length === 0 ? (
        <div className="card p-12 text-center">
          <Bell className="mx-auto h-8 w-8 text-text-muted" />
          <p className="mt-3 text-lg font-semibold">No notifications</p>
          <p className="mt-1 text-sm text-text-secondary">
            Follow anime to get notified when new episodes air.
          </p>
        </div>
      ) : (
        <div className="card divide-y divide-border-dark overflow-hidden">
          {items.map((n) => (
            <NotificationRow key={n.id} notification={n} onRead={readOne} />
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationRow({ notification, onRead }) {
  const { type, payload, read, created_at } = notification;

  const content = (() => {
    if (type === "episode_aired") {
      return {
        title: `${payload.animeTitle || "Anime"} — Episode ${payload.episode}`,
        subtitle: "A new episode is now available.",
        link: payload.animeId ? `/anime/${payload.animeId}` : "#",
      };
    }
    if (type === "recommendation") {
      return {
        title: "New recommendation for you",
        subtitle: payload.message || "Check your dashboard.",
        link: "/dashboard",
      };
    }
    return {
      title: "Notification",
      subtitle: payload.message || "",
      link: "#",
    };
  })();

  return (
    <Link
      to={content.link}
      onClick={() => !read && onRead(notification.id)}
      className={cn(
        "flex items-start gap-3 p-4 transition hover:bg-surface-elevated",
        !read && "bg-brand/5",
      )}
    >
      {payload.posterUrl ? (
        <img
          src={payload.posterUrl}
          alt=""
          className="h-16 w-11 shrink-0 rounded object-cover"
        />
      ) : (
        <div className="grid h-16 w-11 shrink-0 place-items-center rounded bg-surface-elevated text-brand">
          <Bell className="h-5 w-5" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-semibold">{content.title}</p>
        {content.subtitle && (
          <p className="mt-0.5 line-clamp-2 text-xs text-text-secondary">
            {content.subtitle}
          </p>
        )}
        <p className="mt-1 text-[11px] text-text-muted">
          {new Date(created_at).toLocaleString()}
        </p>
      </div>

      {!read && (
        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand" />
      )}
    </Link>
  );
}
