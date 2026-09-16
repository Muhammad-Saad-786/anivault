// src/components/ai/AIChat.jsx
import { useState, useRef, useEffect, useCallback } from "react";
import { Sparkles, Send, Trash2, RefreshCw } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { chatCompletionStream } from "@/lib/api/openrouter";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  loadConversation,
  saveConversation,
  clearConversation,
} from "@/lib/api/aiConversations";
import { buildAnimeSystemPrompt } from "@/lib/ai/context";
import { getLibraryEntry } from "@/lib/api/library";
import SpoilerSelector from "./SpoilerSelector";
import SuggestedPrompts from "./SuggestedPrompts";
import { cn } from "@/lib/utils";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function AIChat({ anime, className }) {
  const { user, profile } = useAuth();
  const qc = useQueryClient();

  const [spoilerLevel, setSpoilerLevel] = useState("none");
  const [spoilerUpTo, setSpoilerUpTo] = useState(1);
  const [messages, setMessages] = useState([]); // [{role, content}]
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const scrollRef = useRef(null);
  const abortRef = useRef(false);

  const totalEpisodes = anime?.episodes || 0;

  /* Load library progress + saved conversation */
  const { data: libraryEntry } = useQuery({
    queryKey: ["library", "entry", user?.id, anime?.mal_id],
    queryFn: () => getLibraryEntry(user.id, anime.mal_id),
    enabled: !!user && !!anime?.mal_id,
  });

  const userProgress = libraryEntry?.progress || 0;

  const { data: savedConvo } = useQuery({
    queryKey: ["ai", "convo", user?.id, anime?.mal_id],
    queryFn: () => loadConversation(user.id, anime.mal_id),
    enabled: !!user && !!anime?.mal_id,
  });

  /* Sync saved convo → local state, once */
  useEffect(() => {
    if (savedConvo) {
      setMessages(savedConvo.messages || []);
      setSpoilerLevel(savedConvo.spoiler_level || "none");
      setSpoilerUpTo(savedConvo.spoiler_up_to || 1);
    }
  }, [savedConvo?.id]);

  /* Auto-scroll */
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, streaming]);

  const persist = useCallback(
    (nextMessages) => {
      if (!user || !anime) return;
      saveConversation({
        userId: user.id,
        animeId: anime.mal_id,
        messages: nextMessages,
        spoilerLevel,
        spoilerUpTo,
      }).catch(() => {
        /* silent — persistence isn't critical */
      });
    },
    [user, anime, spoilerLevel, spoilerUpTo],
  );

  const send = async (rawText) => {
    const text = (rawText ?? input).trim();
    if (!text || streaming || !user) return;

    setError("");
    setInput("");

    const userMsg = { role: "user", content: text };
    const withUser = [...messages, userMsg];
    setMessages(withUser);
    setStreaming(true);

    // System prompt that enforces spoiler rules
    const systemPrompt = buildAnimeSystemPrompt({
      anime,
      userProgress,
      totalEpisodes,
      spoilerLevel,
      spoilerUpTo,
      profile,
    });

    // Cap history to last 12 messages to keep tokens sane
    const trimmedHistory = withUser.slice(-12);

    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...trimmedHistory,
    ];

    // Placeholder assistant message we'll stream into
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
    abortRef.current = false;

    try {
      await chatCompletionStream(
        apiMessages,
        (chunk) => {
          if (abortRef.current) return;
          setMessages((prev) => {
            const copy = [...prev];
            copy[copy.length - 1] = {
              role: "assistant",
              content: (copy[copy.length - 1].content || "") + chunk,
            };
            return copy;
          });
        },
        { maxTokens: 700, temperature: 0.6 },
      );

      // Persist final
      setMessages((prev) => {
        persist(prev);
        return prev;
      });
      qc.invalidateQueries({
        queryKey: ["ai", "convo", user.id, anime.mal_id],
      });
    } catch (err) {
      setError(err.message || "Something went wrong. Try again.");
      setMessages((prev) => prev.slice(0, -1)); // drop empty assistant
    } finally {
      setStreaming(false);
    }
  };

  const requestClear = () => {
    setShowClearConfirm(true);
  };

  const clear = async () => {
    if (!user || !anime) return;
    setShowClearConfirm(false);
    await clearConversation(user.id, anime.mal_id);
    setMessages([]);
    qc.invalidateQueries({ queryKey: ["ai", "convo", user.id, anime.mal_id] });
  };

  if (!user) {
    return (
      <div className={cn("card p-6 text-center", className)}>
        <Sparkles className="mx-auto h-6 w-6 text-brand" />
        <p className="mt-2 text-sm font-semibold">Ask AI about this anime</p>
        <p className="mt-1 text-xs text-text-secondary">
          Sign in to chat with a spoiler-safe AI assistant.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("card flex flex-col overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-border-dark px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand" />
          <div>
            <p className="text-sm font-bold">Ask AI</p>
            <p className="text-[10px] text-text-muted">
              {userProgress > 0
                ? `You're on episode ${userProgress}`
                : "Not started"}
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={requestClear}
            className="rounded-md p-1.5 text-text-muted transition hover:bg-surface-elevated hover:text-brand"
            title="Clear conversation"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Spoiler selector */}
      <div className="border-b border-border-dark px-4 py-3">
        <SpoilerSelector
          level={spoilerLevel}
          upTo={spoilerUpTo}
          totalEpisodes={totalEpisodes}
          onChange={({ level, upTo }) => {
            setSpoilerLevel(level);
            setSpoilerUpTo(upTo);
          }}
        />
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="max-h-[420px] flex-1 space-y-3 overflow-y-auto p-4"
      >
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-xs text-text-secondary">Try one of these:</p>
            <SuggestedPrompts onPick={send} disabled={streaming} />
          </div>
        )}

        {messages.map((m, i) => (
          <Message key={i} role={m.role} content={m.content} />
        ))}

        {streaming && (
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Thinking…
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-brand/40 bg-brand/10 px-3 py-2 text-xs text-brand">
            {error}
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex items-center gap-2 border-t border-border-dark p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask about ${anime.title_english || anime.title || "this anime"}…`}
          disabled={streaming}
          className="input-dark !text-sm"
        />
        <button
          type="submit"
          disabled={!input.trim() || streaming}
          className="btn-brand !p-2.5 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>

      <ConfirmDialog
        open={showClearConfirm}
        title="Clear conversation?"
        message="This will permanently remove the saved conversation for this anime."
        confirmLabel="Clear conversation"
        onConfirm={clear}
        onCancel={() => setShowClearConfirm(false)}
      />
    </div>
  );
}

function Message({ role, content }) {
  const isUser = role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl bg-brand px-3.5 py-2.5 text-sm leading-relaxed text-white">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div
        className="
          prose prose-invert prose-sm max-w-[85%]
          rounded-2xl bg-surface-elevated px-3.5 py-2.5 text-sm
          prose-headings:font-bold prose-headings:text-text-primary
          prose-h3:mt-3 prose-h3:mb-1.5 prose-h3:text-sm
          prose-p:my-1.5 prose-p:leading-relaxed prose-p:text-text-primary
          prose-strong:text-brand prose-strong:font-semibold
          prose-ul:my-1.5 prose-ul:pl-4 prose-li:my-0.5
          prose-ol:my-1.5 prose-ol:pl-4
          prose-code:rounded prose-code:bg-surface-dark prose-code:px-1 prose-code:py-0.5 prose-code:text-xs prose-code:text-brand prose-code:before:content-none prose-code:after:content-none
          prose-a:text-brand prose-a:no-underline hover:prose-a:underline
          prose-blockquote:border-l-2 prose-blockquote:border-brand prose-blockquote:pl-3 prose-blockquote:italic prose-blockquote:text-text-secondary
        "
      >
        {content ? (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Anchor links open in new tab
              a: ({ node, ...props }) => (
                <a target="_blank" rel="noopener noreferrer" {...props} />
              ),
              // Headings start at h4-level sizing for compactness
              h1: ({ node, ...props }) => (
                <h3 className="mt-3 mb-1.5 text-sm font-bold" {...props} />
              ),
              h2: ({ node, ...props }) => (
                <h3 className="mt-3 mb-1.5 text-sm font-bold" {...props} />
              ),
              h3: ({ node, ...props }) => (
                <h3 className="mt-3 mb-1.5 text-sm font-bold" {...props} />
              ),
              // HR divider
              hr: () => <hr className="my-3 border-border-dark" />,
            }}
          >
            {content}
          </ReactMarkdown>
        ) : (
          <span className="text-text-muted">…</span>
        )}
      </div>
    </div>
  );
}
