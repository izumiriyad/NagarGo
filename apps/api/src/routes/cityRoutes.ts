import { Router } from "express";
import { City } from "../models/City";
import { PricingConfig } from "../models/PricingConfig";
import { LRUCache } from "lru-cache";

const r = Router();

// Cache cities for 5 minutes (extremely high read/low write frequency)
const cache = new LRUCache({ max: 10, ttl: 1000 * 60 * 5 });

r.get("/", async (_req, res) => {
  const cached = cache.get("all-cities");
  if (cached) return res.json({ cities: cached });

  const cities = await City.find({ active: true }).sort({ name: 1 });
  cache.set("all-cities", cities);
  return res.json({ cities });
});

/** Public — returns pricing config for a city (for the frontend fare estimator). */
r.get("/:id/pricing", async (req, res) => {
  const config = await PricingConfig.findOne({ cityId: req.params.id });
  if (!config) {
    return res.status(404).json({ error: { message: "Pricing config not found for this city." } });
  }
  return res.json({ pricing: config });
});

export default r;
