import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import helmet from "helmet";

async function startServer() {
  const server = express();
  
  // Set security headers using helmet
  server.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));

  const PORT = 3000;

  // In development, Vite handles all frontend serving + proxy to backend API
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: "spa",
    });
    
    server.use(vite.middlewares);

    // SPA fallback — serve index.html for all non-API routes
    server.use(async (req, res, next) => {
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).send(template);
      } catch (e: any) {
        console.error("Vite fallback error:", e);
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    // Production — serve static dist files
    const distPath = path.join(process.cwd(), "dist");
    server.use(express.static(distPath));
    server.get("*all", (req, res, next) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`🏫 Sekolah App running on http://localhost:${PORT}`);
    console.log(`📡 API requests are proxied to backend-api via Vite proxy`);
  });
}

startServer();
