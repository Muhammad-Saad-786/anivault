import type { ReactNode } from "react";

export function Tabs({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}
export function TabList({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2 border-b border-border-dark">{children}</div>
  );
}
export function Tab({
  active = false,
  children,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-b-2 px-3 py-2 text-sm ${active ? "border-brand text-white" : "border-transparent text-text-secondary"}`}
    >
      {children}
    </button>
  );
}
