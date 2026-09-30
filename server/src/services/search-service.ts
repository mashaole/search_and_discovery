import {
  OFFER_FIELDS,
  SEARCH_TIMEOUT_MS,
  type Offer,
  type SearchPage,
  type SearchQuery,
  type SearchResult,
} from "@search/shared";
import { searchTimeout } from "../errors/app-error.js";
import type {
  Logger,
  OfferCache,
  OfferProvider,
  ProductStore,
} from "../ports/index.js";
import {
  compareByFitThenSort,
  fitLevel,
  type RankedProduct,
} from "./ranking.js";

type SearchDeps = {
  store: ProductStore;
  provider: OfferProvider;
  cache: OfferCache;
  logger: Logger;
};

export class SearchService {
  private readonly store: ProductStore;
  private readonly provider: OfferProvider;
  private readonly cache: OfferCache;
  private readonly logger: Logger;

  constructor(deps: SearchDeps) {
    this.store = deps.store;
    this.provider = deps.provider;
    this.cache = deps.cache;
    this.logger = deps.logger;
  }

  async search(query: SearchQuery): Promise<{
    page: SearchPage;
    total: number;
    fields: string[];
  }> {
    const started = Date.now();
    try {
      const result = await withTimeout(
        this.runSearch(query),
        SEARCH_TIMEOUT_MS,
      );
      this.logger.info(
        `search durationMs=${Date.now() - started} ` +
          `total=${result.total} page=${result.page.items.length} ` +
          `offersFailed=${result.failedCount}`,
      );
      return {
        page: result.page,
        total: result.total,
        fields: query.fields,
      };
    } catch (err) {
      if (err instanceof Error && err.message === "timeout") {
        throw searchTimeout();
      }
      throw err;
    }
  }

  private async runSearch(query: SearchQuery): Promise<{
    page: SearchPage;
    total: number;
    failedCount: number;
  }> {
    const needsOffer = query.fields.some((field) =>
      (OFFER_FIELDS as readonly string[]).includes(field),
    );
    const ranked = this.matchAndRank(query);
    const total = ranked.length;
    let slice: RankedProduct[];
    let failedCount = 0;

    if (query.sort === "price" && needsOffer) {
      const enriched = await this.enrichAll(
        ranked,
        query.failFirstOffer === true,
      );
      failedCount = enriched.failedCount;
      enriched.rows.sort((left, right) =>
        compareByFitThenSort(left, right, "price"),
      );
      slice = enriched.rows.slice(
        query.offset,
        query.offset + query.limit,
      );
      return {
        page: {
          items: slice.map((row) => toResult(row, query.fields)),
        },
        total,
        failedCount,
      };
    }

    slice = ranked.slice(query.offset, query.offset + query.limit);
    if (needsOffer) {
      const enriched = await this.enrichAll(
        slice,
        query.failFirstOffer === true,
      );
      failedCount = enriched.failedCount;
      slice = enriched.rows;
    }
    return {
      page: {
        items: slice.map((row) => toResult(row, query.fields)),
      },
      total,
      failedCount,
    };
  }

  private matchAndRank(query: SearchQuery): RankedProduct[] {
    const products = this.store.listProducts();
    const matched: RankedProduct[] = [];
    for (const product of products) {
      if (query.categoryId && product.categoryId !== query.categoryId) {
        continue;
      }
      const category = this.store.getCategory(product.categoryId);
      const categoryName = category?.name ?? "";
      const fit = fitLevel(product.name, categoryName, query.q);
      if (fit === null) {
        continue;
      }
      matched.push({
        product,
        categoryName,
        fit,
        priceCents: null,
      });
    }
    matched.sort((left, right) =>
      compareByFitThenSort(left, right, "popularity"),
    );
    return matched;
  }

  private async enrichAll(
    rows: RankedProduct[],
    failFirstOffer: boolean,
  ): Promise<{
    rows: RankedProduct[];
    failedCount: number;
  }> {
    const settled = await Promise.allSettled(
      rows.map((row, index) => {
        if (failFirstOffer && index === 0) {
          return Promise.reject(new Error("demo price fail"));
        }
        return this.loadOffer(row.product.id);
      }),
    );
    let failedCount = 0;
    const next: RankedProduct[] = [];
    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      const result = settled[i];
      if (result.status === "fulfilled") {
        next.push({
          ...row,
          priceCents: result.value.offer.priceCents,
          offer: result.value.offer,
          enrichment: "ok",
        });
      } else {
        failedCount += 1;
        next.push({
          ...row,
          priceCents: null,
          offer: undefined,
          enrichment: "failed",
        });
      }
    }
    return { rows: next, failedCount };
  }

  private async loadOffer(
    productId: string,
  ): Promise<{ offer: Offer }> {
    const cached = this.cache.get(productId);
    if (cached) {
      return { offer: cached };
    }
    const offer = await this.provider.getOffer(productId);
    this.cache.set(productId, offer);
    return { offer };
  }
}

function toResult(
  row: RankedProduct,
  fields: string[],
): SearchResult {
  const selected = new Set(fields);
  const result: SearchResult = { id: row.product.id };
  if (selected.has("name")) {
    result.name = row.product.name;
  }
  if (selected.has("categoryId")) {
    result.categoryId = row.product.categoryId;
  }
  if (selected.has("categoryName")) {
    result.categoryName = row.categoryName;
  }
  if (selected.has("description")) {
    result.description = row.product.description;
  }
  const enrichment = row.enrichment;
  if (selected.has("enrichment") && enrichment) {
    result.enrichment = enrichment;
  }
  if (enrichment === "ok" && row.offer) {
    if (selected.has("available")) {
      result.available = row.offer.available;
    }
    if (selected.has("priceCents")) {
      result.priceCents = row.offer.priceCents;
    }
    if (selected.has("currency")) {
      result.currency = row.offer.currency;
    }
    if (selected.has("deliveryEstimate")) {
      result.deliveryEstimate = row.offer.deliveryEstimate;
    }
  } else if (enrichment === "failed") {
    if (selected.has("available")) {
      result.available = null;
    }
    if (selected.has("priceCents")) {
      result.priceCents = null;
    }
    if (selected.has("currency")) {
      result.currency = null;
    }
    if (selected.has("deliveryEstimate")) {
      result.deliveryEstimate = null;
    }
  }
  return result;
}

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("timeout"));
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err: unknown) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}
