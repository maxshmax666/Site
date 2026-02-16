import { afterEach, describe, expect, it } from "vitest";
import type { MenuItem } from "../data/menu";
import {
  selectCartCount,
  selectCartLines,
  selectCartTotal,
} from "./cart.selectors";
import { useCartStore } from "./cart.store";

const margherita: MenuItem = {
  id: "m1",
  category: "classic",
  title: "Маргарита",
  desc: "test",
  priceFrom: 500,
};

const pepperoni: MenuItem = {
  id: "m2",
  category: "classic",
  title: "Пепперони",
  desc: "test",
  priceFrom: 700,
};

afterEach(() => {
  useCartStore.setState({ lines: [] });
  window.localStorage.removeItem("pizza-tagil-cart-v1");
});

describe("cart selectors", () => {
  it("returns zero totals for empty cart", () => {
    const state = useCartStore.getState();

    expect(selectCartLines(state)).toEqual([]);
    expect(selectCartCount(state)).toBe(0);
    expect(selectCartTotal(state)).toBe(0);
  });

  it("calculates totals across same item in different sizes", () => {
    useCartStore.getState().add(margherita, { size: "S", price: 450 });
    useCartStore.getState().add(margherita, { size: "L", price: 650 });
    useCartStore.getState().add(pepperoni, { size: "M", price: 700 });

    const state = useCartStore.getState();

    expect(selectCartLines(state)).toHaveLength(3);
    expect(selectCartCount(state)).toBe(3);
    expect(selectCartTotal(state)).toBe(1800);
  });

  it("tracks total and count after increments and decrements", () => {
    const store = useCartStore.getState();

    store.add(margherita, { size: "M", price: 500 });
    store.inc(margherita.id, "M");
    store.inc(margherita.id, "M");
    store.add(pepperoni, { size: "L", price: 800 });

    let state = useCartStore.getState();
    expect(selectCartCount(state)).toBe(4);
    expect(selectCartTotal(state)).toBe(2300);

    useCartStore.getState().dec(margherita.id, "M");
    useCartStore.getState().dec(pepperoni.id, "L");

    state = useCartStore.getState();
    expect(selectCartCount(state)).toBe(2);
    expect(selectCartTotal(state)).toBe(1000);
  });

  it("returns stable lines reference for same snapshot", () => {
    const state = useCartStore.getState();

    expect(selectCartLines(state)).toBe(selectCartLines(state));
  });
});
