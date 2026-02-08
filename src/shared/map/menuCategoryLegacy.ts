const LEGACY_MENU_CATEGORY_FALLBACKS: Record<string, string> = {
  classic: "pizza",
  signature: "pizza",
  roman: "pizza",
  seasonal: "pizza",
  cold: "snacks",
  fried: "snacks",
  desserts: "dessert",
  drinks: "drinks",
};

export function mapLegacyMenuCategory(category: string) {
  const normalized = category.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  return LEGACY_MENU_CATEGORY_FALLBACKS[normalized] ?? null;
}

export function resolveSupportedMenuCategory(category: string, supportedCategories: readonly string[]) {
  const supportedSet = new Set(supportedCategories.map((item) => item.trim()).filter(Boolean));
  if (supportedSet.has(category)) {
    return category;
  }

  const legacyMapped = mapLegacyMenuCategory(category);
  if (legacyMapped && supportedSet.has(legacyMapped)) {
    return legacyMapped;
  }

  return supportedCategories.find((item) => item.trim()) ?? null;
}

export { LEGACY_MENU_CATEGORY_FALLBACKS };
