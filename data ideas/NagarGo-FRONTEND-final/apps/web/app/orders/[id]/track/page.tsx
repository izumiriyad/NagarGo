"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { LiveTrackingMap } from "@/components/maps/LiveTrackingMap";

export default function TrackOrder({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<any>();
  const [error, setError] = useState("");

  async function load() {
    try { setOrder((await api<any>(`/orders/${params.id}`)).order); }
    catch (e: any) { setError(e.message); }
  }
  useEffect(() => { load(); }, [params.id]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onChange = (data: { orderId: string; status: string }) => {
      if (data.orderId === params.id) load();
    };
    socket.on("order:status-changed", onChange);
    return () => { socket.off("order:status-changed", onChange); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => socket.emit("customer:location", { orderId: params.id, lat: coords.latitude, lng: coords.longitude }),
      () => undefined,
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 15_000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [params.id]);

  if (error) return <main className="mx-auto max-w-2xl px-5 py-12 text-red-600">{error}</main>;
  if (!order) return <main className="mx-auto max-w-2xl px-5 py-12"><div className="skeleton h-64 rounded-2xl" /></main>;

  return (
    <main className="mx-auto max-w-2xl animate-fade-up px-5 py-12">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Order {order.publicId}</h1>
        <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold">{order.status.replaceAll("_", " ")}</span>
      </div>
      <p className="mt-2 text-ink/60">{order.pickup?.fullAddress} → {order.destination?.fullAddress}</p>

      {order.pricing && (
        <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-route-green/5 p-4 text-sm">
          <div><p className="text-xs text-ink/50">Distance</p><b>{order.pricing.distanceKm} km</b></div>
          <div><p className="text-xs text-ink/50">Customer total</p><b>৳{order.pricing.total}</b></div>
          <div><p className="text-xs text-ink/50">Rider earnings</p><b className="text-route-green-dark">৳{order.pricing.riderEarnings}</b></div>
        </div>
      )}

      <div className="mt-6">
        <LiveTrackingMap
          orderId={order._id}
          pickup={{ lat: order.pickup.lat, lng: order.pickup.lng }}
          destination={{ lat: order.destination.lat, lng: order.destination.lng }}
        />
      </div>

      <ol className="mt-6 space-y-2 text-sm">
        {order.statusHistory?.map((h: any, i: number) => (
          <li key={i} className="animate-fade-up flex justify-between rounded-xl bg-black/[0.03] px-4 py-2" style={{ animationDelay: `${i * 40}ms` }}>
            <span className="font-medium">{h.status.replaceAll("_", " ")}</span>
            <span className="text-ink/40">{new Date(h.at ?? h.createdAt ?? Date.now()).toLocaleTimeString()}</span>
          </li>
        ))}
      </ol>
    </main>
  );
}
