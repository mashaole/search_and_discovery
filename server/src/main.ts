import { JsonCatalogStore } from "./dao/json-catalog-store.js";
import { SimulatedOfferProvider } from "./adapters/simulated-offer-provider.js";
import { MemoryOfferCache } from "./adapters/memory-offer-cache.js";
import { ConsoleLogger } from "./adapters/console-logger.js";
import { SearchService } from "./services/search-service.js";
import { SuggestService } from "./services/suggest-service.js";
import { createApp } from "./app.js";

const PORT = Number.parseInt(process.env.PORT ?? "3000", 10);
const serveClient = process.env.NODE_ENV === "production";

const store = new JsonCatalogStore();
const provider = new SimulatedOfferProvider();
const cache = new MemoryOfferCache();
const logger = new ConsoleLogger();
const search = new SearchService({
  store,
  provider,
  cache,
  logger,
});
const suggest = new SuggestService(store);
const app = createApp({
  store,
  search,
  suggest,
  logger,
  serveClient,
});

const server = app.listen(PORT, () => {
  logger.info(`listening on ${PORT}`);
});

function shutdown(): void {
  server.close(() => {
    process.exit(0);
  });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
