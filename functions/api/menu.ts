import { categories, menu } from "../../src/data/menu";
import { type ApiEnv, json } from "./_utils";

export const onRequestGet: PagesFunction<ApiEnv> = async ({ env }) => {
  void env;

  return json(
    {
      categories,
      items: menu,
    },
    { status: 200 },
  );
};
