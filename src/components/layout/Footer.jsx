// src/components/layout/Footer.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  Sparkles,
  Compass,
  Calendar,
  List as ListIcon,
  Tv,
  ChevronDown,
  Mail,
} from "lucide-react";
import InstallPrompt from "@/components/pwa/InstallPrompt";

/* ------------------------------------------------------------------ */
/* Brand Icons (inline SVG — lucide doesn't ship these)               */
/* ------------------------------------------------------------------ */

export function InstagramIcon({ className = "h-4 w-4", ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

export function YouTubeIcon({ className = "h-4 w-4", ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Footer                                                              */
/* ------------------------------------------------------------------ */

const SECTIONS = [
  {
    id: "explore",
    title: "Explore",
    links: [
      { to: "/search", label: "Browse", icon: Compass },
      { to: "/seasonal", label: "Seasonal", icon: Calendar },
      { to: "/calendar", label: "Calendar", icon: Calendar },
      { to: "/lists", label: "Public Lists", icon: ListIcon },
    ],
  },
  {
    id: "account",
    title: "Account",
    links: [
      { to: "/signup", label: "Create account" },
      { to: "/login", label: "Sign in" },
      { to: "/library", label: "My Library", icon: Tv },
      { to: "/dashboard", label: "Dashboard" },
      { to: "/stats", label: "Stats" },
      { to: "/wrapped", label: "Anime Wrapped", icon: Sparkles },
    ],
  },
  {
    id: "ai",
    title: "AI & More",
    links: [
      { to: "/concierge", label: "AI Concierge", icon: Sparkles },
      { to: "/activity", label: "Activity Feed" },
      { to: "/notifications", label: "Notifications" },
    ],
  },
  {
    id: "legal",
    title: "Legal",
    links: [
      { to: "/terms", label: "Terms" },
      { to: "/privacy", label: "Privacy" },
      { to: "/dmca", label: "DMCA" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-border-dark bg-surface-darker">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* =========================================================
            Main content
            Mobile: stacked accordion
            Desktop (lg+): 5-column grid
            ========================================================= */}
        <div className="py-10 lg:grid lg:grid-cols-5 lg:gap-8">
          {/* -------- Brand column (always visible, full width on mobile) -------- */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex shrink-0 items-center gap-2">
              <img
                src="/anivault.png"
                alt="AniVault"
                className="h-8 w-auto"
                width={32}
                height={32}
              />
            </Link>

            <p className="mt-3 max-w-sm text-sm leading-relaxed text-text-secondary">
              Your personal anime vault — search in any language, track every
              episode, get spoiler-safe AI recommendations, and stream from
              multiple providers.
            </p>

            {/* Install prompt (only shows on Chromium when installable) */}
            <InstallPrompt variant="compact" className="mt-4" />

            {/* Social links */}
            <div className="mt-5 flex gap-2">
              <SocialLink
                href="https://instagram.com/zazamlbb_"
                label="Instagram"
                icon={InstagramIcon}
              />
              <SocialLink
                href="https://www.youtube.com/@zaza-mlbb"
                label="YouTube"
                icon={YouTubeIcon}
              />
              <SocialLink
                href="mailto:saadasimmalik@gmail.com"
                label="Email"
                icon={Mail}
                external={false}
              />
            </div>
          </div>

          {/* -------- Link sections -------- */}
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-2 lg:col-span-3 lg:mt-0 lg:grid-cols-3 lg:gap-x-8">
            {SECTIONS.map((section) => (
              <FooterSection key={section.id} section={section} />
            ))}
          </div>
        </div>

        {/* =========================================================
            Bottom bar
            ========================================================= */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-border-dark py-5 text-xs text-text-muted sm:flex-row sm:gap-2">
          <p className="order-2 text-center sm:order-1 sm:text-left">
            © {new Date().getFullYear()} AniVault. All rights reserved.
          </p>

          <p className="order-1 flex flex-wrap items-center justify-center gap-1.5 text-center sm:order-2 sm:justify-end sm:text-right">
            <span>Metadata by</span>
            <a
              href="https://anilist.co"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-text-secondary transition hover:text-brand"
            >
              AniList
            </a>
            <span className="opacity-40">·</span>
            <span className="flex items-center gap-1">
              Built with
              <p className="text-brand font-bold cursor-pointer ">Saad Asim</p>
              for anime fans
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

function SocialLink({ href, label, icon: Icon, external = true }) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      aria-label={label}
      title={label}
      className="grid h-9 w-9 place-items-center rounded-lg border border-border-dark bg-surface-card text-text-secondary transition hover:border-brand/40 hover:text-brand active:scale-95"
    >
      <Icon className="h-4 w-4" />
    </a>
  );
}

/**
 * Responsive section:
 *   - Mobile: collapsible accordion (closed by default for compactness)
 *   - Tablet+: expanded by default
 */
function FooterSection({ section }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      {/* Header — acts as toggle on mobile, plain heading on tablet+ */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left md:cursor-default md:pointer-events-none"
      >
        <h4 className="text-sm font-semibold text-text-primary">
          {section.title}
        </h4>
        <ChevronDown
          className={`h-4 w-4 text-text-muted transition-transform md:hidden ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Links */}
      <ul
        className={`mt-3 space-y-2 text-sm md:block ${
          open ? "block" : "hidden"
        }`}
      >
        {section.links.map((l) => (
          <FooterLink key={l.to + l.label} to={l.to} icon={l.icon}>
            {l.label}
          </FooterLink>
        ))}
      </ul>
    </div>
  );
}

function FooterLink({ to, children, icon: Icon }) {
  return (
    <li>
      <Link
        to={to}
        className="flex items-center gap-1.5 text-text-secondary transition hover:text-brand"
      >
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
        <span>{children}</span>
      </Link>
    </li>
  );
}
