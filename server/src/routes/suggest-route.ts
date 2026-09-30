import type { Request, Response } from "express";
import type { SuggestService } from "../services/suggest-service.js";
import { parseSuggestQuery } from "../services/query-parser.js";
import { ok } from "./envelope.js";
import type { Suggestion } from "@search/shared";

export function suggestHandler(service: SuggestService) {
  return (req: Request, res: Response): void => {
    const parsed = parseSuggestQuery(
      req.query as Record<string, unknown>,
    );
    const rows = service.suggest(parsed.q);
    const items = rows.map((row) => maskSuggestion(row, parsed.fields));
    res.json(
      ok(
        { items },
        {
          limit: items.length,
          offset: 0,
          total: items.length,
          fields: parsed.fields,
        },
      ),
    );
  };
}

function maskSuggestion(
  row: Suggestion,
  fields: string[],
): Partial<Suggestion> & { id: string } {
  const selected = new Set(fields);
  const result: Partial<Suggestion> & { id: string } = { id: row.id };
  if (selected.has("name")) {
    result.name = row.name;
  }
  if (selected.has("distance")) {
    result.distance = row.distance;
  }
  return result;
}
