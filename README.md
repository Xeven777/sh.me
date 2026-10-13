# 🚀 sh.me — Tiny URL Shortener

A high-performance, premium URL shortener built on the edge with **Cloudflare Pages**, **Hono JSX**, and **Cloudflare KV**.

## ✨ Features

- **⚡ Edge Redirection**: Ultra-fast 302 redirects served from the nearest Cloudflare PoP.
- **🎨 Premium Admin UI**: A sleek, dark-mode dashboard built with Hono JSX, Tailwind CSS, and Lucide Icons.
- **🔒 Secure Admin**: Protected API routes with `API_KEY` authentication.
- **🎲 Smart Generation**: If you don't provide a shortcode, sh.me will automatically generate a unique 4-character code for you.
- **🛡️ Robust Validation**: Handles large URLs (up to 1500 chars), prevents duplicates, and blocks reserved keywords.
- **🌓 Case Insensitive**: Codes match regardless of casing (e.g., `/MyLink` == `/mylink`).
- **📱 Mobile Responsive**: Works perfectly on any device.

## 🛠️ Tech Stack

- **Framework**: [Hono](https://hono.dev/) (Lightweight Web Framework)
- **Deployment**: [Cloudflare Pages](https://pages.cloudflare.com/)
- **Database**: [Cloudflare KV](https://developers.cloudflare.com/kv/)
- **Frontend**: Hono JSX, Tailwind CSS (CDN)
- **Icons**: [Lucide](https://lucide.dev/)
- **Package Manager**: Bun

## 🚀 Getting Started

### 1. Prerequisites

- [Bun](https://bun.sh/) installed.
- Cloudflare Account.

### 2. Installation

```bash
git clone https://github.com/anish7/sh.me.git
cd sh.me
bun install
```

### 3. Local Development

Start the development server:

```bash
bun run dev
```

Open [http://localhost:5173](http://localhost:5173).

### 4. Configuration (Cloudflare)

1. Create a KV namespace named `urls` in your Cloudflare Dashboard.
2. Update `wrangler.toml` with your KV namespace `id`.
3. Set your environment variables (`API_KEY`, `RESERVED_KEYS`) in the Cloudflare Pages settings.

### 5. Deployment

Deploy to Cloudflare Pages:

```bash
bun run deploy
```

## 🔌 API Endpoints

All requests (except redirection) require the `Authorization` header if `API_KEY` is set.

| Method   | Endpoint     | Description                                                      |
| :------- | :----------- | :--------------------------------------------------------------- |
| `GET`    | `/api/links` | List all available short links                                   |
| `POST`   | `/api/links` | Create/Gen link (`{ "code": "optional", "url": "https://..." }`) |
| `DELETE` | `/api/links` | Delete an existing link (`{ "code": "..." }`)                    |
| `GET`    | `/:code`     | Redirect to the target URL                                       |

---

MADE WITH ❤️ BY ANISH BISWAS (XEVEN777)
