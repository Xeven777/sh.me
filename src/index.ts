import { Hono } from "hono";

interface Env {
  urls: KVNamespace;
  ASSETS: Fetcher;
  API_KEY?: string;
}

const RESERVED_KEYS = ["api", "public", "static", "assets", "admin"];

const app = new Hono<{ Bindings: Env }>();

const generateRandomCode = (length = 4) => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

app.get("/api/links", async (c) => {
  const auth = c.req.header("Authorization");
  if (c.env.API_KEY && auth !== c.env.API_KEY) {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }

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
  const auth = c.req.header("Authorization");
  if (c.env.API_KEY && auth !== c.env.API_KEY) {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }

  let { code, url } = await c.req.json<{ code: string; url: string }>();

  if (!url) {
    return c.json({ success: false, error: "Missing destination URL." }, 400);
  }

  // 1. URL Length Validation
  if (url.length > 1500) {
    return c.json(
      { success: false, error: "URL is too long. Max 1500 characters." },
      400,
    );
  }

  // 2. Short Code Logic
  if (!code || code.trim() === "") {
    let attempts = 0;
    do {
      code = generateRandomCode(4);
      const exists = await c.env.urls.get(code);
      if (!exists) break;
      attempts++;
    } while (attempts < 5);
  } else {
    code = code.trim().toLowerCase();

    if (!/^[a-z0-9-]+$/.test(code)) {
      return c.json(
        {
          success: false,
          error: "Invalid code format. Use letters, numbers, and hyphens.",
        },
        400,
      );
    }

    if (RESERVED_KEYS.includes(code)) {
      return c.json(
        { success: false, error: "This code is reserved and cannot be used." },
        400,
      );
    }

    const existing = await c.env.urls.get(code);
    if (existing) {
      return c.json(
        { success: false, error: "Link code already exists." },
        409,
      );
    }
  }

  // 3. URL Format Check
  try {
    const validUrl = new URL(url);
    if (!["http:", "https:"].includes(validUrl.protocol)) throw new Error();
  } catch {
    return c.json(
      {
        success: false,
        error: "Invalid destination URL. Must be a valid http/https link.",
      },
      400,
    );
  }

  await c.env.urls.put(code, url);
  return c.json({ success: true });
});

app.delete("/api/links", async (c) => {
  const auth = c.req.header("Authorization");
  if (c.env.API_KEY && auth !== c.env.API_KEY) {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }

  const { code } = await c.req.json<{ code: string }>();

  if (!code) {
    return c.json({ success: false, error: "Missing code" }, 400);
  }

  await c.env.urls.delete(code.toLowerCase());
  return c.json({ success: true });
});

app.get("/:code", async (c) => {
  const code = c.req.param("code").toLowerCase();
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
