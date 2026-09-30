# Search and discovery

Find catalog products and see live price, availability, and a
delivery estimate. The catalog is a local JSON file of 40 products.
There is no database.

## Setup

Node.js 18 or later is required.

```bash
npm run setup
```

That installs dependencies for the API, the Svelte app, and the
shared types in one workspace install.

## Run

From the repo root:

```bash
npm run dev
```

`dev` and `dev:all` start the API and the Svelte app together.

- App: http://localhost:5173
- API: http://localhost:3000

Vite proxies `/api` to the API during development.

Start one app on its own:

```bash
npm run dev:server
npm run dev:client
```

Build and run from one process:

```bash
npm run build
npm start
```

Then open http://localhost:3000.

Tests:

```bash
npm test
```

## Search

Open the app with an empty box to browse products across all
categories. Type at least 2 characters to search. Use letters,
numbers, and spaces between words. The box stops at 80 characters.

The first page is 10 products. You can raise the page size to 20
or 40. The address bar holds `q`, `categoryId`, `sort`, `limit`,
`offset`, and `fields`, so a copied link restores the same search.

Suggestions appear after a short pause. A misspelling such as
`buger` still offers Burger. Choosing a suggestion runs the search.

The result list shows loading while the search runs. After 4
seconds it stops and offers a retry. The search box stays usable.

## Timing log

Each search prints one line in the **server** terminal:

```text
search durationMs=412 total=8 page=8 offersFailed=1
```

Watch that terminal while you search.

## API

Every response uses the same envelope:

```json
{
  "data": {},
  "error": null,
  "meta": {
    "limit": 10,
    "offset": 0,
    "total": 24,
    "fields": ["id", "name"]
  }
}
```

On failure, `data` is null and `error` is `{ "code", "message" }`.

### Search

```http
GET /api/search?q=milk&limit=10&offset=0&sort=popularity
```

Optional:

- `q` — omit or leave empty to browse the catalog. When
  present, 2 to 80 characters, letters, numbers, and spaces
- `categoryId` — a known category id
- `sort` — `popularity` (default) or `price`
- `limit` — default 10, max 40
- `offset` — default 0
- `fields` — comma-separated names, for example
  `id,name,priceCents`

Default fields on a card: `id`, `name`, `categoryId`,
`categoryName`, `available`, `priceCents`, `currency`,
`deliveryEstimate`, `enrichment`.

Example success:

```json
{
  "data": {
    "items": [
      {
        "id": "p10",
        "name": "Whole Milk",
        "categoryId": "dairy",
        "categoryName": "dairy",
        "available": true,
        "priceCents": 219,
        "currency": "ZAR",
        "deliveryEstimate": "25 min",
        "enrichment": "ok"
      }
    ]
  },
  "error": null,
  "meta": {
    "limit": 10,
    "offset": 0,
    "total": 1,
    "fields": [
      "id",
      "name",
      "categoryId",
      "categoryName",
      "available",
      "priceCents",
      "currency",
      "deliveryEstimate",
      "enrichment"
    ]
  }
}
```

Example error:

```json
{
  "data": null,
  "error": {
    "code": "INVALID_QUERY",
    "message": "Use only letters, numbers, and spaces between words."
  },
  "meta": null
}
```

### Suggest

```http
GET /api/suggest?q=buger
```

### Categories

```http
GET /api/categories
```

### Health

```http
GET /health
```

Returns `{ "data": { "status": "ok" }, "error": null, "meta": null }`.
