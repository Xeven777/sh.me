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
  if (c.env.API_KEY && auth !== c.env.API_KEY) {
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
    <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
      <header className="mb-16">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
            <i data-lucide="link" className="w-6 h-6 text-white"></i>
          </div>
          <h1 className="text-3xl md:text-4xl font-['Outfit'] font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            Sh.Me
          </h1>
        </div>
        <p className="text-zinc-400 text-lg">
          Manage your short links with ease and speed.
        </p>
      </header>

      <section className="mb-16">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <form
            id="shorten-form"
            className="grid grid-cols-1 md:grid-cols-[1fr,2fr,auto] gap-4 relative z-10"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-500 ml-1">
                Short Code (optional)
              </label>
              <input
                type="text"
                id="code"
                placeholder="gh"
                maxLength={30}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-zinc-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-500 ml-1">
                Destination URL
              </label>
              <input
                type="url"
                id="url"
                placeholder="https://github.com/xeven777"
                required
                maxLength={1500}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-zinc-700 text-white"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl px-8 py-3 transition-all flex items-center justify-center gap-2 group shadow-lg shadow-indigo-500/20 active:scale-95"
              >
                <span>Add Link</span>
                <i
                  data-lucide="plus"
                  className="w-5 h-5 group-hover:rotate-90 transition-transform"
                ></i>
              </button>
            </div>
          </form>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-['Outfit'] font-semibold text-white">
            Active Links
          </h2>
          <span
            id="link-count"
            className="text-[10px] font-bold bg-zinc-800 text-zinc-400 px-2.5 py-1 rounded-full uppercase tracking-widest border border-zinc-700"
          >
            0 Links
          </span>
        </div>

        <div id="links-container" className="space-y-3">
          <div className="flex items-center justify-center py-20 text-zinc-600">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
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
          submitBtn.classList.add('opacity-50', 'cursor-not-allowed');

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
            showToast('Link added successfully!', 'indigo');
          } catch (err) {
            showToast(err.message, 'red');
          } finally {
            submitBtn.disabled = false;
            submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
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
                <div class="text-center py-20 bg-zinc-900/50 border border-dashed border-zinc-800 rounded-2xl">
                  <i data-lucide="ghost" class="w-12 h-12 text-zinc-700 mx-auto mb-4"></i>
                  <p class="text-zinc-500">No links found. Create your first one above!</p>
                </div>
              \`;
              lucide.createIcons();
              return;
            }

            entries.sort().forEach(([code, url]) => {
              const div = document.createElement('div');
              div.className = 'link-card flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-xl group transition-all duration-300 hover:border-zinc-600 hover:bg-zinc-800/50';
              div.innerHTML = \`
                <div class="flex flex-col min-w-0 pr-4">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-lg font-semibold text-indigo-400 font-['Outfit']">\${code}</span>
                    <i data-lucide="arrow-right" class="w-4 h-4 text-zinc-600"></i>
                  </div>
                  <a href="\${url}" target="_blank" class="text-zinc-400 text-sm truncate hover:text-white transition-colors">
                    \${url}
                  </a>
                </div>
                <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onclick="copyLink('\${code}')" class="p-2 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-all shadow-sm" title="Copy shortened URL">
                    <i data-lucide="copy" class="w-5 h-5"></i>
                  </button>
                  <button onclick="deleteLink('\${code}')" class="p-2 hover:bg-red-500/20 rounded-lg text-zinc-500 hover:text-red-400 transition-all shadow-sm" title="Delete link">
                    <i data-lucide="trash-2" class="w-5 h-5"></i>
                  </button>
                </div>
              \`;
              container.appendChild(div);
            });
            
            lucide.createIcons();
          } catch (err) {
            if (err.message !== 'Unauthorized') {
              container.innerHTML = \`<p class="text-red-400 text-center py-10">\${err.message}</p>\`;
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
            showToast('Link deleted', 'red');
          } catch (err) {
            showToast(err.message, 'red');
          }
        }

        window.copyLink = function(code) {
          const fullUrl = \`\${window.location.origin}/\${code}\`;
          navigator.clipboard.writeText(fullUrl);
          showToast('Link copied to clipboard!', 'indigo');
        }

        function showToast(message, color = 'indigo') {
          const oldToast = document.querySelector('.toast');
          if (oldToast) oldToast.remove();

          const toast = document.createElement('div');
          toast.className = \`toast fixed bottom-8 left-1/2 -translate-x-1/2 bg-\${color}-600 text-white px-6 py-3 rounded-xl shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 font-medium pointer-events-none\`;
          toast.textContent = message;
          document.body.appendChild(toast);
          setTimeout(() => {
            toast.classList.add('opacity-0', 'transition-opacity');
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
