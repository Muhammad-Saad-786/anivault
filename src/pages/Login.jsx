import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Mail, Lock } from "lucide-react";
import Spinner from "@/components/ui/Spinner";

function ChromeIcon({ className }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path fill="#EA4335" d="M12 12h10a10 10 0 0 0-17.32-6.8L9.5 12H12Z" />
      <path fill="#FBBC05" d="M4.68 5.2A10 10 0 0 0 12 22l5.2-9H12L4.68 5.2Z" />
      <path
        fill="#34A853"
        d="M12 22a10 10 0 0 0 10-10H12l-5 8.66A10 10 0 0 0 12 22Z"
      />
      <circle cx="12" cy="12" r="4.25" fill="#4285F4" />
      <circle cx="12" cy="12" r="2.75" fill="#fff" opacity=".18" />
    </svg>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || "/library";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (err) return setError(err.message);
    navigate(redirectTo, { replace: true });
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}${redirectTo}` },
    });
  };

  return (
    <div className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-4">
      <div className="card w-full p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-black">
            Welcome back to Ani<span className="text-brand">Vault</span>
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Sign in to continue tracking
          </p>
        </div>

        <button onClick={handleGoogle} className="btn-ghost w-full">
          <ChromeIcon className="h-4 w-4" /> Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3 text-xs text-text-muted">
          <div className="h-px flex-1 bg-border-dark" />
          or
          <div className="h-px flex-1 bg-border-dark" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-dark pl-9"
            />
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-dark pl-9"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-brand/40 bg-brand/10 px-3 py-2 text-sm text-brand">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-brand w-full">
            {loading ? <Spinner /> : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="font-semibold text-brand hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
