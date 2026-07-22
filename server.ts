import express from "express";
import path from "path";
import fs from "fs";
import http from "http";
import { createServer as createViteServer } from "vite";
import helmet from "helmet";

// Thin http proxy helper — forwards /api/* to the backend container
function proxyRequest(
  req: express.Request,
  res: express.Response,
  backendUrl: URL
) {
  const options: http.RequestOptions = {
    hostname: backendUrl.hostname,
    port: Number(backendUrl.port) || 80,
    path: req.originalUrl,
    method: req.method,
    headers: { ...req.headers, host: backendUrl.host },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    // Remove transfer-encoding so downstream can handle content-length properly
    const headers = { ...proxyRes.headers };
    delete headers['transfer-encoding'];
    res.writeHead(proxyRes.statusCode ?? 200, headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on("error", (err) => {
    console.error("[proxy] Backend error:", err.message);
    if (!res.headersSent) {
      res.status(502).json({ message: "Backend unavailable", error: err.message });
    }
  });

  req.pipe(proxyReq, { end: true });
}

async function startServer() {
  const server = express();

  // Security headers
  server.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));

  const PORT = 3000;
  // In production the sekolah-app and backend-api containers share the 'global_net' Podman network.
  // The backend container is named 'esantri-api', reachable at http://esantri-api:8080.
  const backendHost = process.env.VITE_BACKEND_HOST || "http://esantri-api:8080";
  const backendUrl = new URL(backendHost);

  // Proxy ALL /api requests to backend — works in both dev and production
  server.use("/api", (req, res) => {
    proxyRequest(req, res, backendUrl);
  });

  if (process.env.NODE_ENV !== "production") {
    // Development: Vite handles HMR and static assets
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== "true",
      },
      appType: "spa",
    });
    server.use(vite.middlewares);

    // SPA fallback — only for non-API routes
    server.use(async (req, res, next) => {
      if (req.originalUrl.startsWith("/api")) return next();
      try {
        let template = fs.readFileSync(
          path.resolve(process.cwd(), "index.html"),
          "utf-8"
        );
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ "Content-Type": "text/html" }).send(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    // Production: serve pre-built static files
    const distPath = path.join(process.cwd(), "dist");
    server.use(express.static(distPath));
    server.get("*all", (req, res, next) => {
      if (req.originalUrl.startsWith("/api")) return next();
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`🏫 Sekolah App running on http://0.0.0.0:${PORT}`);
    console.log(`📡 /api proxied to: ${backendHost}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
