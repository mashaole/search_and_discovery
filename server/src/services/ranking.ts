import type { Enrichment, Offer, Product } from "@search/shared";

export type FitLevel = 0 | 1 | 2 | 3;

export function fitLevel(
  productName: string,
  categoryName: string,
  query: string,
): FitLevel | null {
  if (query.length === 0) {
    return 0;
  }
  const name = productName.toLowerCase();
  const category = categoryName.toLowerCase();
  const q = query.toLowerCase();
  if (name === q) {
    return 0;
  }
  if (name.startsWith(q)) {
    return 1;
  }
  if (name.includes(q)) {
    return 2;
  }
  if (category.includes(q)) {
    return 3;
  }
  return null;
}

export function compareByFitThenSort(
  left: RankedProduct,
  right: RankedProduct,
  sort: "popularity" | "price",
): number {
  if (left.fit !== right.fit) {
    return left.fit - right.fit;
  }
  if (sort === "popularity") {
    if (right.product.popularity !== left.product.popularity) {
      return right.product.popularity - left.product.popularity;
    }
  } else {
    const leftPrice = left.priceCents;
    const rightPrice = right.priceCents;
    const leftMissing = leftPrice === null;
    const rightMissing = rightPrice === null;
    if (leftMissing !== rightMissing) {
      return leftMissing ? 1 : -1;
    }
    if (leftPrice !== null && rightPrice !== null) {
      if (leftPrice !== rightPrice) {
        return leftPrice - rightPrice;
      }
    }
  }
  return left.product.id.localeCompare(right.product.id);
}

export type RankedProduct = {
  product: Product;
  categoryName: string;
  fit: FitLevel;
  priceCents: number | null;
  offer?: Offer;
  enrichment?: Enrichment;
};
