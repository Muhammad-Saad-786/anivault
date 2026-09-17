# 🎌 AniVault

> **Your personal anime vault** — search in any language, track every episode,
> get spoiler-safe AI recommendations, and stream from multiple providers.

[![Live](https://img.shields.io/badge/live-anivault.saadasim.me-f60200?style=flat-square)](https://anivault.saadasim.me)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](./LICENSE)
[![Made with React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)](https://react.dev)
[![Powered by Supabase](https://img.shields.io/badge/Supabase-Postgres-3ecf8e?style=flat-square&logo=supabase)](https://supabase.com)

---

## ✨ Features

- **🔍 Universal search** — find anime by English, Japanese, or Romaji title
- **📚 Personal library** — track Watching, Completed, Plan to Watch, On Hold, Dropped, Rewatching
- **🎯 Episode progress** — one-click increment, auto-complete on finale, per-episode history
- **🤖 Spoiler-safe AI** — an assistant that knows exactly which episode you're on and never spoils the future
- **🎨 Custom lists** — public or private collections (Best Anime, Anime With Friends, etc.)
- **👥 Social** — reviews, comments, likes, followers, activity feed, compatibility scores
- **📅 Airing calendar** — weekly anime schedule with episode timestamps
- **🌸 Seasonal browser** — explore every anime season with genre/format filters
- **📊 Stats & Wrapped** — yearly statistics with shareable image export
- **🎬 Streaming** — episode playback through third-party embed providers
- **📱 PWA** — installable on mobile and desktop, works offline

---

## 🏗️ Tech Stack

| Layer            | Technology                                                                    |
| ---------------- | ----------------------------------------------------------------------------- |
| Frontend         | React 19, Vite, Tailwind CSS v4, React Router                                 |
| Data fetching    | TanStack Query                                                                |
| Backend          | Supabase (Postgres, Auth, Realtime, Storage)                                  |
| Anime metadata   | [AniList GraphQL API](https://anilist.gitbook.io/anilist-apiv2-docs/)         |
| AI assistant     | OpenRouter (models configurable)                                              |
| Streaming embeds | Third-party embed providers (see [Content & Copyright](#-content--copyright)) |
| Hosting          | Vercel                                                                        |
| Analytics        | Umami (privacy-friendly, cookieless)                                          |

---

## ⚠️ Content & Copyright

### What this app **does not** do

- ❌ **Does not host** any anime video content
- ❌ **Does not store, mirror, or distribute** any copyrighted video files
- ❌ **Does not bypass** paywalls, DRM, or licensing requirements
- ❌ **Does not provide** pirated downloads

### What this app **does**

- ✅ Fetches **public anime metadata** (titles, synopses, posters, episodes) from the [AniList GraphQL API](https://anilist.co) — an openly licensed community database
- ✅ **Embeds** video players from independent third-party services. All video content is delivered directly to your browser by those third parties. AniVault has no access to, control over, or knowledge of the video files being streamed
- ✅ Provides a **discovery and tracking** interface — the primary purpose of the app

### If you are a copyright holder

If you believe content accessible through AniVault infringes your copyright,
please see our **[DMCA Policy](#-dmca-policy)** below or contact us directly at
**saadasimmalik@gmail.com**.

---

## ⚖️ DMCA Policy

AniVault respects the intellectual property rights of others. We will respond
to valid DMCA takedown notices and other applicable copyright complaints.

### Filing a notice

If you are a copyright owner (or authorized agent) and believe that content
accessible via AniVault infringes your copyright, please send a written notice
to **saadasimmalik@gmail.com** containing:

1. A physical or electronic signature of the copyright owner or authorized agent
2. Identification of the copyrighted work claimed to have been infringed
3. Identification of the material claimed to be infringing, including the
   specific URL(s) on AniVault so we can locate it
4. Your contact information (full name, mailing address, telephone number, email)
5. A statement that you have a **good-faith belief** that the use of the material
   is not authorized by the copyright owner, its agent, or the law
6. A statement, **under penalty of perjury**, that the information in your notice
   is accurate and that you are the copyright owner or authorized to act on
   the owner's behalf

### What we will do

Upon receiving a valid DMCA notice, we will:

- Remove or disable access to the identified URLs on AniVault
- Notify the user who submitted the content (if applicable)
- Terminate accounts of repeat infringers
- Cooperate fully with legitimate legal investigations

### What we cannot do

Because AniVault does not host video content — it embeds from third-party
services — the most effective action is to contact the upstream providers
directly. However, we commit to removing **any and all** AniVault-side links
or embeds identified in a valid notice.

### Counter-notices

If you believe your content was removed in error, you may submit a
counter-notice to **dmca@saadasim.me** with equivalent detail, and we will
follow the process described in 17 U.S.C. § 512(g).

### Repeat infringers

AniVault will terminate the accounts of users who are the subject of
repeated valid DMCA notices.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ ([download](https://nodejs.org/))
- A [Supabase](https://supabase.com) account (free tier works)
- (Optional) An [OpenRouter](https://openrouter.ai) API key for the AI features

### Installation

```bash
# Clone the repo
git clone https://github.com/Muhammad-Saad-786/anivault.git
cd anivault

# Install dependencies
npm install

# Copy env template
cp .env.example .env.local

# Fill in the values (see Configuration below)
```
