import { City } from "../models/City";
import { PricingConfig } from "../models/PricingConfig";
export async function ensureDefaultCityAndPricing() {
  let city = await City.findOne({ slug: "rajshahi" });
  if (!city) city = await City.create({ name: "Rajshahi", slug: "rajshahi" });
  await PricingConfig.updateOne({ cityId: city._id }, { $setOnInsert: { cityId: city._id } }, { upsert: true });
  return city;
}
