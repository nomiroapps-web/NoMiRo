/**
 * NoMiRo - Production Node.js Server
 * Serves the built React SPA with proper SPA routing fallback.
 */

import express from "express";
import compression from "compression";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, "dist");

// Verify dist folder exists
if (!fs.existsSync(DIST_DIR)) {
  console.error("❌ 'dist/' folder not found. Run 'npm run build' first.");
  process.exit(1);
}

// ── Middleware ────────────────────────────────────────────────────────────────

// Gzip / brotli compression for all responses
app.use(compression());

// Security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// ── Static Assets ─────────────────────────────────────────────────────────────

// Cache hashed assets (JS/CSS bundles) for 1 year
app.use(
  "/assets",
  express.static(path.join(DIST_DIR, "assets"), {
    maxAge: "1y",
    immutable: true,
  })
);

// Cache service worker & manifest with short TTL (must be re-validated)
app.use(
  express.static(DIST_DIR, {
    maxAge: "1h",
    setHeaders(res, filePath) {
      const noCache = ["sw.js", "manifest.webmanifest", "index.html"];
      if (noCache.some((f) => filePath.endsWith(f))) {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      }
    },
  })
);

// ── Health Check ──────────────────────────────────────────────────────────────

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── SPA Fallback ──────────────────────────────────────────────────────────────
// All unmatched routes return index.html so react-router handles them
app.get("*", (req, res) => {
  res.sendFile(path.join(DIST_DIR, "index.html"));
});

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`✅ NoMiRo running on http://localhost:${PORT}`);
  console.log(`   Mode:  ${process.env.NODE_ENV || "production"}`);
  console.log(`   Dist:  ${DIST_DIR}`);
});
