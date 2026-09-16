import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-border-dark bg-surface-darker">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-4 lg:px-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-white font-black">
              A
            </span>
            <span className="text-lg font-extrabold">
              Ani<span className="text-brand">Vault</span>
            </span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-text-secondary">
            Discover, track, and stream anime — with an AI assistant that never
            spoils.
          </p>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-text-primary">
            Explore
          </h4>
          <ul className="space-y-2 text-sm text-text-secondary">
            <li>
              <Link to="/search" className="hover:text-brand">
                Browse
              </Link>
            </li>
            <li>
              <Link to="/seasonal" className="hover:text-brand">
                Seasonal
              </Link>
            </li>
            <li>
              <Link to="/top" className="hover:text-brand">
                Top Rated
              </Link>
            </li>
            <li>
              <Link to="/calendar" className="hover:text-brand">
                Calendar
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-text-primary">
            Account
          </h4>
          <ul className="space-y-2 text-sm text-text-secondary">
            <li>
              <Link to="/login" className="hover:text-brand">
                Sign in
              </Link>
            </li>
            <li>
              <Link to="/library" className="hover:text-brand">
                My Library
              </Link>
            </li>
            <li>
              <Link to="/dashboard" className="hover:text-brand">
                Dashboard
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-text-primary">
            Legal
          </h4>
          <ul className="space-y-2 text-sm text-text-secondary">
            <li>
              <Link to="/terms" className="hover:text-brand">
                Terms
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="hover:text-brand">
                Privacy
              </Link>
            </li>
            <li>
              <Link to="/dmca" className="hover:text-brand">
                DMCA
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border-dark py-4 text-center text-xs text-text-muted">
        © {new Date().getFullYear()} AniVault. Data from Jikan / AniList.
      </div>
    </footer>
  );
}
