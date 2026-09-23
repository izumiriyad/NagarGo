import { PricingConfig, PricingConfigDocument } from "../models/PricingConfig";
import { AppError } from "../middleware/errorHandler";

interface PricingInput {
  cityId: string;
  distanceKm: number;
  isEmergency: boolean;
}

export interface PricingBreakdown {
  distanceKm: number;
  estimatedMinutes: number;
  baseFare: number;
  distanceFare: number;
  serviceFee: number;
  surcharges: number;
  total: number;
  riderEarnings: number;
  nagarGoCommission: number;
}

const AVERAGE_SPEED_KMPH = 22; // conservative urban average for Rajshahi traffic

/**
 * Computes the full fare breakdown for an order. This is the ONLY
 * function that may produce a chargeable total — it must be
 * called server-side, from trusted inputs (distance is computed
 * from geocoded pickup/destination, never accepted raw from the
 * client). The frontend may show an *estimate* using this same
 * formula for UX purposes, but the order is always re-priced here
 * before it is persisted.
 */
export async function calculatePricing({
  cityId,
  distanceKm,
  isEmergency,
}: PricingInput): Promise<PricingBreakdown> {
  const config = await PricingConfig.findOne({ cityId });
  if (!config) {
    throw new AppError("Pricing is not yet configured for this city.", 400);
  }

  const roundedDistance = Math.max(0, Math.round(distanceKm * 100) / 100);
  const estimatedMinutes = Math.ceil((roundedDistance / AVERAGE_SPEED_KMPH) * 60);

  const distanceFare = roundedDistance * config.perKmRate;
  let subtotal = config.baseFare + distanceFare + config.serviceFee;

  let multiplier = 1;
  if (config.isPeakActive) multiplier *= config.peakMultiplier;
  if (isEmergency) multiplier *= config.emergencyMultiplier;

  const surcharges = subtotal * (multiplier - 1);
  let total = subtotal * multiplier;

  if (total < config.minimumFare) {
    total = config.minimumFare;
  }

  total = Math.round(total * 100) / 100;

  const riderEarnings = Math.round(((total * config.riderCommissionPercent) / 100) * 100) / 100;
  const nagarGoCommission = Math.round((total - riderEarnings) * 100) / 100;

  return {
    distanceKm: roundedDistance,
    estimatedMinutes,
    baseFare: config.baseFare,
    distanceFare: Math.round(distanceFare * 100) / 100,
    serviceFee: config.serviceFee,
    surcharges: Math.round(surcharges * 100) / 100,
    total,
    riderEarnings,
    nagarGoCommission,
  };
}

export async function getActivePricingConfig(cityId: string): Promise<PricingConfigDocument> {
  const config = await PricingConfig.findOne({ cityId });
  if (!config) {
    throw new AppError("Pricing is not yet configured for this city.", 400);
  }
  return config;
}
