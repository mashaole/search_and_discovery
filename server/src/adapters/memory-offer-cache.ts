import type { Offer } from "@search/shared";
import { OFFER_CACHE_MS } from "@search/shared";
import type { OfferCache } from "../ports/index.js";

type Entry = {
  offer: Offer;
  expiresAt: number;
};

export class MemoryOfferCache implements OfferCache {
  private readonly entries = new Map<string, Entry>();
  private readonly ttlMs: number;

  constructor(ttlMs = OFFER_CACHE_MS) {
    this.ttlMs = ttlMs;
  }

  get(productId: string): Offer | undefined {
    const entry = this.entries.get(productId);
    if (!entry) {
      return undefined;
    }
    if (Date.now() >= entry.expiresAt) {
      this.entries.delete(productId);
      return undefined;
    }
    return entry.offer;
  }

  set(productId: string, offer: Offer): void {
    this.entries.set(productId, {
      offer,
      expiresAt: Date.now() + this.ttlMs,
    });
  }
}
