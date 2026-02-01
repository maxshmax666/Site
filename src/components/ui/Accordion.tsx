export function Accordion({ items }: { items: Array<{ q: string; a: string }> }) {
  return (
    <div className="space-y-3">
      {items.map((x) => (
        <details key={x.q} className="rounded-2xl bg-white/5 border border-white/10 p-4">
          <summary className="cursor-pointer font-semibold select-none">{x.q}</summary>
          <div className="mt-2 text-sm text-white/75">{x.a}</div>
        </details>
      ))}
    </div>
  );
}
