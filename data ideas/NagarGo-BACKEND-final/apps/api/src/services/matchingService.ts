import { Rider } from "../models/Rider";
import { Order } from "../models/Order";

export async function findNearestEligibleRider(order: { cityId: unknown; destination?: { lat?: number; lng?: number } }) {
  // The production adapter should use PostGIS/GeoJSON or Mongo $near with rider locations.
  // This deterministic fallback ranks online, verified riders in the same city by trust score.
  return Rider.findOne({ cityId: order.cityId, status: "VERIFIED", isOnline: true, "serviceEligibility.delivery": true })
    .sort({ trustScore: -1, rating: -1, completedDeliveries: -1 });
}
export async function assignNearestRider(orderId: string) {
  const order = await Order.findById(orderId);
  if (!order) return null;
  const rider = await findNearestEligibleRider({ cityId: order.cityId, destination: order.destination ?? undefined });
  if (!rider) return null;
  order.riderId = rider._id;
  order.status = "RIDER_ASSIGNED";
  order.statusHistory.push({ status: "RIDER_ASSIGNED", note: "Assigned by dispatch matching service." });
  await order.save();
  return rider;
}
