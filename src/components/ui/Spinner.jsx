import { cn } from "@/lib/utils";

export default function Spinner({ className }) {
  return (
    <div
      className={cn(
        "h-5 w-5 animate-spin rounded-full border-2 border-border-dark border-t-brand",
        className,
      )}
    />
  );
}
