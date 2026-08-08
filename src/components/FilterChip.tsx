import { cn } from "@/lib/utils";

export function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-all",
        active
          ? "border-transparent bg-primary text-primary-foreground shadow-stage"
          : "border-border bg-card text-foreground hover:border-accent hover:bg-secondary",
      )}
    >
      {children}
    </button>
  );
}
