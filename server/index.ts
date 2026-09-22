import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { CONFIG } from "./utils/config.ts";
import { AppError, normalizeError, errorResponse } from "./utils/errors.ts";

import profileRoutes from "./routes/profile.ts";
import professorRoutes from "./routes/professors.ts";
import emailRoutes from "./routes/email.ts";
import hackathonRoutes from "./routes/hackathons.ts";

const app = express();

app.use(express.json({ limit: "25mb" }));

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", version: "2.0.0" });
});

// API routes
app.use("/api/profile", profileRoutes);
app.use("/api/search", professorRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/hackathons", hackathonRoutes);

// Centralized error handling
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const appError = normalizeError(err);
  const status = appError instanceof AppError ? appError.statusCode : 500;
  res.status(status).json(errorResponse(appError.message, appError.code));
});

async function setupServer() {
  if (CONFIG.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(CONFIG.PORT, "0.0.0.0", () => {
    console.log(`ResearchMatch v2 server running on http://localhost:${CONFIG.PORT}`);
  });
}

setupServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
