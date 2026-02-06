export function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");

  return new Response(JSON.stringify(data), {
    ...init,
    headers,
  });
}

export function methodNotAllowed(allow: string): Response {
  return json(
    {
      error: "Method Not Allowed",
    },
    {
      status: 405,
      headers: {
        allow,
      },
    },
  );
}
