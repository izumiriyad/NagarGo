import { City } from "../models/City";
import { PricingConfig } from "../models/PricingConfig";

/**
 * Idempotent first-boot seed. Creates a Rajshahi city document and a
 * sensible default pricing config if neither exists yet. Safe to call
 * on every startup — all operations use upsert/findOne so nothing is
 * duplicated. The admin may override pricing from the Admin Panel at
 * any time.
 */
export async function ensureDefaultCityAndPricing() {
  let city = await City.findOne({ slug: "rajshahi" });
  if (!city) {
    city = await City.create({ name: "Rajshahi", slug: "rajshahi" });
    console.log("[seed] Created Rajshahi city:", String(city._id));
  }

  const existing = await PricingConfig.findOne({ cityId: city._id });
  if (!existing) {
    await PricingConfig.create({
      cityId: city._id,
      baseFare: 30,
      perKmRate: 12,
      minimumFare: 50,
      serviceFee: 5,
      peakMultiplier: 1.3,
      emergencyMultiplier: 1.5,
      isPeakActive: false,
      riderCommissionPercent: 80,
      nagarGoCommissionPercent: 20,
    });
    console.log("[seed] Created default pricing config for Rajshahi.");
  }

  return city;
}
