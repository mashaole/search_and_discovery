# Solution

This app searches a local catalog of 40 products and shows live
price, availability, and a delivery estimate. The catalog is a
JSON file. There is no database.

## Design decisions

### JSON catalog

Products and categories live in `server/data/catalog.json`. A
product stores `categoryId`, not the category name. The API reads
the file once at startup. A product change is a file edit and a
restart.

### Ranking

Search matches every product on name and category, ignoring case.
Results are ordered by how close the name fits: exact name, name
starts with the query, name contains the query, then category
name contains the query. Popularity or price only orders products
that match equally well. `id` keeps a page stable when two rows
tie. The count includes every match. The response is one page.

### Suggestions

Suggestions walk spelling distance in layers: exact or contained
names, then one edit, then two edits, and stop at 8 names. A
misspelling such as `buger` or `burgr` offers Burger. The result
list does not change until the person chooses a suggestion.

### Prices

An offer is not stored on the product. After a page is chosen,
the in-process provider is called with each product `id`. The
offer is attached to that same `id` on the card. The server cache
uses that `id` as the key for about 5 seconds. The browser does
not cache prices. A failed lookup leaves the product on the list
with empty offer fields.

### Screen

The screen uses `fetch` and `AbortController` so a new query
cancels the previous request and a search stops at 4 seconds.
Search state lives in one module and is written to the URL. An
empty query browses the catalog, sorted by popularity or price.
The search box strips special characters as you type. The API
still allow-lists `q` before it scans. The list shows loading.
The form stays usable. Each reusable section sits in its own
error boundary so a broken card cannot take down the page.

### Layout and injection

Routes parse the request, call a service, and write the envelope.
Services depend on ports, not on the JSON file. `main.ts` builds
the catalog, the price provider, the memory cache, and the logger,
then passes them into the services by hand. There is no injection
framework. Tests pass fakes of the same ports. A new store, cache,
or price source is a new adapter and one line in `main.ts`.

The repo is three packages: `server`, `client`, and `shared`.
`shared` holds the types both sides use.

## Trade-offs

- **JSON file, no database.** The catalog is 40 products and
  nobody edits it from the screen. Search works as soon as the
  app starts. A product change needs a restart.
- **Search everything, return one page.** "1–10 of 24" includes
  the whole result set, so a better match is not left off the
  first page. The scan of 40 items is cheap. Prices load only
  for the page on screen unless sort is price, which needs live
  prices to order the full set.
- **A closer name ranks above a more popular product.** The item
  someone typed shows up first. A popular item in the same
  category does not jump ahead of a direct name hit.
- **A typo suggests a name and waits for a choice.** The list
  does not silently switch to a different product. Until they
  accept the suggestion, the list can be empty.
- **A missing price does not hide the product.** The card stays.
  A successful price is reused for about 5 seconds, so a repeat
  search is quick. That price can be a few seconds old.
- **The list returns only the fields on the card.** Description
  stays in the file unless the caller names it. A price lookup
  is skipped when the mask has no offer fields.
- **The search is in the address bar.** A copied link restores
  the same query. The URL is longer.
- **One broken card does not take down the page.** That spot
  shows its own error. The person can keep searching.

## AI assistance

An assistant helped draft the architecture, the JSON catalog,
the search and suggestion logic, the Svelte screen, tests, and
this write-up. The design choices, ranking rules, and error
catalog were specified in the product plan and then implemented
in this repo.

## With more time

This is not built. The ports are what would make the swap
possible.

The Svelte app would be static files on S3, served by CloudFront.
The API would run as more than one task behind a load balancer.
An in-memory price cache would disagree across tasks, so
successful prices would move to ElastiCache. The lifetime would
stay short. Failures would still not be stored.

Once products can be created, updated, or deleted, that write
would clear the cached search pages and that product's price. A
delete would remove the price entry. An update would remove it
so the next search loads the new record. A create would clear
the search pages so the new product can appear. The short
lifetime would remain as a backstop if a write is missed.

The catalog would move to Aurora PostgreSQL. Search reads would
go to a read replica. Catalog writes, if they exist later, would
go to the primary. A short replica lag is acceptable because the
screen already accepts a price that is a few seconds old.

Name search and typo suggestions would move to OpenSearch once
the catalog is too large to scan. The breadth-first walk over
40 names is the right cost now.

The timing line would become a CloudWatch metric: duration,
result count, and failed price lookups.

Search, suggestions, the catalog, and prices would become separate
services:

- **Catalog** owns products and categories.
- **Search** owns the match, the rank, and the page.
- **Suggestions** owns the spelling walk.
- **Prices** owns availability, price, and the delivery estimate.

The screen would keep one fetch module and talk to a gateway.
Replacing today's in-process port with an HTTP client is the
change in `main.ts`. The search rules would not be rewritten.

Products are the list that is paged today. Categories are
returned in full. If a list such as categories grew large, it
would be paged or searched the same way, and the whole set
would not be sent.

Other work that waits: highlighting the matched text, matching
words in any order, and a test that runs the screen in a browser.
