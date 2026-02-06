import { categories, menu } from "../../src/data/menu";
import { json } from "./_utils";

export const onRequestGet: PagesFunction = async () => {
  return json(
    {
      categories,
      items: menu,
    },
    { status: 200 },
  );
};
