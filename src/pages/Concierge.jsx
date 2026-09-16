// src/pages/Concierge.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Send, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { chatCompletion } from "@/lib/api/openrouter";
import { buildConciergeSystemPrompt } from "@/lib/ai/context";
import { searchAnimeAniList } from "@/lib/api/anilist";
import AnimeCard from "@/components/anime/AnimeCard";
import { cn } from "@/lib/utils";

const EXAMPLE_PROMPTS = [
  "Something dark like Attack on Titan but under 30 episodes",
  "A sad romance without too much comedy",
  "Beginner-friendly psychological thriller",
  "Short anime under 12 episodes with a smart main character",
  "A dark fantasy with amazing animation",
  "Anime similar to Death Note",
];

export default function Concierge() {
  const { profile } = useAuth();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState(null); // { text, cards: [...] }

  const ask = async (rawText) => {
    const text = (rawText ?? input).trim();
    if (!text || loading) return;

    setLoading(true);
    setError("");
    setResults(null);
    setInput("");

    try {
      const systemPrompt = buildConciergeSystemPrompt(profile);
      const reply = await chatCompletion(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
        { maxTokens: 900, temperature: 0.7 },
      );

      // Extract titles from **Title** markdown
      const titleMatches = [...reply.matchAll(/\*\*(.+?)\*\*/g)]
        .map((m) => m[1].replace(/\s*\(\d{4}\)\s*$/, "").trim())
        .slice(0, 8);

      // For each title, fetch a card from AniList (best-effort, parallel)
      const cards = (
        await Promise.all(
          titleMatches.map(async (title) => {
            try {
              const { data } = await searchAnimeAniList({
                q: title,
                perPage: 1,
              });
              return data?.[0] || null;
            } catch {
              return null;
            }
          }),
        )
      ).filter(Boolean);

      setResults({ text: reply, cards });
    } catch (err) {
      setError(err.message || "Concierge is unavailable right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand shadow-glow">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <h1 className="mt-4 text-3xl font-black sm:text-4xl">
          AI Anime Concierge
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Describe what you're in the mood for — in your own words.
        </p>
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask();
        }}
        className="card mb-4 p-3"
      >
        <div className="flex items-center gap-2">
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='e.g. "a dark anime like Attack on Titan but shorter"'
            disabled={loading}
            className="input-dark !border-0 !bg-transparent !text-base focus:!outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="btn-brand"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </form>

      {/* Example prompts */}
      {!results && !loading && (
        <div className="mb-8">
          <p className="mb-2 text-center text-xs uppercase tracking-wider text-text-muted">
            Try one
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {EXAMPLE_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => ask(p)}
                className="rounded-full border border-border-dark bg-surface-card px-3 py-1.5 text-xs text-text-secondary transition hover:border-brand/60 hover:text-text-primary"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-brand/40 bg-brand/10 px-4 py-3 text-sm text-brand">
          {error}
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-6">
          <div className="card p-5">
            <div className="prose prose-invert max-w-none whitespace-pre-line text-sm leading-relaxed text-text-primary">
              {renderMarkdownLite(results.text)}
            </div>
          </div>

          {results.cards.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-text-muted">
                Quick access
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {results.cards.map((a) => (
                  <AnimeCard key={a.mal_id} anime={a} />
                ))}
              </div>
            </div>
          )}

          <div className="text-center">
            <button
              onClick={() => {
                setResults(null);
                setInput("");
              }}
              className="btn-ghost"
            >
              Ask something else
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Minimal markdown renderer — **bold** and line breaks only */
function renderMarkdownLite(text) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return (
        <strong key={i} className="font-bold text-brand">
          {p.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{p}</span>;
  });
}
