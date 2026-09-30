import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Category, Product } from "@search/shared";
import type { ProductStore } from "../ports/index.js";

type CatalogFile = {
  categories: Category[];
  products: Product[];
};

export class JsonCatalogStore implements ProductStore {
  private readonly products: Product[];
  private readonly categories: Category[];
  private readonly categoryById: Map<string, Category>;

  constructor(filePath?: string) {
    const resolved = filePath ?? defaultCatalogPath();
    const raw = readFileSync(resolved, "utf8");
    const parsed = JSON.parse(raw) as CatalogFile;
    this.categories = parsed.categories;
    this.products = parsed.products;
    this.categoryById = new Map();
    for (const category of this.categories) {
      this.categoryById.set(category.id, category);
    }
  }

  listProducts(): Product[] {
    return this.products;
  }

  listCategories(): Category[] {
    return this.categories;
  }

  getCategory(id: string): Category | undefined {
    return this.categoryById.get(id);
  }
}

function defaultCatalogPath(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.join(here, "../../data/catalog.json");
}
