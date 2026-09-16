import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "YOUR_SUPABASE_URL";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const sampleAnimeData = [
  {
    title: "Frieren: Beyond Journey's End",
    japanese_title: "Sousou no Frieren",
    synopsis:
      "The adventure is over but life goes on for an elf mage just beginning to learn what living is all about. Elf mage Frieren and her courageous fellow adventurers have defeated the Demon King and brought peace to the land.",
    cover_image_url:
      "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80",
    banner_image_url:
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80",
    total_episodes: 28,
    status: "finished",
    score: 9.3,
    release_year: 2023,
    genres: ["Fantasy", "Adventure", "Drama"],
  },
  {
    title: "Jujutsu Kaisen",
    japanese_title: "Jujutsu Kaisen",
    synopsis:
      "A boy swallows a cursed talisman - the finger of a demon - and becomes cursed himself. He enters a shaman's school to be able to locate the demon's other body parts and thus exorcise himself.",
    cover_image_url:
      "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80",
    banner_image_url:
      "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80",
    total_episodes: 24,
    status: "finished",
    score: 8.6,
    release_year: 2020,
    genres: ["Action", "Supernatural", "Fantasy"],
  },
  {
    title: "Kaguya-sama: Love Is War",
    japanese_title: "Kaguya-sama wa Kokurasetai",
    synopsis:
      "Two high school geniuses duel to make the other confess their love first, as both believe whoever confesses first loses the war of romantic pride.",
    cover_image_url:
      "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80",
    banner_image_url:
      "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop&q=80",
    total_episodes: 12,
    status: "finished",
    score: 8.8,
    release_year: 2019,
    genres: ["Romance", "Comedy", "Psychological"],
  },
  {
    title: "Bocchi the Rock!",
    japanese_title: "Bocchi za Rokku!",
    synopsis:
      "Hitori Gotou is a lonely, socially anxious girl who spends her time playing the guitar. Her dream of joining a band comes true when she meets Nijika Ijichi, drummer of Kessoku Band.",
    cover_image_url:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
    banner_image_url:
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80",
    total_episodes: 12,
    status: "finished",
    score: 8.9,
    release_year: 2022,
    genres: ["Comedy", "Slice of Life"],
  },
  {
    title: "Attack on Titan",
    japanese_title: "Shingeki no Kyojin",
    synopsis:
      "Humanity has been forced to live behind gigantic walls to protect themselves from man-eating humanoid monsters known as Titans. When the outer wall is destroyed, young Eren Yeager vows to eliminate every Titan.",
    cover_image_url:
      "https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80",
    banner_image_url:
      "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80",
    total_episodes: 87,
    status: "finished",
    score: 9.1,
    release_year: 2013,
    genres: ["Action", "Drama", "Mystery", "Psychological"],
  },
  {
    title: "Chainsaw Man",
    japanese_title: "Chainsaw Man",
    synopsis:
      "Denji is a teenage boy living with a Chainsaw Devil named Pochita. When betrayed and killed, Pochita fuses with Denji, resurrecting him as the unstoppable Chainsaw Man.",
    cover_image_url:
      "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80",
    banner_image_url:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
    total_episodes: 12,
    status: "finished",
    score: 8.5,
    release_year: 2022,
    genres: ["Action", "Supernatural", "Horror"],
  },
];

async function seedDatabase() {
  console.log("🌱 Fetching existing genres...");
  const { data: genresData, error: genreErr } = await supabase
    .from("genres")
    .select("id, name");
  if (genreErr) {
    console.error("Genre fetch error:", genreErr);
    return;
  }

  const genreMap = Object.fromEntries(
    genresData.map((g) => [g.name.toLowerCase(), g.id]),
  );

  console.log("🚀 Inserting Anime records...");
  for (const item of sampleAnimeData) {
    const { genres, ...animeFields } = item;

    const { data: insertedAnime, error: animeErr } = await supabase
      .from("animes")
      .insert([animeFields])
      .select()
      .single();

    if (animeErr) {
      console.error(`Failed to insert ${item.title}:`, animeErr.message);
      continue;
    }

    console.log(`✅ Inserted: ${insertedAnime.title}`);

    // Link anime to genres
    const genreLinks = genres
      .map((genreName) => {
        const genreId = genreMap[genreName.toLowerCase()];
        return genreId
          ? { anime_id: insertedAnime.id, genre_id: genreId }
          : null;
      })
      .filter(Boolean);

    if (genreLinks.length > 0) {
      await supabase.from("anime_genres").insert(genreLinks);
    }
  }

  console.log("✨ Seeding completed successfully!");
}

seedDatabase();
