// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.svg",
        "favicon.ico",
        "apple-touch-icon.png",
        "og-image.png",
        "icon-192.png",
        "icon-512.png",
      ],
      manifest: {
        id: "/",
        name: "AniVault — Anime Discovery & Tracking",
        short_name: "AniVault",
        description:
          "Discover, track, and stream anime. AI-powered recommendations that never spoil.",
        theme_color: "#0d0d0d",
        background_color: "#0d0d0d",
        display: "standalone",
        display_override: ["window-controls-overlay", "standalone"],
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        categories: ["entertainment", "lifestyle", "video"],
        lang: "en",
        dir: "ltr",
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        screenshots: [
          {
            src: "/screenshot-desktop.png",
            sizes: "1280x720",
            type: "image/png",
            form_factor: "wide",
            label: "AniVault home page — trending, seasonal, and top anime",
          },
          {
            src: "/screenshot-mobile.png",
            sizes: "720x1280",
            type: "image/png",
            label: "AniVault on mobile — track your library on the go",
          },
        ],
        shortcuts: [
          {
            name: "Search anime",
            short_name: "Search",
            description: "Find any anime by title",
            url: "/search",
            icons: [{ src: "/icon-192.png", sizes: "192x192" }],
          },
          {
            name: "My Library",
            short_name: "Library",
            description: "Your tracked anime",
            url: "/library",
            icons: [{ src: "/icon-192.png", sizes: "192x192" }],
          },
        ],
      },
      workbox: {
        navigateFallback: "/index.html",
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
        navigateFallbackDenylist: [/^\/api/, /^\/library/, /^\/dashboard/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/graphql\.anilist\.co\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "anilist-api",
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
          {
            urlPattern: /^https:\/\/s4\.anilist\.co\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "anilist-images",
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: /^https:\/\/.*supabase\.co\/.*/i,
            handler: "NetworkOnly",
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
