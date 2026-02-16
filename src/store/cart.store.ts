import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MenuItem } from "../data/menu";

export type CartLine = {
  id: string; // menu item id
  title: string;
  price: number;
  qty: number;
  size?: "S" | "M" | "L";
};

export type CartState = {
  lines: CartLine[];
  add: (item: MenuItem, opts?: { size?: CartLine["size"]; price?: number }) => void;
  dec: (id: string, size?: CartLine["size"]) => void;
  inc: (id: string, size?: CartLine["size"]) => void;
  remove: (id: string, size?: CartLine["size"]) => void;
  clear: () => void;
};

function keyOf(id: string, size?: CartLine["size"]) {
  return `${id}__${size ?? "M"}`;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (item, opts) => {
        const size = opts?.size ?? "M";
        const price = opts?.price ?? item.priceFrom;
        const k = keyOf(item.id, size);
        set((s) => {
          const idx = s.lines.findIndex((l) => keyOf(l.id, l.size) === k);
          if (idx >= 0) {
            const next = s.lines.slice();
            const line = next[idx];
            if (!line) {
              return { lines: next };
            }
            next[idx] = { ...line, qty: line.qty + 1 };
            return { lines: next };
          }
          return { lines: [...s.lines, { id: item.id, title: item.title, price, qty: 1, size }] };
        });
      },
      dec: (id, size) => {
        const k = keyOf(id, size);
        set((s) => {
          const next = s.lines
            .map((l) => (keyOf(l.id, l.size) === k ? { ...l, qty: l.qty - 1 } : l))
            .filter((l) => l.qty > 0);
          return { lines: next };
        });
      },
      inc: (id, size) => {
        const k = keyOf(id, size);
        set((s) => ({
          lines: s.lines.map((l) => (keyOf(l.id, l.size) === k ? { ...l, qty: l.qty + 1 } : l)),
        }));
      },
      remove: (id, size) => {
        const k = keyOf(id, size);
        set((s) => ({ lines: s.lines.filter((l) => keyOf(l.id, l.size) !== k) }));
      },
      clear: () => set({ lines: [] }),
    }),
    { name: "pizza-tagil-cart-v1" }
  )
);
