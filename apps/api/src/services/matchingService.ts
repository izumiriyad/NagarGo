import { Rider } from "../models/Rider";
import { Order } from "../models/Order";

function distanceKm(a: { lat?: number; lng?: number }, b: { lat?: number; lng?: number }) {
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return Number.POSITIVE_INFINITY;
  const R = 6371,
    dLat = ((b.lat - a.lat) * Math.PI) / 180,
    dLng = ((b.lng - a.lng) * Math.PI) / 180,
    la1 = (a.lat * Math.PI) / 180,
    la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/**
 * Scores a rider candidate for a given order.
 * Lower score = better match (treated as a cost).
 *
 * Factors (weighted):
 *   - Distance to pickup (primary, 60 %)
 *   - Vehicle type preference (emergency → MOTORCYCLE, 20 %)
 *   - Trust score + rating (secondary tie-breaker, 20 %)
 */
function scoreRider(rider: any, order: any): number {
  const dist = distanceKm(rider.currentLocation ?? {}, order.pickup ?? {});
  const distScore = Math.min(dist, 20); // cap at 20 km — beyond that is irrelevant

  // Vehicle preference: emergency orders strongly prefer motorcycles.
  // Non-emergency orders treat all vehicle types equally.
  let vehicleScore = 0;
  if (order.isEmergency && rider.vehicle?.type !== "MOTORCYCLE") {
    vehicleScore = 5; // penalty for non-motorcycle in emergency
  }

  // Quality score: lower = better (invert trust/rating so high quality = low cost)
  const qualityScore = ((100 - (rider.trustScore ?? 50)) / 100 + (5 - (rider.rating ?? 5)) / 5) * 2;

  return distScore * 0.6 + vehicleScore * 0.2 + qualityScore * 0.2;
}

export async function findNearestEligibleRider(order: any) {
  const attempted = (order.dispatchAttempts ?? []).map((a: any) => String(a.riderId));
  const riders = await Rider.find({
    cityId: order.cityId,
    status: "VERIFIED",
    isOnline: true,
    "serviceEligibility.delivery": true,
    _id: { $nin: attempted },
  }).limit(100);

  if (riders.length === 0) return null;

  // Sort by composite score (ascending = best first)
  riders.sort((a: any, b: any) => scoreRider(a, order) - scoreRider(b, order));

  return riders[0];
}

export async function assignNearestRider(orderId: string) {
  const order = await Order.findById(orderId);
  if (!order) return null;
  const rider = await findNearestEligibleRider(order);
  if (!rider) return null;
  order.riderId = rider._id;
  order.status = "RIDER_ASSIGNED";
  order.dispatchAttempts.push({
    riderId: rider._id,
    assignedAt: new Date(),
    outcome: "PENDING",
  } as any);
  order.statusHistory.push({
    status: "RIDER_ASSIGNED",
    note: "Assigned by dispatch matching service.",
  });
  await order.save();
  return rider;
}
