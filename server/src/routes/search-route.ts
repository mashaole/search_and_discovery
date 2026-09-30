import type { Request, Response } from "express";
import type { SearchService } from "../services/search-service.js";
import { parseSearchQuery } from "../services/query-parser.js";
import type { ProductStore } from "../ports/index.js";
import { ok } from "./envelope.js";

export function searchHandler(
  service: SearchService,
  store: ProductStore,
) {
  return async (req: Request, res: Response): Promise<void> => {
    const known = new Set(
      store.listCategories().map((category) => category.id),
    );
    const query = parseSearchQuery(
      req.query as Record<string, unknown>,
      known,
    );
    const result = await service.search(query);
    res.json(
      ok(result.page, {
        limit: query.limit,
        offset: query.offset,
        total: result.total,
        fields: result.fields,
      }),
    );
  };
}
