// src/components/SEO.jsx
import { useEffect } from "react";

const DEFAULT = {
  title: "AniVault — Discover, Track, and Stream Anime",
  description:
    "AniVault is your anime vault — search by title in any language, track episodes, get AI-powered recommendations that never spoil, and stream from multiple providers.",
  image: "/og-image.png",
  type: "website",
};

function setMeta(attr, key, content) {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/**
 * <SEO title="..." description="..." image="..." url="..." />
 * Injects <title>, meta description, OG, and Twitter Card tags.
 */
export default function SEO({
  title,
  description,
  image,
  url,
  type = "website",
}) {
  const fullTitle = title ? `${title} · AniVault` : DEFAULT.title;
  const fullDescription = description || DEFAULT.description;
  const fullImage = image || DEFAULT.image;
  const fullUrl = url || window.location.href;

  useEffect(() => {
    document.title = fullTitle;

    setMeta("name", "description", fullDescription);

    // Open Graph
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", fullDescription);
    setMeta("property", "og:image", fullImage);
    setMeta("property", "og:url", fullUrl);
    setMeta("property", "og:type", type);
    setMeta("property", "og:site_name", "AniVault");

    // Twitter
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", fullDescription);
    setMeta("name", "twitter:image", fullImage);

    // Theme
    setMeta("name", "theme-color", "#0d0d0d");
  }, [fullTitle, fullDescription, fullImage, fullUrl, type]);

  return null;
}
