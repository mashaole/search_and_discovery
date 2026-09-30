import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  sanitizeQueryInput,
  type Category,
  type Offer,
  type Product,
} from "@search/shared";
import { SearchService } from "./search-service.js";
import { SuggestService } from "./suggest-service.js";
import { parseSearchQuery } from "./query-parser.js";
import { AppError } from "../errors/app-error.js";
import type {
  Logger,
  OfferCache,
  OfferProvider,
  ProductStore,
} from "../ports/index.js";
import { MemoryOfferCache } from "../adapters/memory-offer-cache.js";

const categories: Category[] = [
  { id: "pantry", name: "pantry" },
  { id: "dairy", name: "dairy" },
];

const products: Product[] = [
  {
    id: "p25",
    name: "Burger",
    description: "Beef patty",
    categoryId: "pantry",
    popularity: 92,
  },
  {
    id: "p09",
    name: "Whole Milk",
    description: "Milk",
    categoryId: "dairy",
    popularity: 96,
  },
  {
    id: "p10",
    name: "Cheddar Cheese",
    description: "Cheese",
    categoryId: "dairy",
    popularity: 83,
  },
  {
    id: "p16",
    name: "Oat Milk",
    description: "Oat",
    categoryId: "dairy",
    popularity: 73,
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
  calls = 0;
  failFor = new Set<string>();
  delayMs = 0;
  async getOffer(productId: string): Promise<Offer> {
    this.calls += 1;
    if (this.delayMs > 0) {
      await new Promise((resolve) => {
        setTimeout(resolve, this.delayMs);
      });
    }
    if (this.failFor.has(productId)) {
      throw new Error("provider failed");
    }
    return {
      available: true,
      priceCents: productId === "p09" ? 500 : 200,
      currency: "ZAR",
      deliveryEstimate: "20 min",
    };
  }
}

const silent: Logger = {
  info() {},
  error() {},
};

function service(
  provider: OfferProvider,
  cache: OfferCache = new MemoryOfferCache(),
): SearchService {
  return new SearchService({
    store: new FakeStore(),
    provider,
    cache,
    logger: silent,
  });
}

describe("query parser", () => {
  const known = new Set(["dairy", "pantry"]);

  it("rejects a short query", () => {
    assert.throws(
      () => parseSearchQuery({ q: "a" }, known),
      (err: unknown) =>
        err instanceof AppError && err.code === "QUERY_TOO_SHORT",
    );
  });

  it("rejects a query over 80 characters", () => {
    const q = "ab".repeat(41);
    assert.throws(
      () => parseSearchQuery({ q }, known),
      (err: unknown) =>
        err instanceof AppError && err.code === "QUERY_TOO_LONG",
    );
  });

  it("rejects a quote or semicolon", () => {
    assert.throws(
      () => parseSearchQuery({ q: "or 1=1" }, known),
      (err: unknown) =>
        err instanceof AppError && err.code === "INVALID_QUERY",
    );
    assert.throws(
      () => parseSearchQuery({ q: "milk;" }, known),
      (err: unknown) =>
        err instanceof AppError && err.code === "INVALID_QUERY",
    );
    assert.throws(
      () => parseSearchQuery({ q: 'say "hi"' }, known),
      (err: unknown) =>
        err instanceof AppError && err.code === "INVALID_QUERY",
    );
  });

  it("rejects an unknown field", () => {
    assert.throws(
      () => parseSearchQuery({ q: "milk", extra: "1" }, known),
      (err: unknown) =>
        err instanceof AppError && err.code === "UNKNOWN_FIELD",
    );
  });

  it("allows an empty query to browse the catalog", () => {
    const parsed = parseSearchQuery({}, known);
    assert.equal(parsed.q, "");
  });
});

describe("sanitizeQueryInput", () => {
  it("strips special characters and extra spaces", () => {
    assert.equal(sanitizeQueryInput("milk;"), "milk");
    assert.equal(sanitizeQueryInput('say "hi"'), "say hi");
    assert.equal(sanitizeQueryInput(" or 1=1"), "or 11");
    assert.equal(sanitizeQueryInput("whole  milk"), "whole milk");
  });
});

describe("search", () => {
  it("lists every category when the query is empty", async () => {
    const provider = new FakeProvider();
    const result = await service(provider).search({
      q: "",
      sort: "popularity",
      limit: 10,
      offset: 0,
      fields: ["id", "categoryId"],
    });
    assert.equal(result.total, products.length);
    const categoriesSeen = new Set(
      result.page.items.map((item) => item.categoryId),
    );
    assert.ok(categoriesSeen.has("dairy"));
    assert.ok(categoriesSeen.has("pantry"));
  });

  it("matches case-insensitively", async () => {
    const provider = new FakeProvider();
    const result = await service(provider).search({
      q: "MILK",
      sort: "popularity",
      limit: 10,
      offset: 0,
      fields: ["id", "name"],
    });
    const names = result.page.items.map((item) => item.name);
    assert.ok(names.includes("Whole Milk"));
    assert.ok(names.includes("Oat Milk"));
  });

  it("filters by category", async () => {
    const provider = new FakeProvider();
    const result = await service(provider).search({
      q: "milk",
      categoryId: "dairy",
      sort: "popularity",
      limit: 10,
      offset: 0,
      fields: ["id", "name", "categoryId"],
    });
    assert.equal(result.total, 2);
    for (const item of result.page.items) {
      assert.equal(item.categoryId, "dairy");
    }
  });

  it("pages with a default-sized limit", async () => {
    const provider = new FakeProvider();
    const first = await service(provider).search({
      q: "milk",
      sort: "popularity",
      limit: 1,
      offset: 0,
      fields: ["id"],
    });
    const second = await service(provider).search({
      q: "milk",
      sort: "popularity",
      limit: 1,
      offset: 1,
      fields: ["id"],
    });
    assert.equal(first.total, 2);
    assert.equal(first.page.items.length, 1);
    assert.equal(second.page.items.length, 1);
    assert.notEqual(first.page.items[0]?.id, second.page.items[0]?.id);
  });

  it("skips pricing when the mask has no offer fields", async () => {
    const provider = new FakeProvider();
    await service(provider).search({
      q: "milk",
      sort: "popularity",
      limit: 10,
      offset: 0,
      fields: ["id", "name"],
    });
    assert.equal(provider.calls, 0);
  });

  it("keeps a product when the offer fails", async () => {
    const provider = new FakeProvider();
    provider.failFor.add("p09");
    const result = await service(provider).search({
      q: "milk",
      sort: "popularity",
      limit: 10,
      offset: 0,
      fields: ["id", "name", "priceCents", "enrichment"],
    });
    const milk = result.page.items.find((item) => item.id === "p09");
    assert.ok(milk);
    assert.equal(milk?.enrichment, "failed");
    assert.equal(milk?.priceCents, null);
  });

  it("sorts a page by price when asked", async () => {
    const provider = new FakeProvider();
    const result = await service(provider).search({
      q: "milk",
      sort: "price",
      limit: 10,
      offset: 0,
      fields: ["id", "priceCents", "enrichment"],
    });
    const prices = result.page.items.map((item) => item.priceCents);
    assert.deepEqual(prices, [...prices].sort((a, b) => {
      if (a == null) {
        return 1;
      }
      if (b == null) {
        return -1;
      }
      return a - b;
    }));
  });

  it("reuses a cached offer", async () => {
    const provider = new FakeProvider();
    const cache = new MemoryOfferCache(60_000);
    const svc = service(provider, cache);
    const query = {
      q: "burger",
      sort: "popularity" as const,
      limit: 10,
      offset: 0,
      fields: ["id", "priceCents", "enrichment"],
    };
    await svc.search(query);
    const callsAfterFirst = provider.calls;
    await svc.search(query);
    assert.equal(provider.calls, callsAfterFirst);
  });
});

describe("suggest", () => {
  it("offers Burger for buger and burgr", () => {
    const suggest = new SuggestService(new FakeStore());
    const a = suggest.suggest("buger");
    const b = suggest.suggest("burgr");
    assert.ok(a.some((row) => row.name === "Burger"));
    assert.ok(b.some((row) => row.name === "Burger"));
  });
});
