import type { Suggestion } from "@search/shared";
import type { ProductStore } from "../ports/index.js";
import { levenshtein } from "./levenshtein.js";

const MAX_SUGGESTIONS = 8;
const MAX_LAYER = 2;

export class SuggestService {
  private readonly store: ProductStore;

  constructor(store: ProductStore) {
    this.store = store;
  }

  suggest(q: string): Suggestion[] {
    const query = q.toLowerCase();
    const products = this.store.listProducts();
    const scored: Suggestion[] = [];
    for (const product of products) {
      const name = product.name.toLowerCase();
      const contained = name.includes(query);
      const distance = contained ? 0 : levenshtein(query, name);
      scored.push({
        id: product.id,
        name: product.name,
        distance,
      });
    }
    const picked: Suggestion[] = [];
    const seen = new Set<string>();
    for (let layer = 0; layer <= MAX_LAYER; layer += 1) {
      for (const item of scored) {
        if (picked.length >= MAX_SUGGESTIONS) {
          break;
        }
        if (item.distance !== layer || seen.has(item.id)) {
          continue;
        }
        picked.push(item);
        seen.add(item.id);
      }
      if (picked.length >= MAX_SUGGESTIONS) {
        return picked;
      }
    }
    if (picked.length > 0) {
      return picked;
    }
    let nearest = scored[0];
    for (const item of scored) {
      if (item.distance < nearest.distance) {
        nearest = item;
      }
    }
    return nearest ? [nearest] : [];
  }
}
