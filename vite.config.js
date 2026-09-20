import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function reportImageProxy() {
  const handler = async (req, res, next) => {
    if (!req.url?.startsWith("/api/image-proxy")) {
      next();
      return;
    }

    try {
      const requestUrl = new URL(req.url, "http://localhost");
      const target = requestUrl.searchParams.get("url");

      if (!target) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Missing image URL" }));
        return;
      }

      const targetUrl = new URL(target);

      if (targetUrl.hostname !== "cdn.dmart.in") {
        res.statusCode = 403;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Host not allowed" }));
        return;
      }

      const response = await fetch(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 GHARLIST Image Proxy"
        }
      });

      if (!response.ok) {
        res.statusCode = response.status;
        res.end();
        return;
      }

      const contentType =
        response.headers.get("content-type") || "image/jpeg";

      const buffer = Buffer.from(await response.arrayBuffer());

      res.statusCode = 200;
      res.setHeader("Content-Type", contentType);
      res.setHeader(
        "Cache-Control",
        "public, max-age=86400, stale-while-revalidate=604800"
      );
      res.end(buffer);
    } catch (error) {
      console.error("[GHARLIST image proxy]", error);
      res.statusCode = 502;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Image proxy failed" }));
    }
  };

  return {
    name: "gharlist-image-proxy",

    configureServer(server) {
      server.middlewares.use(handler);
    },

    configurePreviewServer(server) {
      server.middlewares.use(handler);
    }
  };
}

export default defineConfig({
  plugins: [
    react(),
    reportImageProxy()
  ],

  server: {
    host: "localhost",
    port: 5173,
    strictPort: true,
    hmr: {
      host: "localhost",
      protocol: "ws",
      port: 5173
    }
  },

  preview: {
    host: "localhost",
    port: 4173,
    strictPort: true
  }
});
