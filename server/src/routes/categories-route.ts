import type { Request, Response } from "express";
import type { ProductStore } from "../ports/index.js";
import { ok } from "./envelope.js";

export function categoriesHandler(store: ProductStore) {
  return (_req: Request, res: Response): void => {
    const items = store.listCategories();
    res.json(
      ok(
        { items },
        {
          limit: items.length,
          offset: 0,
          total: items.length,
          fields: ["id", "name"],
        },
      ),
    );
  };
}
