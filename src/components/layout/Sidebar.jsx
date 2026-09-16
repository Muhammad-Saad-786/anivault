import { Link } from "react-router-dom";

export function Sidebar() {
  return (
    <aside className="hidden w-56 shrink-0 border-r border-border-dark p-4 lg:block">
      <nav className="space-y-1 text-sm">
        <Link
          className="block rounded-lg px-3 py-2 text-text-secondary hover:bg-surface-card hover:text-white"
          to="/seasonal"
        >
          Seasonal
        </Link>
        <Link
          className="block rounded-lg px-3 py-2 text-text-secondary hover:bg-surface-card hover:text-white"
          to="/calendar"
        >
          Calendar
        </Link>
        <Link
          className="block rounded-lg px-3 py-2 text-text-secondary hover:bg-surface-card hover:text-white"
          to="/dashboard"
        >
          Dashboard
        </Link>
      </nav>
    </aside>
  );
}
