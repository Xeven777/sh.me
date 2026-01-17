import { jsxRenderer } from "hono/jsx-renderer";

export const renderer = jsxRenderer(({ children }) => {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Sh.Me | Tiny URL Shortener</title>
        <link rel="stylesheet" href="/static/style.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossorigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Outfit:wght@600;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 18 17'><text x='0' y='14'>😽</text></svg>"
        />
        <script src="https://unpkg.com/lucide@latest"></script>
        <style
          dangerouslySetInnerHTML={{
            __html: `
          .link-card { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
});
