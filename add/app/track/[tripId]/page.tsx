'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, MapPin, Clock, Crosshair, Phone, Share2, Copy, LifeBuoy, CheckCircle, XCircle, Radio } from 'lucide-react';
import { Logo } from '@/components/shared/logo';
import { supabase } from '@/lib/supabase';
import { timeAgo } from '@/lib/format';
import { toast } from 'sonner';
import Link from 'next/link';

interface TrackingData {
  id: string;
  trip_id: string;
  tracking_token: string;
  status: string;
  rider_lat: number | null;
  rider_lng: number | null;
  rider_accuracy: number | null;
  rider_heading: number | null;
  last_updated: string | null;
  expires_at: string;
  order_id: string;
}

interface OrderData {
  order_id: string;
  service_type: string;
  status: string;
  pickup_address: string;
  dropoff_address: string;
  total_fare: number;
  pickup_contact_phone: string | null;
  dropoff_contact_phone: string | null;
}

export default function TrackingPage() {
  const { tripId } = useParams();
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastPoll, setLastPoll] = useState<Date>(new Date());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchTracking = useCallback(async () => {
    const { data: trackData } = await supabase
      .from('tracking_sessions')
      .select('*')
      .eq('trip_id', tripId)
      .maybeSingle();

    if (!trackData) {
      setError('Tracking link not found or expired');
      setLoading(false);
      return;
    }

    if (trackData.status === 'expired' || new Date(trackData.expires_at) < new Date()) {
      setError('This tracking link has expired. Tracking is only available for active trips.');
      setTracking(trackData as TrackingData);
      setLoading(false);
      return;
    }

    setTracking(trackData as TrackingData);

    const { data: orderData } = await supabase
      .from('orders')
      .select('order_id, service_type, status, pickup_address, dropoff_address, total_fare, pickup_contact_phone, dropoff_contact_phone')
      .eq('trip_id', tripId)
      .maybeSingle();

    if (orderData) {
      setOrder(orderData as OrderData);
      if (['completed', 'cancelled', 'rejected', 'expired'].includes(orderData.status)) {
        setError('This trip has ended. Tracking is no longer available.');
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    setLastPoll(new Date());
  }, [tripId]);

  useEffect(() => {
    fetchTracking();
    intervalRef.current = setInterval(fetchTracking, 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchTracking]);

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Tracking link copied');
  }, []);

  const shareLink = useCallback(async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'NagarGo Live Tracking', url: window.location.href }); } catch {}
    } else { copyLink(); }
  }, [copyLink]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading live tracking...</p>
        </div>
      </div>
    );
  }

  if (error && (!tracking || tracking.status === 'expired')) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Tracking Unavailable</h1>
          <p className="text-sm text-muted-foreground mb-6">{error}</p>
          <Link href="/" className="inline-flex items-center gap-2 px-6 h-12 rounded-md bg-primary text-primary-foreground font-semibold">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const isCompleted = order?.status === 'completed' || order?.status === 'cancelled';

  return (
    <div className="min-h-screen bg-background">
      {/* Header bar */}
      <div className="glass-strong border-b border-border/50 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo showText={false} />
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">NagarGo</span>
              {!isCompleted && (
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-primary text-primary-foreground animate-pulse">LIVE</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Radio className="w-3.5 h-3.5 text-primary" />
            <span>Updated {timeAgo(lastPoll)}</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 pb-24">
        {isCompleted && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl border border-primary/30 p-6 text-center mb-6">
            <CheckCircle className="w-12 h-12 text-primary mx-auto mb-3" />
            <h2 className="text-xl font-bold mb-1">Trip Completed</h2>
            <p className="text-sm text-muted-foreground">Tracking link has been disabled. Thank you for using NagarGo!</p>
          </motion.div>
        )}

        {/* Map area with animated rider marker */}
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="relative h-64 sm:h-80 rounded-xl glass border border-border/60 overflow-hidden mb-6">
          <div className="absolute inset-0 bg-grid opacity-30" />
          <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-primary/10 rounded-full blur-[60px]" />

          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <motion.path
              d="M10,80% Q40%,30% 60%,50% T90%,20%"
              stroke="url(#trackGrad)"
              strokeWidth="2"
              fill="none"
              strokeDasharray="6 6"
              animate={{ strokeDashoffset: [0, -24] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
            <defs>
              <linearGradient id="trackGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00D26A" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#24F58A" stopOpacity="1" />
                <stop offset="100%" stopColor="#00D26A" stopOpacity="0.3" />
              </linearGradient>
            </defs>
          </svg>

          {/* Pickup marker */}
          <div className="absolute top-[78%] left-[8%]">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-primary border-2 border-white" />
              <span className="text-[10px] text-muted-foreground mt-1">Pickup</span>
            </div>
          </div>

          {/* Destination marker */}
          <div className="absolute top-[18%] left-[88%]">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-destructive border-2 border-white" />
              <span className="text-[10px] text-muted-foreground mt-1">Drop</span>
            </div>
          </div>

          {/* Rider marker (animated) */}
          {!isCompleted && (
            <motion.div
              animate={{
                left: ['8%', '30%', '55%', '75%', '88%'],
                top: ['78%', '60%', '48%', '32%', '18%'],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute"
            >
              <div className="relative">
                <span className="absolute inset-0 w-8 h-8 rounded-full bg-primary/30 animate-ping" />
                <span className="relative flex w-8 h-8 rounded-full bg-primary items-center justify-center glow-primary">
                  <Navigation className="w-4 h-4 text-primary-foreground" />
                </span>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Trip info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl border border-border/60 p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-muted-foreground">Trip ID</p>
              <p className="text-sm font-bold">{tracking?.trip_id}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${order?.status === 'completed' ? 'bg-primary/15 text-primary' : order?.status === 'cancelled' ? 'bg-destructive/15 text-destructive' : 'bg-warning/15 text-warning'}`}>
              {order?.status?.replace(/_/g, ' ') || 'Active'}
            </span>
          </div>

          <div className="space-y-3">
            <InfoRow icon={MapPin} label="Pickup" value={order?.pickup_address || 'N/A'} />
            <InfoRow icon={Navigation} label="Destination" value={order?.dropoff_address || 'N/A'} />
            <InfoRow icon={Clock} label="Last Updated" value={tracking?.last_updated ? timeAgo(tracking.last_updated) : 'Waiting for rider...'} />
            <InfoRow icon={Crosshair} label="GPS Accuracy" value={tracking?.rider_accuracy ? `±${Math.round(tracking.rider_accuracy)} meters` : 'N/A'} />
          </div>
        </motion.div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ActionButton icon={Phone} label="Call" onClick={() => { if (order?.pickup_contact_phone) window.location.href = `tel:${order.pickup_contact_phone}`; }} />
          <ActionButton icon={Share2} label="Share" onClick={shareLink} />
          <ActionButton icon={Copy} label="Copy Link" onClick={copyLink} />
          <Link href="/support">
            <div className="flex flex-col items-center justify-center gap-1 p-4 rounded-lg glass border border-border/60 hover:border-primary/30 transition-all cursor-pointer h-full">
              <LifeBuoy className="w-5 h-5 text-primary" />
              <span className="text-xs font-medium">Support</span>
            </div>
          </Link>
        </div>

        {/* Polling indicator */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span className="relative flex w-2 h-2">
            <span className="absolute inline-flex w-full h-full rounded-full bg-primary opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full w-2 h-2 bg-primary-bright" />
          </span>
          <span>Live polling every 5 seconds</span>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
      <Icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

function ActionButton({ icon: Icon, label, onClick }: { icon: typeof Phone; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center justify-center gap-1 p-4 rounded-lg glass border border-border/60 hover:border-primary/30 transition-all">
      <Icon className="w-5 h-5 text-primary" />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}
