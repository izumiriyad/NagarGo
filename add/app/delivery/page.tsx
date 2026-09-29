'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, MapPin, ArrowRight, ArrowLeft, Check, CreditCard, Loader2 } from 'lucide-react';
import { SiteLayout } from '@/components/layout/site-layout';
import { PageHeader } from '@/components/shared/page-header';
import { GpsCard, GpsLocation } from '@/components/shared/gps-card';
import { useAuth } from '@/components/auth/auth-provider';
import { supabase } from '@/lib/supabase';
import { formatCurrency, generateOrderId, generateTripId, generateTrackingToken, haversineDistance } from '@/lib/format';
import { divisions } from '@/lib/data/bangladesh';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { notifyTelegramOrder } from '@/lib/telegram';

const steps = ['Service', 'Pickup', 'Destination', 'Package', 'Fare', 'Payment', 'Confirm'];

export default function DeliveryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pickupGps, setPickupGps] = useState<GpsLocation | null>(null);
  const [dropoffGps, setDropoffGps] = useState<GpsLocation | null>(null);
  const [form, setForm] = useState({
    customerName: '',
    pickupAddress: '',
    pickupDivision: '',
    pickupDistrict: '',
    pickupThana: '',
    pickupArea: '',
    pickupContactName: '',
    pickupContactPhone: '',
    dropoffAddress: '',
    dropoffDivision: '',
    dropoffDistrict: '',
    dropoffThana: '',
    dropoffArea: '',
    dropoffContactName: '',
    dropoffContactPhone: '',
    packageType: 'document',
    packageSize: 'small',
    packageWeight: '',
    packageDescription: '',
    isFragile: false,
    specialInstructions: '',
    preferredPickupTime: '',
    paymentMethod: 'cash',
  });

  const fare = calculateFare(pickupGps, dropoffGps);

  const update = (key: string, value: string | boolean) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const submitOrder = useCallback(async () => {
    if (!user) {
      toast.error('Please login to create an order');
      router.push('/login');
      return;
    }
    if (!form.customerName) { toast.error('Please enter your name'); return; }
    setLoading(true);
    try {
      const orderId = generateOrderId('parcel');
      const tripId = generateTripId();
      const trackingToken = generateTrackingToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('orders')
        .insert({
          order_id: orderId,
          trip_id: tripId,
          customer_id: user.id,
          customer_name: form.customerName,
          service_type: 'parcel',
          status: 'requested',
          pickup_address: form.pickupAddress,
          pickup_lat: pickupGps?.lat,
          pickup_lng: pickupGps?.lng,
          pickup_division: form.pickupDivision,
          pickup_district: form.pickupDistrict,
          pickup_thana: form.pickupThana,
          pickup_area: form.pickupArea,
          pickup_contact_name: form.pickupContactName,
          pickup_contact_phone: form.pickupContactPhone,
          dropoff_address: form.dropoffAddress,
          dropoff_lat: dropoffGps?.lat,
          dropoff_lng: dropoffGps?.lng,
          dropoff_division: form.dropoffDivision,
          dropoff_district: form.dropoffDistrict,
          dropoff_thana: form.dropoffThana,
          dropoff_area: form.dropoffArea,
          dropoff_contact_name: form.dropoffContactName,
          dropoff_contact_phone: form.dropoffContactPhone,
          package_type: form.packageType,
          package_size: form.packageSize,
          package_weight: form.packageWeight,
          package_description: form.packageDescription,
          is_fragile: form.isFragile,
          special_instructions: form.specialInstructions,
          distance_km: fare.distance,
          base_fare: fare.baseFare,
          distance_fare: fare.distanceFare,
          service_fee: fare.serviceFee,
          total_fare: fare.total,
          rider_earning: fare.riderEarning,
          commission: fare.commission,
          payment_method: form.paymentMethod,
          payment_status: 'pending',
          tracking_token: trackingToken,
          tracking_expires_at: expiresAt,
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from('tracking_sessions').insert({
        order_id: data.id,
        trip_id: tripId,
        tracking_token: trackingToken,
        customer_id: user.id,
        status: 'active',
        expires_at: expiresAt,
      });

      toast.success('Order created! Searching for a rider...');

      notifyTelegramOrder({
        order_id: orderId,
        service_type: 'parcel',
        customer_name: form.customerName,
        pickup_address: form.pickupAddress,
        pickup_area: form.pickupArea,
        dropoff_address: form.dropoffAddress,
        dropoff_area: form.dropoffArea,
        total_fare: fare.total,
        payment_method: form.paymentMethod,
        distance_km: fare.distance,
        pickup_contact_phone: form.pickupContactPhone,
        dropoff_contact_phone: form.dropoffContactPhone,
        package_description: form.packageDescription,
        special_instructions: form.specialInstructions,
      });

      router.push(`/orders/${data.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  }, [user, form, pickupGps, dropoffGps, fare, router]);

  return (
    <SiteLayout>
      <PageHeader
        title="Parcel Delivery"
        subtitle="Send packages across the city with verified riders. Track live, verify with OTP."
        icon={<Package className="w-8 h-8 text-primary" />}
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Progress */}
        <div className="flex items-center justify-between mb-8 overflow-x-auto scrollbar-hide">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2 shrink-0">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-md text-xs font-semibold transition-all ${
                  i === step
                    ? 'bg-primary text-primary-foreground glow-primary'
                    : i < step
                    ? 'bg-primary/20 text-primary'
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs ${i === step ? 'text-foreground font-medium' : 'text-muted-foreground'} hidden sm:block`}>
                {s}
              </span>
              {i < steps.length - 1 && <div className={`w-6 h-px ${i < step ? 'bg-primary' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="glass rounded-xl border border-border/60 p-6"
          >
            {step === 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Your Name</h3>
                <Field label="Your Name *" value={form.customerName} onChange={(v) => update('customerName', v)} />
                <h3 className="text-lg font-semibold">Select Service Type</h3>
                <div className="grid grid-cols-2 gap-3">
                  {['Document', 'Small Package', 'Medium Box', 'Large Item'].map((type) => (
                    <button
                      key={type}
                      onClick={() => { if (!form.customerName) { toast.error('Please enter your name first'); return; } update('packageType', type.toLowerCase().replace(/\s+/g, '_')); setStep(1); }}
                      className="p-4 rounded-lg border border-border/60 hover:border-primary/40 text-left transition-all"
                    >
                      <Package className="w-5 h-5 text-primary mb-2" />
                      <p className="text-sm font-medium">{type}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" /> Pickup Location</h3>
                <GpsCard onLocationDetected={setPickupGps} compact />
                <Field label="Pickup Address" value={form.pickupAddress} onChange={(v) => update('pickupAddress', v)} />
                <div className="grid grid-cols-2 gap-3">
                  <SelectField label="Division" value={form.pickupDivision} onChange={(v) => update('pickupDivision', v)} options={divisions.map(d => d.name)} />
                  <SelectField label="District" value={form.pickupDistrict} onChange={(v) => update('pickupDistrict', v)} options={divisions.find(d => d.name === form.pickupDivision)?.districts || []} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Thana/Upazila" value={form.pickupThana} onChange={(v) => update('pickupThana', v)} />
                  <Field label="Area" value={form.pickupArea} onChange={(v) => update('pickupArea', v)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Contact Name" value={form.pickupContactName} onChange={(v) => update('pickupContactName', v)} />
                  <Field label="Contact Phone" value={form.pickupContactPhone} onChange={(v) => update('pickupContactPhone', v)} />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" /> Destination</h3>
                <GpsCard onLocationDetected={setDropoffGps} compact />
                <Field label="Destination Address" value={form.dropoffAddress} onChange={(v) => update('dropoffAddress', v)} />
                <div className="grid grid-cols-2 gap-3">
                  <SelectField label="Division" value={form.dropoffDivision} onChange={(v) => update('dropoffDivision', v)} options={divisions.map(d => d.name)} />
                  <SelectField label="District" value={form.dropoffDistrict} onChange={(v) => update('dropoffDistrict', v)} options={divisions.find(d => d.name === form.dropoffDivision)?.districts || []} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Thana/Upazila" value={form.dropoffThana} onChange={(v) => update('dropoffThana', v)} />
                  <Field label="Area" value={form.dropoffArea} onChange={(v) => update('dropoffArea', v)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Receiver Name" value={form.dropoffContactName} onChange={(v) => update('dropoffContactName', v)} />
                  <Field label="Receiver Phone" value={form.dropoffContactPhone} onChange={(v) => update('dropoffContactPhone', v)} />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Package Details</h3>
                <SelectField label="Package Size" value={form.packageSize} onChange={(v) => update('packageSize', v)} options={['small', 'medium', 'large']} />
                <Field label="Weight (approx kg)" value={form.packageWeight} onChange={(v) => update('packageWeight', v)} />
                <Field label="Package Description" value={form.packageDescription} onChange={(v) => update('packageDescription', v)} />
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border/60">
                  <input type="checkbox" id="fragile" checked={form.isFragile} onChange={(e) => update('isFragile', e.target.checked)} className="w-4 h-4 accent-primary" />
                  <label htmlFor="fragile" className="text-sm">Mark as fragile</label>
                </div>
                <Field label="Special Instructions" value={form.specialInstructions} onChange={(v) => update('specialInstructions', v)} textarea />
                <Field label="Preferred Pickup Time" value={form.preferredPickupTime} onChange={(v) => update('preferredPickupTime', v)} type="datetime-local" />
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Fare Estimate</h3>
                <div className="rounded-lg bg-secondary/40 border border-border/60 p-4 space-y-2">
                  <FareRow label="Base Fare" value={fare.baseFare} />
                  <FareRow label={`Distance (${fare.distance.toFixed(1)} km)`} value={fare.distanceFare} />
                  <FareRow label="Service Fee" value={fare.serviceFee} />
                  {fare.surcharge > 0 && <FareRow label="Surcharge" value={fare.surcharge} />}
                  <div className="h-px bg-border my-2" />
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total</span>
                    <span className="text-xl font-bold text-primary">{formatCurrency(fare.total)}</span>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Rider earns: {formatCurrency(fare.riderEarning)}</span>
                  <span>NagarGo commission: {formatCurrency(fare.commission)}</span>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2"><CreditCard className="w-5 h-5 text-primary" /> Payment Method</h3>
                {[
                  { id: 'cash', label: 'Cash on Delivery', desc: 'Pay with cash when the package is delivered' },
                  { id: 'pay_rider', label: 'Pay to Rider', desc: 'Pay the rider directly' },
                  { id: 'pay_admin', label: 'Pay to Admin', desc: 'Pay to NagarGo admin' },
                  { id: 'bkash', label: 'Manual bKash Send Money', desc: 'Send money to +8801410348109 (Personal)' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => update('paymentMethod', p.id)}
                    className={`w-full p-4 rounded-lg border text-left transition-all ${form.paymentMethod === p.id ? 'border-primary bg-primary/10' : 'border-border/60 hover:border-primary/30'}`}
                  >
                    <p className="font-medium text-sm">{p.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.desc}</p>
                  </button>
                ))}
              </div>
            )}

            {step === 6 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Confirm Your Order</h3>
                <div className="rounded-lg bg-secondary/40 border border-border/60 p-4 space-y-3 text-sm">
                  <SummaryRow label="Name" value={form.customerName} />
                  <SummaryRow label="Service" value="Parcel Delivery" />
                  <SummaryRow label="From" value={`${form.pickupAddress || 'GPS location'}, ${form.pickupArea || ''}`} />
                  <SummaryRow label="To" value={`${form.dropoffAddress || 'GPS location'}, ${form.dropoffArea || ''}`} />
                  <SummaryRow label="Package" value={`${form.packageSize} ${form.packageType}`} />
                  <SummaryRow label="Payment" value={form.paymentMethod === 'bkash' ? 'bKash' : form.paymentMethod === 'cash' ? 'Cash on Delivery' : 'Pay ' + form.paymentMethod.replace('_', ' ')} />
                  <div className="h-px bg-border" />
                  <div className="flex justify-between font-semibold">
                    <span>Total Fare</span>
                    <span className="text-primary">{formatCurrency(fare.total)}</span>
                  </div>
                </div>
                {!user && (
                  <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
                    Please <Link href="/login" className="underline font-medium">login</Link> to place your order.
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="flex items-center gap-1 px-4 h-11 rounded-md border border-border/60 text-sm font-medium disabled:opacity-40 enabled:hover:border-primary/40 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          {step < steps.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-1 px-5 h-11 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-bright transition-all"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={submitOrder}
              disabled={loading || !user}
              className="flex items-center gap-2 px-5 h-11 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-bright disabled:opacity-50 transition-all"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {loading ? 'Creating...' : 'Place Order'}
            </button>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}

function calculateFare(pickup: GpsLocation | null, dropoff: GpsLocation | null) {
  const baseFare = 40;
  const includedKm = 2;
  const perKm = 12;
  const minFare = 50;
  const serviceFee = 5;
  const commissionPercent = 0.20;

  const distance = pickup && dropoff ? haversineDistance(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng) : 3;
  const extraKm = Math.max(0, distance - includedKm);
  const distanceFare = Math.round(extraKm * perKm);
  const total = Math.max(minFare, baseFare + distanceFare + serviceFee);
  const commission = Math.round(total * commissionPercent);
  const riderEarning = total - commission;

  return { baseFare, distanceFare, serviceFee, surcharge: 0, total, distance, riderEarning, commission };
}

function Field({ label, value, onChange, textarea, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; textarea?: boolean; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 h-20 rounded-md bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40" />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 h-10 rounded-md bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40" />
      )}
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 h-10 rounded-md bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40">
        <option value="">Select {label}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function FareRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{formatCurrency(value)}</span>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right max-w-[60%]">{value}</span>
    </div>
  );
}
