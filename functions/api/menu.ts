import { categories, menu } from "../../src/data/menu";
import { ensureRequiredApiEnv, type ApiEnv, json } from "./_utils";

export const onRequestGet: PagesFunction<ApiEnv> = async ({ env }) => {
  const envError = ensureRequiredApiEnv(env);
  if (envError) {
    return envError;
  }

  return json(
    {
      categories,
      items: menu,
    },
    { status: 200 },
  );
};
