import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import type { Category, Offer, Product } from "@search/shared";
import { createApp } from "./app.js";
import { SearchService } from "./services/search-service.js";
import { SuggestService } from "./services/suggest-service.js";
import { MemoryOfferCache } from "./adapters/memory-offer-cache.js";
import type {
  Logger,
  OfferProvider,
  ProductStore,
} from "./ports/index.js";

const categories: Category[] = [
  { id: "dairy", name: "dairy" },
  { id: "pantry", name: "pantry" },
];

const products: Product[] = [
  {
    id: "p09",
    name: "Whole Milk",
    description: "Milk",
    categoryId: "dairy",
    popularity: 96,
  },
  {
    id: "p25",
    name: "Burger",
    description: "Patty",
    categoryId: "pantry",
    popularity: 92,
  },
];

class FakeStore implements ProductStore {
  listProducts(): Product[] {
    return products;
  }
  listCategories(): Category[] {
    return categories;
  }
  getCategory(id: string): Category | undefined {
    return categories.find((row) => row.id === id);
  }
}

class FakeProvider implements OfferProvider {
  async getOffer(): Promise<Offer> {
    return {
      available: true,
      priceCents: 199,
      currency: "ZAR",
      deliveryEstimate: "15 min",
    };
  }
}

const silent: Logger = { info() {}, error() {} };

describe("http envelope", () => {
  let server: Server;
  let base: string;

  before(async () => {
    const store = new FakeStore();
    const search = new SearchService({
      store,
      provider: new FakeProvider(),
      cache: new MemoryOfferCache(),
      logger: silent,
    });
    const app = createApp({
      store,
      search,
      suggest: new SuggestService(store),
      logger: silent,
      serveClient: false,
    });
    server = app.listen(0);
    await new Promise<void>((resolve) => {
      server.once("listening", () => resolve());
    });
    const address = server.address() as AddressInfo;
    base = `http://127.0.0.1:${address.port}`;
  });

  after(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  });

  it("returns health in the envelope", async () => {
    const res = await fetch(`${base}/health`);
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.data.status, "ok");
    assert.equal(body.error, null);
  });

  it("returns search in the envelope", async () => {
    const res = await fetch(`${base}/api/search?q=milk`);
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(body.data.items));
    assert.equal(body.error, null);
    assert.ok(body.meta.total >= 1);
  });

  it("returns the catalog when search has no query", async () => {
    const res = await fetch(`${base}/api/search`);
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.ok(body.meta.total >= 1);
    assert.equal(body.error, null);
  });

  it("rejects an unknown field with a detailed message", async () => {
    const res = await fetch(`${base}/api/search?q=milk&hack=1`);
    const body = await res.json();
    assert.equal(res.status, 400);
    assert.equal(body.data, null);
    assert.equal(body.error.code, "UNKNOWN_FIELD");
    assert.match(body.error.message, /hack/);
  });
});
