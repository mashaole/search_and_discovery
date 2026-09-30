import path from "node:path";
import { fileURLToPath } from "node:url";
import express, { type Express } from "express";
import helmet from "helmet";
import type { Logger, ProductStore } from "./ports/index.js";
import type { SearchService } from "./services/search-service.js";
import type { SuggestService } from "./services/suggest-service.js";
import { searchHandler } from "./routes/search-route.js";
import { suggestHandler } from "./routes/suggest-route.js";
import { categoriesHandler } from "./routes/categories-route.js";
import { errorHandler, notFoundHandler } from "./routes/error-handler.js";
import { ok } from "./routes/envelope.js";

export type AppDeps = {
  store: ProductStore;
  search: SearchService;
  suggest: SuggestService;
  logger: Logger;
  serveClient: boolean;
};

export function createApp(deps: AppDeps): Express {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => {
    res.json(ok({ status: "ok" }));
  });
  app.get("/api/search", (req, res, next) => {
    searchHandler(deps.search, deps.store)(req, res).catch(next);
  });
  app.get("/api/suggest", (req, res, next) => {
    try {
      suggestHandler(deps.suggest)(req, res);
    } catch (err) {
      next(err);
    }
  });
  app.get("/api/categories", (req, res, next) => {
    try {
      categoriesHandler(deps.store)(req, res);
    } catch (err) {
      next(err);
    }
  });

  app.use("/api", notFoundHandler);

  if (deps.serveClient) {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const clientDist = path.join(here, "../../client/dist");
    app.use(express.static(clientDist));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(clientDist, "index.html"));
    });
  } else {
    app.use(notFoundHandler);
  }

  app.use(errorHandler(deps.logger));
  return app;
}
