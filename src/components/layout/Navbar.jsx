import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Search,
  Menu,
  X,
  Compass,
  Tv,
  Calendar,
  LayoutDashboard,
  LogOut,
  Sparkles,
  CalendarDays,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import NotificationBell from "./NotificationBell";
import { List, Activity as ActivityIcon } from "lucide-react";

const links = [
  { to: "/", label: "Home", icon: Compass },
  { to: "/search", label: "Browse", icon: Search },
  { to: "/seasonal", label: "Seasonal", icon: Calendar },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/library", label: "My List", icon: Tv },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/concierge", label: "AI", icon: Sparkles },
];

export default function Navbar() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [q, setQ] = useState("");

  const { user, profile } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
    setMenuOpen(false);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const query = q.trim();
    if (query) navigate(`/search?q=${encodeURIComponent(query)}`);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border-dark bg-surface-darker/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <img
            src="/anivault.png"
            alt="AniVault"
            className="h-8 w-auto"
            width={32}
            height={32}
          />
        </Link>

        {/* Desktop nav */}
        <nav className="ml-6 hidden items-center gap-1 md:flex">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition",
                  isActive
                    ? "bg-surface-elevated text-text-primary"
                    : "text-text-secondary hover:bg-surface-elevated hover:text-text-primary",
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Search (desktop) */}
        <form
          onSubmit={onSubmit}
          className="ml-auto hidden max-w-xs flex-1 md:block"
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search anime…"
              className="input-dark pl-9"
            />
          </div>
        </form>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          {/* User avatar dropdown — desktop only */}
          {user && (
            <div className="relative hidden md:block">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-border-dark bg-surface-card px-2 py-1.5 hover:bg-surface-elevated"
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt=""
                    className="h-6 w-6 rounded-full"
                  />
                ) : (
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-brand text-[10px] font-black text-white">
                    {(profile?.username || user.email)?.[0]?.toUpperCase()}
                  </span>
                )}
                <span className="hidden text-xs font-semibold sm:inline">
                  {profile?.username || "Account"}
                </span>
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-card border border-border-dark bg-surface-card shadow-card">
                    <Link
                      to="/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-surface-elevated"
                    >
                      <LayoutDashboard className="h-4 w-4" /> Dashboard
                    </Link>
                    <Link
                      to="/stats"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-surface-elevated"
                    >
                      <Sparkles className="h-4 w-4" /> Stats
                    </Link>
                    <Link
                      to="/wrapped"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-surface-elevated"
                    >
                      <Sparkles className="h-4 w-4" /> Wrapped
                    </Link>
                    <Link
                      to="/lists"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-surface-elevated"
                    >
                      <List className="h-4 w-4" /> My Lists
                    </Link>
                    <Link
                      to="/activity"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-surface-elevated"
                    >
                      <ActivityIcon className="h-4 w-4" /> Activity
                    </Link>
                    <Link
                      to={`/u/${profile?.username}`}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-surface-elevated"
                    >
                      <User className="h-4 w-4" /> My Profile
                    </Link>
                    <div className="h-px bg-border-dark" />
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-brand hover:bg-surface-elevated"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Sign in button — desktop only, when logged out */}
          {!user && (
            <Link to="/login" className="btn-brand hidden md:inline-flex">
              Sign in
            </Link>
          )}

          {/* Hamburger — mobile only, always visible */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="btn-ghost !px-2.5 md:hidden"
            aria-label="Menu"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border-dark bg-surface-darker md:hidden">
          <div className="space-y-3 px-4 py-4">
            {/* Search (mobile) */}
            <form onSubmit={onSubmit}>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search anime…"
                  className="input-dark pl-9"
                />
              </div>
            </form>

            {/* Primary nav */}
            <nav className="grid grid-cols-2 gap-2">
              {links.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/"}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
                      isActive
                        ? "bg-surface-elevated text-text-primary"
                        : "text-text-secondary hover:bg-surface-elevated",
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              ))}
            </nav>

            {/* User section (when logged in) */}
            {user && (
              <>
                <div className="h-px bg-border-dark" />
                <div className="flex items-center gap-3 rounded-lg border border-border-dark bg-surface-card p-3">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt=""
                      className="h-9 w-9 rounded-full"
                    />
                  ) : (
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-brand text-xs font-black text-white">
                      {(profile?.username || user.email)?.[0]?.toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-semibold">
                      {profile?.display_name || profile?.username || "Account"}
                    </p>
                    <Link
                      to={`/u/${profile?.username}`}
                      onClick={() => setMobileOpen(false)}
                      className="text-[11px] text-text-muted hover:text-brand"
                    >
                      View profile →
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary hover:bg-surface-elevated"
                  >
                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                  </Link>
                  <Link
                    to="/stats"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary hover:bg-surface-elevated"
                  >
                    <Sparkles className="h-4 w-4" /> Stats
                  </Link>
                  <Link
                    to="/wrapped"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary hover:bg-surface-elevated"
                  >
                    <Sparkles className="h-4 w-4" /> Wrapped
                  </Link>
                  <Link
                    to="/lists"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary hover:bg-surface-elevated"
                  >
                    <List className="h-4 w-4" /> My Lists
                  </Link>
                  <Link
                    to="/activity"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary hover:bg-surface-elevated"
                  >
                    <ActivityIcon className="h-4 w-4" /> Activity
                  </Link>
                </div>

                <button
                  onClick={() => {
                    handleSignOut();
                    setMobileOpen(false);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-brand/40 px-3 py-2 text-sm font-semibold text-brand hover:bg-brand/10"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </>
            )}

            {/* Sign in (when logged out) */}
            {!user && (
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="btn-brand w-full"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
