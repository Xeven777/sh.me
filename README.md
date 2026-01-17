# 🚀 sh.me — Tiny URL Shortener

A high-performance, premium URL shortener built on the edge with **Cloudflare Workers**, **Hono**, and **Cloudflare KV**.

## ✨ Features

- **Edge Redirection**: Ultra-fast 302 redirects served from the nearest Cloudflare PoP.
- **Premium Admin UI**: A sleek, dark-mode dashboard built with Tailwind CSS, Lucide Icons, and Vanilla JS.
- **KV Storage**: Simple and persistent key-value storage for link mappings.
- **Full Management**: Add, view, and delete short links with instant UI updates.
- **Static Assets**: Frontend assets served directly via the Worker's Asset binding.
- **Mobile Responsive**: Works perfectly on any device.

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
- A Cloudflare account.

### 2. Installation

```bash
git clone https://github.com/anish7/sh.me.git
cd sh.me
bun install
```

### 3. Local Development

Start the wrangler dev server:

```bash
bun run dev
```

Open [http://localhost:8787](http://localhost:8787) in your browser.

### 4. Configuration

Before deploying, you need to create a KV namespace:

```bash
bun wrangler kv namespace create LINKS
```

Update your `wrangler.jsonc` with the generated `id`:

```json
"kv_namespaces": [
  {
    "binding": "LINKS",
    "id": "YOUR_KV_NAMESPACE_ID"
  }
]
```

### 5. Deployment

Deploy to Cloudflare's global network:

```bash
bun run deploy
```

## 🔌 API Endpoints

| Method   | Endpoint     | Description                                                 |
| :------- | :----------- | :---------------------------------------------------------- |
| `GET`    | `/api/links` | List all available short links                              |
| `POST`   | `/api/links` | Create a new short link (`{ "code": "...", "url": "..." }`) |
| `DELETE` | `/api/links` | Delete an existing link (`{ "code": "..." }`)               |
| `GET`    | `/:code`     | Redirect to the target URL                                  |
