import { cn } from "../../lib/cn";

export function Tabs<T extends string>({
  value,
  onChange,
  items,
}: {
  value: T;
  onChange: (v: T) => void;
  items: Array<{ value: T; label: string }>;
}) {
  return (
    <div className="inline-flex gap-1 p-1 rounded-2xl bg-white/5 border border-white/10">
      {items.map((x) => {
        const active = x.value === value;
        return (
          <button
            key={x.value}
            onClick={() => onChange(x.value)}
            className={cn(
              "px-3 py-2 rounded-xl text-sm transition",
              active ? "bg-white/12" : "hover:bg-white/10 text-white/80"
            )}
          >
            {x.label}
          </button>
        );
      })}
    </div>
  );
}
