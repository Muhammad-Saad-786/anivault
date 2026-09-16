// src/pages/Watch.jsx
import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Play,
  ChevronLeft,
  ChevronRight,
  Server,
  RefreshCw,
  List,
  Loader2,
} from "lucide-react";
import Hls from "hls.js";
import { getAnimeByIdAniList } from "@/lib/api/anilist";
import {
  findStreamSource,
  getStreamInfo,
  getEpisodeSources,
  getEpisodeServers,
} from "@/lib/api/streaming";
import { useAuth } from "@/hooks/useAuth";
import { getLibraryEntry, updateProgress } from "@/lib/api/library";
import { cn } from "@/lib/utils";
import Spinner from "@/components/ui/Spinner";

export default function Watch() {
  const { animeId, episode: episodeParam } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [currentEpisode, setCurrentEpisode] = useState(
    Number(episodeParam) || 1,
  );
  const [selectedServer, setSelectedServer] = useState(null);
  const [showEpisodeList, setShowEpisodeList] = useState(false);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  /* Fetch anime metadata from AniList */
  const { data: anime, isLoading: animeLoading } = useQuery({
    queryKey: ["anime", animeId],
    queryFn: () => getAnimeByIdAniList(animeId),
  });

  /* Find streaming source */
  const {
    data: streamSource,
    isLoading: sourceLoading,
    isError: sourceError,
    error: sourceErrorMsg,
    refetch: refetchSource,
  } = useQuery({
    queryKey: ["stream", animeId, anime?.title_english || anime?.title_romaji],
    enabled: !!anime,
    queryFn: () => findStreamSource(anime),
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });

  /* Fetch episode list from HiAnime */
  const { data: streamInfo } = useQuery({
    queryKey: ["stream-info", streamSource?.id, streamSource?._provider],
    enabled: !!streamSource?.id,
    queryFn: () => getStreamInfo(streamSource.id, streamSource._provider),
    staleTime: 30 * 60 * 1000,
  });

  /* Get episode sources */
  const {
    data: episodeSources,
    isLoading: sourcesLoading,
    error: sourcesError,
  } = useQuery({
    queryKey: [
      "episode-sources",
      streamSource?.id,
      currentEpisode,
      selectedServer,
      streamSource?._provider,
    ],
    enabled: !!streamSource?.id && !!streamInfo,
    queryFn: async () => {
      const provider = streamSource._provider;
      const ep = streamInfo?.episodes?.find((e) => e.number === currentEpisode);
      if (!ep) throw new Error(`Episode ${currentEpisode} not found`);

      let serversData = [];
      try {
        serversData = await getEpisodeServers(ep.id, provider);
      } catch {
        serversData = [];
      }

      const sources = await getEpisodeSources(ep.id, provider);
      return {
        sources,
        servers: serversData || [],
        activeServer: selectedServer || serversData?.[0]?.name || "default",
        episode: ep,
      };
    },
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  /* Fetch user's library entry for progress tracking */
  const { data: libraryEntry } = useQuery({
    queryKey: ["library", "entry", user?.id, anime?.mal_id],
    queryFn: () => getLibraryEntry(user.id, anime.mal_id),
    enabled: !!user && !!anime?.mal_id,
  });

  /* Video player setup */
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !episodeSources?.sources?.[0]) return;

    const source = episodeSources.sources[0];
    const url = source.url;

    // Cleanup previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (url.includes(".m3u8") && Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        enableWorker: true,
      });

      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {
          /* Autoplay blocked — user must click play */
        });
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          console.error("HLS fatal error:", data);
          // Try to recover or show error
        }
      });

      hlsRef.current = hls;

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari native HLS
      video.src = url;
      video.play().catch(() => {});
      return () => {
        video.removeAttribute("src");
        video.load();
      };
    }
  }, [episodeSources]);

  /* Track watch progress */
  useEffect(() => {
    if (!user || !anime?.mal_id || !libraryEntry) return;

    const handleTimeUpdate = () => {
      const video = videoRef.current;
      if (!video || !video.duration) return;

      const progress = video.currentTime / video.duration;

      // Mark episode as watched at 80% completion
      if (progress >= 0.8 && libraryEntry.progress < currentEpisode) {
        updateProgress(user.id, anime.mal_id, currentEpisode).catch(() => {});
      }
    };

    const video = videoRef.current;
    video?.addEventListener("timeupdate", handleTimeUpdate);
    return () => video?.removeEventListener("timeupdate", handleTimeUpdate);
  }, [user, anime, currentEpisode, libraryEntry]);

  /* Handle episode navigation */
  const goToEpisode = (num) => {
    setCurrentEpisode(num);
    setSelectedServer(null);
    navigate(`/watch/${animeId}/${num}`, { replace: true });
  };

  const hasNextEpisode = useMemo(() => {
    if (!streamInfo?.episodes) return false;
    return streamInfo.episodes.some((e) => e.number === currentEpisode + 1);
  }, [streamInfo, currentEpisode]);

  const hasPrevEpisode = currentEpisode > 1;

  /* Loading state */
  if (animeLoading || sourceLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="text-center">
          <Spinner className="mx-auto h-8 w-8" />
          <p className="mt-3 text-sm text-text-secondary">
            Finding stream source…
          </p>
        </div>
      </div>
    );
  }

  /* Source not found */
  if (sourceError || !streamSource) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-lg font-semibold">Streaming source not found</p>
        <p className="mt-2 text-sm text-text-secondary">
          {sourceErrorMsg?.message ||
            "This anime may not be available for streaming."}
        </p>
        <Link to={`/anime/${animeId}`} className="btn-brand mt-4">
          Back to details
        </Link>
      </div>
    );
  }

  const animeTitle = anime?.title_english || anime?.title_romaji || "Anime";
  const episodes = streamInfo?.episodes || [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Top bar */}
      <div className="mb-4 flex items-center justify-between">
        <Link
          to={`/anime/${animeId}`}
          className="flex items-center gap-1 text-sm text-text-secondary transition hover:text-brand"
        >
          <ChevronLeft className="h-4 w-4" /> Back to {animeTitle}
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEpisodeList((v) => !v)}
            className="btn-ghost !px-3 !py-1.5 !text-xs"
          >
            <List className="h-3.5 w-3.5" />
            Episodes
          </button>
        </div>
      </div>

      {/* Video area */}
      <div className="relative aspect-video w-full overflow-hidden rounded-card border border-border-dark bg-black">
        {sourcesLoading ? (
          <div className="grid h-full place-items-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand" />
              <p className="mt-3 text-sm text-text-secondary">
                Loading episode {currentEpisode}…
              </p>
            </div>
          </div>
        ) : sourcesError ? (
          <div className="grid h-full place-items-center p-8 text-center">
            <div>
              <p className="font-semibold text-brand">Failed to load episode</p>
              <p className="mt-2 text-sm text-text-secondary">
                {sourcesError.message}
              </p>
              <button
                onClick={() => refetchSource()}
                className="btn-ghost mt-4"
              >
                <RefreshCw className="h-4 w-4" /> Try again
              </button>
            </div>
          </div>
        ) : (
          <video
            ref={videoRef}
            controls
            className="h-full w-full"
            playsInline
            crossOrigin="anonymous"
          >
            <source
              src={episodeSources?.sources?.[0]?.url}
              type="application/x-mpegURL"
            />
          </video>
        )}
      </div>

      {/* Controls bar */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => goToEpisode(currentEpisode - 1)}
            disabled={!hasPrevEpisode || sourcesLoading}
            className="btn-ghost !px-3 !py-2 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>

          <span className="px-3 text-sm font-semibold">
            Episode {currentEpisode}
            {streamInfo?.totalEpisodes && ` / ${streamInfo.totalEpisodes}`}
          </span>

          <button
            onClick={() => goToEpisode(currentEpisode + 1)}
            disabled={!hasNextEpisode || sourcesLoading}
            className="btn-brand !px-3 !py-2 disabled:opacity-40"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Server selector */}
        {episodeSources?.servers?.length > 0 && (
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-text-muted" />
            <select
              value={selectedServer || episodeSources.activeServer || ""}
              onChange={(e) => setSelectedServer(e.target.value)}
              className="input-dark !py-1.5 !text-xs"
            >
              {episodeSources.servers.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Episode list panel */}
      {showEpisodeList && episodes.length > 0 && (
        <div className="mt-6 card p-4">
          <h3 className="mb-3 text-sm font-bold">
            Episodes · {streamInfo.totalEpisodes || episodes.length}
          </h3>
          <div className="grid max-h-96 grid-cols-4 gap-2 overflow-y-auto sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
            {episodes.map((ep) => (
              <button
                key={ep.id}
                onClick={() => goToEpisode(ep.number)}
                className={cn(
                  "rounded-md border px-2 py-2 text-xs font-medium transition",
                  ep.number === currentEpisode
                    ? "border-brand bg-brand text-white"
                    : "border-border-dark bg-surface-dark text-text-secondary hover:border-brand/60 hover:text-text-primary",
                )}
              >
                {ep.number}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
