/** Safe local templates; never execute arbitrary JavaScript. */
export const FORMULA_PRESETS = [
  { id: "discount", name: "Цена со скидкой", expression: "price*(1-discount/100)", variables: ["price", "discount"] },
  { id: "circle", name: "Площадь круга", expression: "pi*r^2", variables: ["r"] },
  { id: "growth", name: "Изменение в %", expression: "(new-old)/old*100", variables: ["old", "new"] },
  { id: "speed", name: "Средняя скорость", expression: "distance/time", variables: ["distance", "time"] },
] as const;
