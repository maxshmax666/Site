import type { CartState } from "./cart.store";

export const selectCartLines = (state: CartState) => state.lines;

export const selectCartCount = (state: CartState) =>
  state.lines.reduce((sum, line) => sum + line.qty, 0);

export const selectCartTotal = (state: CartState) =>
  state.lines.reduce((sum, line) => sum + line.price * line.qty, 0);
