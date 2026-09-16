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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import NotificationBell from "./NotificationBell";

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
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-white font-black">
            A
          </span>
          <span className="text-lg font-extrabold tracking-tight">
            Ani<span className="text-brand">Vault</span>
          </span>
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

        {/* Search */}
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

        {/* Right */}
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <NotificationBell />

          {user ? (
            <div className="relative">
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
          ) : (
            <>
              <Link to="/login" className="btn-brand hidden md:inline-flex">
                Sign in
              </Link>
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
            </>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border-dark bg-surface-darker md:hidden">
          <div className="space-y-3 px-4 py-4">
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
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              className="btn-brand w-full"
            >
              Sign in
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
