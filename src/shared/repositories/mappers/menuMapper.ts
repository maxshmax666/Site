import { defaultMenuCategories, isMenuCategory, type MenuCategory } from "@/data/menuCategories";
import { type MenuItem } from "@/data/menu";
import { mapLegacyCategoryToUi } from "@/shared/map/menuCategoryLegacy";

export type MenuCategoryItem = {
  key: MenuCategory;
  label: string;
  fullLabel: string;
  imageUrl?: string;
  background: string;
  sort: number;
};

type ApiCategory = {
  key: string;
  label: string;
  fullLabel?: string;
  imageUrl?: string;
  background?: string;
};

type DbCategory = {
  key: unknown;
  label: unknown;
  full_label: unknown;
  image_url: unknown;
  fallback_background: unknown;
  sort: unknown;
};

type DbMenuItem = {
  id: unknown;
  title: unknown;
  description: unknown;
  category: unknown;
  price: unknown;
  image_url: unknown;
};

const DEFAULT_CATEGORY_BACKGROUND = "linear-gradient(135deg, #334155 0%, #0f172a 100%)";

export const mapDefaultMenuCategories = (): MenuCategoryItem[] =>
  defaultMenuCategories.map(
    (category, idx) =>
      ({
        key: category.value,
        label: category.label,
        fullLabel: category.fullLabel,
        imageUrl: category.imageUrl,
        background: category.fallbackBackground,
        sort: idx * 10 + 10,
      }) satisfies MenuCategoryItem,
  );

export const mapMenuApiCategoriesToUi = (categories: ApiCategory[]): MenuCategoryItem[] =>
  categories
    .filter((category) => isMenuCategory(category.key))
    .map(
      (category, idx) =>
        ({
          key: category.key,
          label: category.label,
          fullLabel: category.fullLabel?.trim() || category.label,
          imageUrl: category.imageUrl,
          background: category.background ?? DEFAULT_CATEGORY_BACKGROUND,
          sort: idx * 10 + 10,
        }) satisfies MenuCategoryItem,
    );

export const mapMenuDbCategoriesToUi = (categories: DbCategory[]): MenuCategoryItem[] =>
  categories
    .map((category) => ({
      key: String(category.key ?? ""),
      label: String(category.label ?? "").trim(),
      fullLabel: String(category.full_label ?? "").trim(),
      imageUrl: typeof category.image_url === "string" ? category.image_url : undefined,
      background:
        typeof category.fallback_background === "string" ? category.fallback_background : DEFAULT_CATEGORY_BACKGROUND,
      sort: Number(category.sort ?? 100),
    }))
    .filter((category) => isMenuCategory(category.key) && category.label)
    .map((category) => ({
      key: category.key as MenuCategory,
      label: category.label,
      fullLabel: category.fullLabel || category.label,
      imageUrl: category.imageUrl,
      background: category.background,
      sort: Number.isFinite(category.sort) ? category.sort : 100,
    }));

export const mapMenuDbItemsToUi = (rows: DbMenuItem[]): MenuItem[] =>
  rows
    .map((row) => {
      const rawCategory = String(row.category ?? "").trim();
      const uiCategory = mapLegacyCategoryToUi(rawCategory) ?? rawCategory;

      return {
        id: String(row.id ?? ""),
        title: String(row.title ?? ""),
        desc: String(row.description ?? ""),
        category: uiCategory,
        priceFrom: Number(row.price ?? 0),
        image: typeof row.image_url === "string" ? row.image_url : undefined,
      } satisfies MenuItem;
    })
    .filter((item) => item.id && item.title && item.category && Number.isFinite(item.priceFrom));
