// src/components/layout/NotificationBell.jsx
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, CheckCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/api/notifications";
import { cn } from "@/lib/utils";

export default function NotificationBell() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const { data: unread = 0 } = useQuery({
    queryKey: ["notifications", "unread", user?.id],
    queryFn: () => getUnreadCount(user.id),
    enabled: !!user,
    refetchInterval: 60000, // every minute
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", "list", user?.id],
    queryFn: () => getNotifications(user.id, 20),
    enabled: !!user && open,
  });

  /* Realtime: new notifications appear instantly */
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["notifications"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, qc]);

  /* Click outside closes dropdown */
  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!user) return null;

  const handleRead = async (id) => {
    await markNotificationRead(id);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };

  const handleReadAll = async () => {
    await markAllNotificationsRead(user.id);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative grid h-9 w-9 place-items-center rounded-lg border border-border-dark bg-surface-card transition hover:bg-surface-elevated"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-card border border-border-dark bg-surface-card shadow-card">
          <div className="flex items-center justify-between border-b border-border-dark px-3 py-2.5">
            <h3 className="text-sm font-bold">Notifications</h3>
            {unread > 0 && (
              <button
                onClick={handleReadAll}
                className="flex items-center gap-1 text-xs text-text-secondary hover:text-brand"
              >
                <CheckCheck className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-text-secondary">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onRead={handleRead}
                />
              ))
            )}
          </div>

          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-border-dark px-3 py-2.5 text-center text-xs font-semibold text-text-secondary transition hover:bg-surface-elevated hover:text-brand"
          >
            View all
          </Link>
        </div>
      )}
    </div>
  );
}

function NotificationItem({ notification, onRead }) {
  const { type, payload, read } = notification;

  const title =
    type === "episode_aired"
      ? `${payload.animeTitle || "Anime"} — Episode ${payload.episode}`
      : type === "recommendation"
        ? "New recommendation for you"
        : type === "follow"
          ? "Someone followed you"
          : "Notification";

  const subtitle =
    type === "episode_aired" ? "Now available" : payload.message || "";

  const linkTo = payload.animeId
    ? `/anime/${payload.animeId}`
    : "/notifications";

  return (
    <Link
      to={linkTo}
      onClick={() => !read && onRead(notification.id)}
      className={cn(
        "flex items-start gap-3 border-b border-border-dark px-3 py-3 text-left transition last:border-b-0",
        read
          ? "opacity-60 hover:bg-surface-elevated"
          : "bg-brand/5 hover:bg-surface-elevated",
      )}
    >
      {payload.posterUrl ? (
        <img
          src={payload.posterUrl}
          alt=""
          className="h-12 w-9 shrink-0 rounded object-cover"
        />
      ) : (
        <div className="grid h-12 w-9 shrink-0 place-items-center rounded bg-surface-elevated text-brand">
          <Bell className="h-4 w-4" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-xs font-semibold">{title}</p>
        {subtitle && (
          <p className="mt-0.5 line-clamp-1 text-[11px] text-text-secondary">
            {subtitle}
          </p>
        )}
        <p className="mt-1 text-[10px] text-text-muted">
          {timeAgo(notification.created_at)}
        </p>
      </div>

      {!read && (
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />
      )}
    </Link>
  );
}

function timeAgo(iso) {
  if (!iso) return "";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}
