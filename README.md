# 🚀 sh.me — Tiny URL Shortener

A high-performance, premium URL shortener built on the edge with **Cloudflare Workers**, **Hono**, and **Cloudflare KV**.

## ✨ Features

- **⚡ Edge Redirection**: Ultra-fast 302 redirects served from the nearest Cloudflare PoP.
- **🎨 Premium Admin UI**: A sleek, dark-mode dashboard built with Tailwind CSS, Lucide Icons, and Vanilla JS.
- **🔒 Secure Admin**: Protected API routes with `API_KEY` authentication.
- **🎲 Smart Generation**: If you don't provide a shortcode, sh.me will automatically generate a unique 4-character code for you.
- **🛡️ Robust Validation**: Handles large URLs (up to 1500 chars), prevents duplicates, and blocks reserved keywords.
- **🌓 Case Insensitive**: Codes match regardless of casing (e.g., `/MyLink` == `/mylink`).
- **📱 Mobile Responsive**: Works perfectly on any device.

## 🛠️ Tech Stack

- **Core**: [Hono](https://hono.dev/) (Lightweight Web Framework)
- **Runtime**: [Cloudflare Workers](https://workers.cloudflare.com/)
- **Database**: [Cloudflare KV](https://developers.cloudflare.com/kv/)
- **Frontend**: HTML5, Vanilla JavaScript, [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide](https://lucide.dev/)
- **Package Manager**: Bun

## 🚀 Getting Started

### 1. Prerequisites

- [Bun](https://bun.sh/) installed.
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) CLI installed.

### 2. Installation

```bash
git clone https://github.com/xeven777/sh.me.git
cd sh.me
bun install
```

### 3. Local Development

Create a `.dev.vars` file in the root directory:

```text
API_KEY=your_secret_admin_token
```

Start the wrangler dev server:

```bash
bun run dev
```

Open [http://localhost:8787](http://localhost:8787). The UI will prompt you for your `API_KEY` the first time you perform an action.

### 4. Configuration (Cloudflare)

1. Create a KV namespace:
   ```bash
   bun wrangler kv namespace create urls
   ```
2. Update `wrangler.jsonc` with the generated `id`.
3. Set your production API Key:
   ```bash
   bun wrangler secret put API_KEY
   ```

### 5. Deployment

Deploy to Cloudflare's global network:

```bash
bun run deploy
```

## 🔌 API Endpoints

All requests (except redirection) require the `Authorization` header.

| Method   | Endpoint     | Description                                                      |
| :------- | :----------- | :--------------------------------------------------------------- |
| `GET`    | `/api/links` | List all available short links                                   |
| `POST`   | `/api/links` | Create/Gen link (`{ "code": "optional", "url": "https://..." }`) |
| `DELETE` | `/api/links` | Delete an existing link (`{ "code": "..." }`)                    |
| `GET`    | `/:code`     | Redirect to the target URL                                       |

---

MADE WITH ❤️ BY ANISH
