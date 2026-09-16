// add these imports at the top
import AddToLibrary from "@/components/library/AddToLibrary";

// replace the button row inside AnimeDetails with:
<div className="mt-5 flex flex-wrap gap-3">
  <button className="btn-brand !px-6 !py-2.5">
    <Play className="h-4 w-4 fill-white" /> Watch
  </button>
  <AddToLibrary anime={anime} />
</div>;
