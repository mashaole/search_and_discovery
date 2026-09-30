import type { Category, Offer, Product } from "@search/shared";

export interface ProductStore {
  listProducts(): Product[];
  listCategories(): Category[];
  getCategory(id: string): Category | undefined;
}

export interface OfferProvider {
  getOffer(productId: string): Promise<Offer>;
}

export interface OfferCache {
  get(productId: string): Offer | undefined;
  set(productId: string, offer: Offer): void;
}

export interface Logger {
  info(message: string, fields?: Record<string, unknown>): void;
  error(message: string, fields?: Record<string, unknown>): void;
}
