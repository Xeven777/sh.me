import { Hono } from "hono";
import { renderer } from "./renderer";

interface Env {
  urls: KVNamespace;
  API_KEY?: string;
  RESERVED_KEYS: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use(renderer);

// Auth Middleware
const authMiddleware = async (c: any, next: any) => {
  const auth = c.req.header("Authorization");

  if (!c.env.API_KEY) {
    return c.json(
      { success: false, error: "Server configuration error: API_KEY not set" },
      500,
    );
  }

  if (!auth || auth !== c.env.API_KEY) {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }

  await next();
};

const generateRandomCode = (length = 4) => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

app.get("/api/links", authMiddleware, async (c) => {
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

app.post("/api/links", authMiddleware, async (c) => {
  let { code, url } = await c.req.json<{ code: string; url: string }>();

  if (!url) {
    return c.json({ success: false, error: "Missing destination URL." }, 400);
  }

  if (url.length > 1500) {
    return c.json(
      { success: false, error: "URL is too long. Max 1500 characters." },
      400,
    );
  }

  const reservedKeys = c.env.RESERVED_KEYS?.split(",") || [];

  if (!code || code.trim() === "") {
    let attempts = 0;
    do {
      code = generateRandomCode(4);
      const exists = await c.env.urls.get(code);
      if (!exists && !reservedKeys.includes(code)) break;
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

    if (reservedKeys.includes(code)) {
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

app.delete("/api/links", authMiddleware, async (c) => {
  const { code } = await c.req.json<{ code: string }>();

  if (!code) {
    return c.json({ success: false, error: "Missing code" }, 400);
  }

  await c.env.urls.delete(code.toLowerCase());
  return c.json({ success: true });
});

app.get("/", (c) => {
  return c.render(
    <div class="container">
      <header>
        <div class="header-content">
          <div class="logo">
            <i data-lucide="link"></i>
          </div>
          <h1>Sh.Me</h1>
        </div>
        <p class="subtitle">Manage your short links with ease and speed.</p>
      </header>

      <section class="form-section">
        <div class="form-card">
          <form id="shorten-form" class="form-grid">
            <div class="form-group">
              <label>Short Code (optional)</label>
              <input type="text" id="code" placeholder="gh" maxLength={30} />
            </div>
            <div class="form-group">
              <label>Destination URL</label>
              <input
                type="url"
                id="url"
                placeholder="https://github.com/xeven777"
                required
                maxLength={1500}
              />
            </div>
            <div class="form-group">
              <button type="submit">
                <span>Add Link</span>
                <i data-lucide="plus"></i>
              </button>
            </div>
          </form>
        </div>
      </section>

      <section>
        <div class="links-header">
          <h2>Active Links</h2>
          <span id="link-count" class="badge">
            0 Links
          </span>
        </div>

        <div id="links-container" class="links-container">
          <div class="loading">
            <div class="spinner"></div>
          </div>
        </div>
      </section>

      <script
        dangerouslySetInnerHTML={{
          __html: `
        document.addEventListener('DOMContentLoaded', () => {
          lucide.createIcons();
          fetchLinks();
        });

        const form = document.getElementById('shorten-form');
        const container = document.getElementById('links-container');
        const countBadge = document.getElementById('link-count');

        function getAuthHeader() {
          return localStorage.getItem('api_key') || '';
        }

        async function handleResponse(response) {
          if (response.status === 401) {
            const key = prompt('Please enter your Admin API Key:');
            if (key) {
              localStorage.setItem('api_key', key);
              location.reload();
            }
          }
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || 'Something went wrong');
          }
          return data;
        }

        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const code = document.getElementById('code').value;
          const url = document.getElementById('url').value;
          const submitBtn = form.querySelector('button[type="submit"]');
          
          submitBtn.disabled = true;

          try {
            const response = await fetch('/api/links', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': getAuthHeader()
              },
              body: JSON.stringify({ code, url })
            });

            await handleResponse(response);
            form.reset();
            fetchLinks();
            showToast('Link added successfully!');
          } catch (err) {
            showToast(err.message, 'error');
          } finally {
            submitBtn.disabled = false;
          }
        });

        async function fetchLinks() {
          try {
            const response = await fetch('/api/links', {
              headers: { 'Authorization': getAuthHeader() }
            });
            
            const links = await handleResponse(response);
            
            container.innerHTML = '';
            const entries = Object.entries(links);
            countBadge.textContent = \`\${entries.length} Links\`;

            if (entries.length === 0) {
              container.innerHTML = \`
                <div class="empty-state">
                  <i data-lucide="ghost"></i>
                  <p>No links found. Create your first one above!</p>
                </div>
              \`;
              lucide.createIcons();
              return;
            }

            entries.sort().forEach(([code, url]) => {
              const div = document.createElement('div');
              div.className = 'link-card';
              div.innerHTML = \`
                <div class="link-info">
                  <div class="link-code-row">
                    <span class="link-code">\${code}</span>
                    <i data-lucide="arrow-right"></i>
                  </div>
                  <a href="\${url}" target="_blank" class="link-url">
                    \${url}
                  </a>
                </div>
                <div class="link-actions">
                  <button onclick="copyLink('\${code}')" class="action-btn" title="Copy shortened URL">
                    <i data-lucide="copy"></i>
                  </button>
                  <button onclick="deleteLink('\${code}')" class="action-btn delete" title="Delete link">
                    <i data-lucide="trash-2"></i>
                  </button>
                </div>
              \`;
              container.appendChild(div);
            });
            
            lucide.createIcons();
          } catch (err) {
            if (err.message !== 'Unauthorized') {
              container.innerHTML = \`<p class="error">\${err.message}</p>\`;
            }
          }
        }

        window.deleteLink = async function(code) {
          if (!confirm(\`Are you sure you want to delete "\${code}"?\`)) return;

          try {
            const response = await fetch('/api/links', {
              method: 'DELETE',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': getAuthHeader()
              },
              body: JSON.stringify({ code })
            });

            await handleResponse(response);
            fetchLinks();
            showToast('Link deleted', 'error');
          } catch (err) {
            showToast(err.message, 'error');
          }
        }

        window.copyLink = function(code) {
          const fullUrl = \`\${window.location.origin}/\${code}\`;
          navigator.clipboard.writeText(fullUrl);
          showToast('Link copied to clipboard!');
        }

        function showToast(message, type = '') {
          const oldToast = document.querySelector('.toast');
          if (oldToast) oldToast.remove();

          const toast = document.createElement('div');
          toast.className = 'toast' + (type ? ' ' + type : '');
          toast.textContent = message;
          document.body.appendChild(toast);
          setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.5s';
            setTimeout(() => toast.remove(), 500);
          }, 2000);
        }
      `,
        }}
      />
    </div>,
  );
});

app.get("/:code", async (c) => {
  const code = c.req.param("code").toLowerCase();

  const reservedKeys = c.env.RESERVED_KEYS?.split(",") || [];
  if (reservedKeys.includes(code)) {
    return c.notFound();
  }

  const url = await c.env.urls.get(code);
  if (url) {
    return c.redirect(url, 302);
  }

  return c.notFound();
});

export default app;
