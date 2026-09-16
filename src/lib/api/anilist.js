import axios from "axios";

const ANILIST_URL = (
  import.meta.env.VITE_ANILIST_BASE || "https://graphql.anilist.co"
).replace(/\/+$/, "");
const anilist = axios.create({
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

async function gql(query, variables) {
  const { data } = await anilist.post(ANILIST_URL, { query, variables });
  if (data?.errors?.length) {
    throw new Error(data.errors[0].message || "AniList error");
  }
  return data.data;
}

/* ------------------------------------------------------------------ */
/* Fragments                                                           */
/* ------------------------------------------------------------------ */

const MEDIA_FIELDS = `
  id
  idMal
  title { romaji english native }
  synonyms
  description(asHtml: false)
  coverImage { extraLarge large medium color }
  bannerImage
  trailer { id site }
  averageScore
  meanScore
  popularity
  favourites
  trending
  episodes
  duration
  format
  status
  season
  seasonYear
  source
  genres
  tags { name rank isGeneralSpoiler }
  studios(isMain: true) { nodes { id name } }
  startDate { year month day }
  endDate   { year month day }
  nextAiringEpisode { episode airingAt timeUntilAiring }
  isAdult
`;

const CHARACTERS_QUERY = `
query ($id: Int) {
  Media(id: $id, type: ANIME) {
    characters(sort: [ROLE, RELEVANCE, ID], perPage: 24) {
      edges {
        role
        node {
          id
          name { full native }
          image { large medium }
        }
        voiceActors(language: JAPANESE) {
          id
          name { full native }
          image { large medium }
          languageV2
        }
      }
    }
  }
}`;

const STAFF_QUERY = `
query ($id: Int) {
  Media(id: $id, type: ANIME) {
    staff(perPage: 24) {
      edges {
        role
        node {
          id
          name { full native }
          image { large medium }
        }
      }
    }
  }
}`;

const RECS_QUERY = `
query ($id: Int) {
  Media(id: $id, type: ANIME) {
    recommendations(sort: RATING_DESC, perPage: 12) {
      nodes {
        mediaRecommendation {
          id
          idMal
          title { romaji english native }
          coverImage { extraLarge large medium color }
          averageScore
          episodes
          format
          status
          seasonYear
          genres
          isAdult
        }
      }
    }
  }
}`;

const RELATIONS_QUERY = `
query ($id: Int) {
  Media(id: $id, type: ANIME) {
    relations {
      edges {
        relationType(version: 2)
        node {
          id
          idMal
          title { romaji english native }
          coverImage { large medium }
          format
          status
          episodes
          averageScore
        }
      }
    }
  }
}`;

/* ------------------------------------------------------------------ */
/* Normalizer — shape close to Jikan so existing components work      */
/* ------------------------------------------------------------------ */

export function mapAniListToJikan(m) {
  if (!m) return null;
  const title =
    m.title?.english || m.title?.romaji || m.title?.native || "Untitled";

  return {
    // IDs
    mal_id: m.idMal ?? m.id,
    anilist_id: m.id,

    // Titles
    title,
    title_english: m.title?.english,
    title_japanese: m.title?.native,
    title_romaji: m.title?.romaji,
    title_synonyms: m.synonyms || [],

    // Images
    images: {
      jpg: {
        image_url: m.coverImage?.large || m.coverImage?.medium,
        large_image_url: m.coverImage?.extraLarge || m.coverImage?.large,
      },
      webp: { large_image_url: m.coverImage?.extraLarge },
    },
    banner_url: m.bannerImage,

    // Trailer
    trailer: m.trailer
      ? {
          youtube_id: m.trailer.id,
          url:
            m.trailer.site === "youtube"
              ? `https://www.youtube.com/watch?v=${m.trailer.id}`
              : null,
        }
      : null,

    // Scores
    score: m.averageScore != null ? m.averageScore / 10 : null,
    scored_by: m.meanScore != null ? m.meanScore : null,
    popularity: m.popularity,
    members: m.favourites,
    rank: null,
    trending: m.trending,

    // Structure
    episodes: m.episodes,
    duration: m.duration ? `${m.duration} min per ep` : null,
    type: m.format,
    status: m.status,
    source: m.source,
    rating: m.isAdult ? "R+ (Adult)" : null,

    // Season
    season: m.season?.toLowerCase(),
    year: m.seasonYear,

    // Dates
    aired: {
      from: isoDate(m.startDate),
      to: isoDate(m.endDate),
    },

    // Info
    synopsis: stripHtml(m.description),
    genres: (m.genres || []).map((name, i) => ({ mal_id: i, name })),
    themes: (m.tags || [])
      .filter((t) => t.isGeneralSpoiler === false)
      .slice(0, 8)
      .map((t, i) => ({ mal_id: 1000 + i, name: t.name })),
    demographics: [],
    studios: (m.studios?.nodes || []).map((s) => ({
      mal_id: s.id,
      name: s.name,
    })),
    producers: [],

    // Episode airing info
    broadcast: m.nextAiringEpisode
      ? {
          next_episode: m.nextAiringEpisode.episode,
          airing_at: m.nextAiringEpisode.airingAt,
        }
      : null,

    airing: m.status === "RELEASING",
    _raw: m,
  };
}

function stripHtml(html) {
  if (!html) return null;
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
}

function isoDate({ year, month, day } = {}) {
  if (!year) return null;
  const m = String(month || 1).padStart(2, "0");
  const d = String(day || 1).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

/**
 * Search anime with filters. Replaces Jikan's /anime search endpoint.
 */
export async function searchAnimeAniList({
  q,
  genres,
  type,
  status,
  season,
  year,
  minScore,
  sort = "POPULARITY_DESC",
  page = 1,
  perPage = 24,
} = {}) {
  const query = `
  query ($page: Int, $perPage: Int, $search: String, $genre_in: [String], $format: MediaFormat, $status: MediaStatus, $season: MediaSeason, $seasonYear: Int, $averageScore_greater: Int, $sort: [MediaSort]) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { total currentPage lastPage hasNextPage }
      media(
        type: ANIME
        isAdult: false
        search: $search
        genre_in: $genre_in
        format: $format
        status: $status
        season: $season
        seasonYear: $seasonYear
        averageScore_greater: $averageScore_greater
        sort: $sort
      ) {
        ${MEDIA_FIELDS}
      }
    }
  }`;

  const variables = {
    page,
    perPage,
    search: q?.trim() || undefined,
    genre_in: genres?.length ? genres : undefined,
    format: normalizeFormat(type),
    status: normalizeStatus(status),
    season: season ? season.toUpperCase() : undefined,
    seasonYear: year ? Number(year) : undefined,
    averageScore_greater: minScore
      ? Math.round(Number(minScore) * 10)
      : undefined,
    sort: normalizeSort(sort),
  };

  const data = await gql(query, variables);
  const page_data = data.Page;
  const results = page_data.media.map(mapAniListToJikan);

  return {
    data: results,
    pagination: {
      current_page: page_data.pageInfo.currentPage,
      last_visible_page: page_data.pageInfo.lastPage,
      has_next_page: page_data.pageInfo.hasNextPage,
      items: { total: page_data.pageInfo.total },
    },
  };
}

export async function getAnimeByIdAniList(id) {
  // ID could be mal_id or anilist_id — try both.
  const query = `
  query ($id: Int, $idMal: Int) {
    Media(id: $id, idMal: $idMal, type: ANIME) {
      ${MEDIA_FIELDS}
      relations {
        edges {
          relationType(version: 2)
          node {
            id
            idMal
            title { romaji english native }
            coverImage { large medium }
            format
            status
          }
        }
      }
    }
  }`;

  const num = Number(id);
  let data;
  try {
    data = await gql(query, { id: num });
  } catch {
    data = await gql(query, { idMal: num });
  }

  if (!data?.Media) throw new Error("Anime not found");

  const mapped = mapAniListToJikan(data.Media);
  mapped.relations = (data.Media.relations?.edges || []).map((e) => ({
    relation: e.relationType,
    entry: mapAniListToJikan(e.node),
  }));
  return mapped;
}

export async function getTrendingAnime(page = 1, perPage = 24) {
  const items = await listMedia({
    page,
    perPage,
    sort: ["TRENDING_DESC", "POPULARITY_DESC"],
  });
  return items;
}

export async function getTopAnimeAniList(page = 1, perPage = 24) {
  return listMedia({ page, perPage, sort: ["SCORE_DESC"] });
}

export async function getSeasonalAniList(season, year, page = 1, perPage = 24) {
  return listMedia({
    page,
    perPage,
    sort: ["POPULARITY_DESC"],
    season: String(season).toUpperCase(),
    seasonYear: year,
  });
}

export async function getUpcomingAniList(page = 1, perPage = 24) {
  return listMedia({
    page,
    perPage,
    sort: ["POPULARITY_DESC"],
    status: "NOT_YET_RELEASED",
  });
}

export async function getAiringAniList(page = 1, perPage = 24) {
  return listMedia({
    page,
    perPage,
    sort: ["TRENDING_DESC"],
    status: "RELEASING",
  });
}

async function listMedia({
  page = 1,
  perPage = 24,
  sort = ["POPULARITY_DESC"],
  season,
  seasonYear,
  status,
  genre_in,
  format,
  search,
} = {}) {
  const query = `
  query ($page: Int, $perPage: Int, $sort: [MediaSort], $season: MediaSeason, $seasonYear: Int, $status: MediaStatus, $genre_in: [String], $format: MediaFormat, $search: String) {
    Page(page: $page, perPage: $perPage) {
      media(
        type: ANIME
        isAdult: false
        sort: $sort
        season: $season
        seasonYear: $seasonYear
        status: $status
        genre_in: $genre_in
        format: $format
        search: $search
      ) {
        ${MEDIA_FIELDS}
      }
    }
  }`;

  const data = await gql(query, {
    page,
    perPage,
    sort,
    season,
    seasonYear,
    status,
    genre_in,
    format,
    search,
  });
  return data.Page.media.map(mapAniListToJikan);
}

export async function getCharactersAniList(id) {
  const data = await gql(CHARACTERS_QUERY, { id: Number(id) });
  return (data.Media?.characters?.edges || []).map((e) => ({
    character: {
      mal_id: e.node.id,
      name: e.node.name.full,
      name_kanji: e.node.name.native,
      images: { jpg: { image_url: e.node.image.large } },
    },
    role: e.role,
    voice_actors: (e.voiceActors || []).map((va) => ({
      person: {
        mal_id: va.id,
        name: va.name.full,
        images: { jpg: { image_url: va.image.large } },
      },
      language: "Japanese",
    })),
  }));
}

export async function getStaffAniList(id) {
  const data = await gql(STAFF_QUERY, { id: Number(id) });
  return (data.Media?.staff?.edges || []).map((e) => ({
    person: {
      mal_id: e.node.id,
      name: e.node.name.full,
      images: { jpg: { image_url: e.node.image.large } },
    },
    positions: [e.role],
  }));
}

export async function getRecommendationsAniList(id) {
  const data = await gql(RECS_QUERY, { id: Number(id) });
  return (data.Media?.recommendations?.nodes || [])
    .map((n) => n.mediaRecommendation)
    .filter(Boolean)
    .map(mapAniListToJikan);
}

export async function getRelationsAniList(id) {
  const data = await gql(RELATIONS_QUERY, { id: Number(id) });
  return (data.Media?.relations?.edges || []).map((e) => ({
    relation: e.relationType,
    entry: mapAniListToJikan(e.node),
  }));
}

/* ------------------------------------------------------------------ */
/* Characters / Staff / Person / Studio                                */
/* ------------------------------------------------------------------ */

const CHARACTER_FULL_QUERY = `
query ($id: Int) {
  Character(id: $id) {
    id
    name { full native alternative }
    image { large medium }
    description(asHtml: false)
    gender
    dateOfBirth { year month day }
    age
    bloodType
    favourites
    media(perPage: 20, sort: POPULARITY_DESC) {
      edges {
        characterRole
        node {
          id
          idMal
          title { romaji english native }
          coverImage { large medium }
          format
          seasonYear
          averageScore
        }
      }
    }
  }
}`;

const PERSON_FULL_QUERY = `
query ($id: Int) {
  Staff(id: $id) {
    id
    name { full native alternative }
    image { large medium }
    description(asHtml: false)
    languageV2
    gender
    dateOfBirth { year month day }
    age
    homeTown
    favourites
    characterMedia(perPage: 20, sort: START_DATE_DESC) {
      edges {
        characterRole
        characters { id name { full native } image { large } }
        node {
          id
          idMal
          title { romaji english native }
          coverImage { large medium }
          format
          seasonYear
          averageScore
        }
      }
    }
    staffMedia(perPage: 25, sort: START_DATE_DESC) {
      edges {
        staffRole
        node {
          id
          idMal
          title { romaji english native }
          coverImage { large medium }
          format
          seasonYear
          averageScore
        }
      }
    }
  }
}`;

const STUDIO_QUERY = `
query ($id: Int) {
  Studio(id: $id) {
    id
    name
    isAnimationStudio
    favourites
    media(perPage: 24, sort: POPULARITY_DESC, isMain: true) {
      nodes {
        id
        idMal
        title { romaji english native }
        coverImage { large medium }
        format
        seasonYear
        averageScore
        episodes
      }
    }
  }
}`;

export async function getCharacterById(id) {
  const data = await gql(CHARACTER_FULL_QUERY, { id: Number(id) });
  return data.Character;
}

export async function getPersonById(id) {
  const data = await gql(PERSON_FULL_QUERY, { id: Number(id) });
  return data.Staff;
}

export async function getStudioById(id) {
  const data = await gql(STUDIO_QUERY, { id: Number(id) });
  return data.Studio;
}

/**
 * Re-export the already-existing helpers for consistency.
 * These were defined higher up in the file.
 */

/* ------------------------------------------------------------------ */
/* Normalizers                                                         */
/* ------------------------------------------------------------------ */

function normalizeFormat(f) {
  if (!f) return undefined;
  const map = {
    tv: "TV",
    movie: "MOVIE",
    ova: "OVA",
    ona: "ONA",
    special: "SPECIAL",
    music: "MUSIC",
    tv_short: "TV_SHORT",
  };
  return map[f.toLowerCase()] || f.toUpperCase();
}

function normalizeStatus(s) {
  if (!s) return undefined;
  const map = {
    airing: "RELEASING",
    complete: "FINISHED",
    completed: "FINISHED",
    upcoming: "NOT_YET_RELEASED",
    finished: "FINISHED",
  };
  return map[s.toLowerCase()] || s.toUpperCase();
}

function normalizeSort(s) {
  if (Array.isArray(s)) return s;
  const map = {
    popularity: ["POPULARITY_DESC"],
    score: ["SCORE_DESC"],
    rank: ["SCORE_DESC"],
    start_date: ["START_DATE_DESC"],
    title: ["TITLE_ROMAJI"],
    trending: ["TRENDING_DESC"],
  };
  return map[s] || ["POPULARITY_DESC"];
}

// Back-compat: expose a `jikan`-shaped alias so existing imports keep working.
export const getAnimeById = getAnimeByIdAniList;
export const getAnimeCharacters = getCharactersAniList;
export const getAnimeStaff = getStaffAniList;
export const getAnimeRecommendations = getRecommendationsAniList;
export const getTopAnime = getTopAnimeAniList;
export const getSeasonal = getSeasonalAniList;
/**
 * Fallback: same-genre top-scored anime.
 * Used when AniList returns zero recommendations.
 */
export async function getSimilarByGenreAniList(id, limit = 12) {
  const srcQuery = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      genres
    }
  }`;
  const { Media } = await gql(srcQuery, { id: Number(id) });
  const genres = Media?.genres || [];
  if (!genres.length) return [];

  const listQuery = `
  query ($genres: [String], $perPage: Int) {
    Page(perPage: $perPage) {
      media(
        type: ANIME
        genre_in: $genres
        isAdult: false
        sort: [SCORE_DESC]
      ) {
        id
        idMal
        title { romaji english native }
        coverImage { extraLarge large medium color }
        bannerImage
        averageScore
        meanScore
        popularity
        favourites
        episodes
        duration
        format
        status
        season
        seasonYear
        source
        genres
        studios(isMain: true) { nodes { id name } }
        startDate { year month day }
        endDate { year month day }
        isAdult
      }
    }
  }`;

  const data = await gql(listQuery, { genres, perPage: limit + 5 });
  return (data.Page?.media || [])
    .filter((m) => (m.idMal ?? m.id) !== Number(id))
    .slice(0, limit)
    .map(mapAniListToJikan);
}
