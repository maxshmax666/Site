export type MenuItemsFilters = {
  category?: string;
  search?: string;
};

export const queryKeys = {
  menu: {
    items: (filters?: MenuItemsFilters) => ["menu", "items", filters ?? {}] as const,
    categories: () => ["menu", "categories"] as const,
  },
  orders: {
    my: (userId: string, page: number) => ["orders", "my", userId, page] as const,
  },
  loyalty: {
    account: (userId: string) => ["loyalty", "account", userId] as const,
  },
} as const;
