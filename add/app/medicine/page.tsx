'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pill, MapPin, ArrowRight, ArrowLeft, Check, CreditCard, Loader2, Upload, FileText } from 'lucide-react';
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

const steps = ['Prescription', 'Delivery Address', 'Details', 'Fare', 'Payment', 'Confirm'];

export default function MedicinePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pickupGps, setPickupGps] = useState<GpsLocation | null>(null);
  const [dropoffGps, setDropoffGps] = useState<GpsLocation | null>(null);
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    customerName: '',
    medicineList: '',
    pharmacyName: '',
    pharmacyAddress: '',
    deliveryAddress: '',
    deliveryDivision: '',
    deliveryDistrict: '',
    deliveryArea: '',
    contactName: '',
    contactPhone: '',
    notes: '',
    paymentMethod: 'cash',
  });

  const fare = { baseFare: 40, distanceFare: 36, serviceFee: 5, medicineFee: 10, total: 91, distance: 5, riderEarning: 73, commission: 18 };

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const submitOrder = useCallback(async () => {
    if (!form.customerName) { toast.error('Please enter your name'); return; }
    if (!user) { toast.error('Please login to place an order'); router.push('/login'); return; }
    setLoading(true);
    try {
      const orderId = generateOrderId('medicine');
      const tripId = generateTripId();
      const trackingToken = generateTrackingToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      let prescriptionUrl: string | null = null;
      if (prescriptionFile && user) {
        const ext = prescriptionFile.name.split('.').pop();
        const fileName = `prescriptions/${user.id}/${orderId}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('prescriptions').upload(fileName, prescriptionFile, { upsert: false });
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('prescriptions').getPublicUrl(fileName);
          prescriptionUrl = urlData.publicUrl;
        }
      }

      const { data, error } = await supabase.from('orders').insert({
        order_id: orderId, trip_id: tripId, customer_id: user.id, customer_name: form.customerName, service_type: 'medicine', status: 'requested',
        pickup_address: form.pharmacyAddress, pickup_division: form.deliveryDivision, pickup_district: form.deliveryDistrict,
        pickup_contact_name: form.pharmacyName, pickup_lat: pickupGps?.lat, pickup_lng: pickupGps?.lng,
        dropoff_address: form.deliveryAddress, dropoff_division: form.deliveryDivision, dropoff_district: form.deliveryDistrict, dropoff_area: form.deliveryArea,
        dropoff_contact_name: form.contactName, dropoff_contact_phone: form.contactPhone,
        dropoff_lat: dropoffGps?.lat, dropoff_lng: dropoffGps?.lng,
        prescription_url: prescriptionUrl, pharmacy_info: form.pharmacyName,
        package_description: form.medicineList, special_instructions: form.notes,
        distance_km: fare.distance, base_fare: fare.baseFare, distance_fare: fare.distanceFare, service_fee: fare.serviceFee, medicine_fee: fare.medicineFee,
        total_fare: fare.total, rider_earning: fare.riderEarning, commission: fare.commission,
        payment_method: form.paymentMethod, payment_status: 'pending',
        tracking_token: trackingToken, tracking_expires_at: expiresAt,
      }).select().single();

      if (error) throw error;
      await supabase.from('tracking_sessions').insert({ order_id: data.id, trip_id: tripId, tracking_token: trackingToken, customer_id: user.id, status: 'active', expires_at: expiresAt });
      toast.success('Medicine order placed! A rider will be assigned soon.');

      notifyTelegramOrder({
        order_id: orderId,
        service_type: 'medicine',
        customer_name: form.customerName,
        pickup_address: form.pharmacyAddress,
        dropoff_address: form.deliveryAddress,
        dropoff_area: form.deliveryArea,
        total_fare: fare.total,
        payment_method: form.paymentMethod,
        distance_km: fare.distance,
        dropoff_contact_phone: form.contactPhone,
        package_description: form.medicineList,
        special_instructions: form.notes,
        prescription_url: prescriptionUrl || undefined,
      });

      router.push(`/orders/${data.id}`);
    } catch (err: any) { toast.error(err.message || 'Failed to place order'); } finally { setLoading(false); }
  }, [user, form, prescriptionFile, pickupGps, dropoffGps, fare, router]);

  return (
    <SiteLayout>
      <PageHeader title="Medicine Express" subtitle="Upload your prescription and get medicines delivered from your pharmacy. Secure, legal, and fast." icon={<Pill className="w-8 h-8 text-primary" />} />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="flex items-center justify-between mb-8 overflow-x-auto scrollbar-hide">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2 shrink-0">
              <div className={`flex items-center justify-center w-8 h-8 rounded-md text-xs font-semibold ${i === step ? 'bg-primary text-primary-foreground glow-primary' : i < step ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs ${i === step ? 'text-foreground font-medium' : 'text-muted-foreground'} hidden sm:block`}>{s}</span>
              {i < steps.length - 1 && <div className={`w-6 h-px ${i < step ? 'bg-primary' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="glass rounded-xl border border-border/60 p-6">
            {step === 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Your Name</h3>
                <Field label="Your Name *" value={form.customerName} onChange={(v) => update('customerName', v)} />
                <h3 className="text-lg font-semibold">Upload Prescription</h3>
                <p className="text-sm text-muted-foreground">Upload a photo or PDF of your prescription. Your document is stored securely and privately.</p>
                <label className="block">
                  <div className="border-2 border-dashed border-border/60 rounded-lg p-8 text-center cursor-pointer hover:border-primary/40 transition-colors">
                    {prescriptionFile ? (
                      <div className="space-y-2">
                        <FileText className="w-10 h-10 text-primary mx-auto" />
                        <p className="text-sm font-medium">{prescriptionFile.name}</p>
                        <p className="text-xs text-muted-foreground">{(prescriptionFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-10 h-10 text-muted-foreground mx-auto" />
                        <p className="text-sm font-medium">Click to upload prescription</p>
                        <p className="text-xs text-muted-foreground">JPG, PNG, WEBP, or PDF (max 5MB)</p>
                      </div>
                    )}
                  </div>
                  <input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { if (f.size > 5 * 1024 * 1024) { toast.error('File too large. Max 5MB.'); return; } setPrescriptionFile(f); } }} />
                </label>
                <Field label="Medicine List (optional)" value={form.medicineList} onChange={(v) => update('medicineList', v)} textarea />
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" /> Delivery Address</h3>
                <GpsCard onLocationDetected={setDropoffGps} compact />
                <Field label="Delivery Address" value={form.deliveryAddress} onChange={(v) => update('deliveryAddress', v)} />
                <div className="grid grid-cols-2 gap-3">
                  <SelectField label="Division" value={form.deliveryDivision} onChange={(v) => update('deliveryDivision', v)} options={divisions.map(d => d.name)} />
                  <SelectField label="District" value={form.deliveryDistrict} onChange={(v) => update('deliveryDistrict', v)} options={divisions.find(d => d.name === form.deliveryDivision)?.districts || []} />
                </div>
                <Field label="Area" value={form.deliveryArea} onChange={(v) => update('deliveryArea', v)} />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Contact Name" value={form.contactName} onChange={(v) => update('contactName', v)} />
                  <Field label="Contact Phone" value={form.contactPhone} onChange={(v) => update('contactPhone', v)} />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Pharmacy Details</h3>
                <Field label="Pharmacy Name" value={form.pharmacyName} onChange={(v) => update('pharmacyName', v)} />
                <Field label="Pharmacy Address" value={form.pharmacyAddress} onChange={(v) => update('pharmacyAddress', v)} />
                <Field label="Notes" value={form.notes} onChange={(v) => update('notes', v)} textarea />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Fare Estimate</h3>
                <div className="rounded-lg bg-secondary/40 border border-border/60 p-4 space-y-2">
                  <FareRow label="Base Fare" value={fare.baseFare} />
                  <FareRow label={`Distance (${fare.distance} km)`} value={fare.distanceFare} />
                  <FareRow label="Service Fee" value={fare.serviceFee} />
                  <FareRow label="Medicine Fee" value={fare.medicineFee} />
                  <div className="h-px bg-border my-2" />
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total</span>
                    <span className="text-xl font-bold text-primary">{formatCurrency(fare.total)}</span>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2"><CreditCard className="w-5 h-5 text-primary" /> Payment Method</h3>
                {[
                  { id: 'cash', label: 'Cash on Delivery', desc: 'Pay with cash on delivery' },
                  { id: 'pay_rider', label: 'Pay to Rider', desc: 'Pay the rider directly' },
                  { id: 'bkash', label: 'Manual bKash', desc: 'Send Money to +8801410348109' },
                ].map((p) => (
                  <button key={p.id} onClick={() => update('paymentMethod', p.id)} className={`w-full p-4 rounded-lg border text-left transition-all ${form.paymentMethod === p.id ? 'border-primary bg-primary/10' : 'border-border/60 hover:border-primary/30'}`}>
                    <p className="font-medium text-sm">{p.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.desc}</p>
                  </button>
                ))}
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Confirm Your Order</h3>
                <div className="rounded-lg bg-secondary/40 border border-border/60 p-4 space-y-3 text-sm">
                  <SummaryRow label="Name" value={form.customerName} />
                  <SummaryRow label="Pharmacy" value={form.pharmacyName || 'Not specified'} />
                  <SummaryRow label="Deliver to" value={`${form.deliveryAddress || 'GPS'}, ${form.deliveryArea || ''}`} />
                  <SummaryRow label="Prescription" value={prescriptionFile ? prescriptionFile.name : 'Not uploaded'} />
                  <SummaryRow label="Payment" value={form.paymentMethod === 'bkash' ? 'bKash' : form.paymentMethod === 'cash' ? 'Cash' : 'Pay Rider'} />
                  <div className="h-px bg-border" />
                  <div className="flex justify-between font-semibold"><span>Total</span><span className="text-primary">{formatCurrency(fare.total)}</span></div>
                </div>
                {!user && <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">Please <Link href="/login" className="underline font-medium">login</Link> to place your order.</div>}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between mt-6">
          <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="flex items-center gap-1 px-4 h-11 rounded-md border border-border/60 text-sm font-medium disabled:opacity-40 enabled:hover:border-primary/40 transition-all">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          {step < steps.length - 1 ? (
            <button onClick={() => setStep(step + 1)} className="flex items-center gap-1 px-5 h-11 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-bright transition-all">
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={submitOrder} disabled={loading || !user} className="flex items-center gap-2 px-5 h-11 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-bright disabled:opacity-50 transition-all">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {loading ? 'Placing...' : 'Place Order'}
            </button>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}

function Field({ label, value, onChange, textarea, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; textarea?: boolean; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
      {textarea ? <textarea value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 h-20 rounded-md bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40" /> : <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 h-10 rounded-md bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40" />}
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
  return <div className="flex justify-between text-sm"><span className="text-muted-foreground">{label}</span><span className="font-medium">{formatCurrency(value)}</span></div>;
}
function SummaryRow({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span className="font-medium text-right max-w-[60%]">{value}</span></div>;
}
