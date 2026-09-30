import type { Offer } from "@search/shared";
import type { OfferProvider } from "../ports/index.js";

const MIN_DELAY_MS = 150;
const MAX_DELAY_MS = 800;
const FAILURE_RATE = 1 / 8;

export class SimulatedOfferProvider implements OfferProvider {
  async getOffer(productId: string): Promise<Offer> {
    const delay =
      MIN_DELAY_MS +
      Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1));
    await sleep(delay);
    if (Math.random() < FAILURE_RATE) {
      throw new Error("provider failed");
    }
    const seed = hashId(productId);
    return {
      available: seed % 5 !== 0,
      priceCents: 99 + (seed % 4001),
      currency: "ZAR",
      deliveryEstimate: `${15 + (seed % 40)} min`,
    };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function hashId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash;
}
