import { json } from "./_utils";

export const onRequestGet: PagesFunction = async () => {
  return json({ ok: true }, { status: 200 });
};
