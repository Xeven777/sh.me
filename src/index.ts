import { Hono } from "hono";

interface Env {
  urls: KVNamespace;
  ASSETS: Fetcher;
}

const app = new Hono<{ Bindings: Env }>();

app.get("/api/links", async (c) => {
  const list = await c.env.urls.list();
  const links: Record<string, string> = {};

  for (const key of list.keys) {
    const value = await c.env.urls.get(key.name);
    if (value) {
      links[key.name] = value;
    }
  }

  return c.json(links);
});

app.post("/api/links", async (c) => {
  const { code, url } = await c.req.json<{ code: string; url: string }>();

  if (!code || !url) {
    return c.json({ success: false, error: "Missing code or url" }, 400);
  }

  await c.env.urls.put(code, url);
  return c.json({ success: true });
});

app.delete("/api/links", async (c) => {
  const { code } = await c.req.json<{ code: string }>();

  if (!code) {
    return c.json({ success: false, error: "Missing code" }, 400);
  }

  await c.env.urls.delete(code);
  return c.json({ success: true });
});

app.get("/:code", async (c) => {
  const code = c.req.param("code");
  const url = await c.env.urls.get(code);

  if (url) {
    return c.redirect(url, 302);
  }

  return c.env.ASSETS.fetch(c.req.raw);
});

app.get("*", async (c) => {
  return c.env.ASSETS.fetch(c.req.raw);
});

export default app;
