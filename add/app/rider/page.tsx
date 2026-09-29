'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Loader2, Check, Bike, Upload, FileText, ShieldCheck, Copy, MessageCircle, CreditCard, ChevronRight, ChevronLeft, MapPin, Phone, Mail, IdCard, User, Navigation } from 'lucide-react';
import { SiteLayout } from '@/components/layout/site-layout';
import { PageHeader } from '@/components/shared/page-header';
import { useAuth } from '@/components/auth/auth-provider';
import { supabase } from '@/lib/supabase';
import { divisions } from '@/lib/data/bangladesh';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { notifyTelegramRiderApplication, notifyTelegramRiderFee } from '@/lib/telegram';

const BKASH_NUMBER = '+8801410348109';
const WHATSAPP_NUMBER = '8801683772714';

const STEPS = [
  { num: 1, label: 'ব্যক্তিগত তথ্য', labelEn: 'Personal' },
  { num: 2, label: 'রাইডার ও সার্ভিস তথ্য', labelEn: 'Rider' },
  { num: 3, label: 'যাচাইকরণ / পেমেন্ট', labelEn: 'Verification' },
];

export default function RiderPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [feeSubmitting, setFeeSubmitting] = useState(false);
  const [riderId, setRiderId] = useState<string | null>(null);
  const [trxId, setTrxId] = useState('');
  const [senderBkash, setSenderBkash] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    fullName: '', phone: '', email: '', dob: '', address: '',
    division: '', district: '', city: '', thana: '', area: '',
    union: '', ward: '', village: '',
    nidNumber: '', vehicleType: 'motorcycle', vehicleRegistration: '',
    drivingLicense: '', emergencyContactName: '', emergencyContactPhone: '',
    bkashNumber: '', preferredZone: '',
    gpsLat: '', gpsLng: '',
  });
  const [files, setFiles] = useState<{ nidFront?: File; nidBack?: File; profilePhoto?: File }>({});

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const detectGPS = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('এই ডিভাইসে GPS উপলব্ধ নেই।');
      return;
    }
    toast.info('Location খোঁজা হচ্ছে...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        update('gpsLat', pos.coords.latitude.toFixed(6));
        update('gpsLng', pos.coords.longitude.toFixed(6));
        toast.success(`Location সনাক্ত হয়েছে (±${Math.round(pos.coords.accuracy)}m)`);
      },
      () => {
        toast.error('Location অনুমতি দেওয়া হয়নি। আপনার ব্রাউজার সেটিংস চেক করুন।');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const validateStep = (s: number): boolean => {
    if (s === 1) {
      if (!form.fullName) { toast.error('পুরো নাম লিখুন'); return false; }
      if (!form.phone) { toast.error('ফোন নম্বর লিখুন'); return false; }
      if (!form.nidNumber) { toast.error('NID নম্বর লিখুন'); return false; }
      if (!form.emergencyContactName || !form.emergencyContactPhone) { toast.error('Emergency contact লিখুন'); return false; }
      return true;
    }
    if (s === 2) {
      if (!form.vehicleRegistration) { toast.error('Vehicle নম্বর লিখুন'); return false; }
      if (!form.division) { toast.error('Division সিলেক্ট করুন'); return false; }
      return true;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, 3));
  };
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const submitApplication = useCallback(async () => {
    if (!user) { toast.error('রেজিস্টার করতে লগইন করুন'); router.push('/login'); return; }
    if (!validateStep(1) || !validateStep(2)) return;

    setLoading(true);
    try {
      const { data: existing } = await supabase.from('riders').select('id, registration_fee_paid').eq('user_id', user.id).maybeSingle();
      if (existing) {
        if (existing.registration_fee_paid) {
          toast.info('আপনি ইতিমধ্যে রাইডার হিসেবে নিবন্ধিত');
          router.push('/rider/dashboard');
          return;
        }
        setRiderId(existing.id);
        setLoading(false);
        return;
      }

      let nidFrontUrl: string | null = null;
      let nidBackUrl: string | null = null;
      let profilePhotoUrl: string | null = null;

      for (const [key, file] of Object.entries(files)) {
        if (!file) continue;
        const ext = file.name.split('.').pop();
        const path = `riders/${user.id}/${key}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from('rider-docs').upload(path, file, { upsert: true });
        if (uploadErr) {
          toast.error(`${key} আপলোড ব্যর্থ: ${uploadErr.message}`);
        } else {
          const { data: urlData } = supabase.storage.from('rider-docs').getPublicUrl(path);
          if (key === 'nidFront') nidFrontUrl = urlData.publicUrl;
          if (key === 'nidBack') nidBackUrl = urlData.publicUrl;
          if (key === 'profilePhoto') profilePhotoUrl = urlData.publicUrl;
        }
      }

      await supabase.from('profiles').update({
        full_name: form.fullName, phone: form.phone,
        division: form.division, district: form.district, city: form.city, thana: form.thana, area: form.area,
      }).eq('id', user.id);

      const { data: riderData, error } = await supabase.from('riders').insert({
        user_id: user.id, status: 'submitted', vehicle_type: form.vehicleType,
        vehicle_registration: form.vehicleRegistration, driving_license: form.drivingLicense,
        nid_number: form.nidNumber, nid_front_url: nidFrontUrl, nid_back_url: nidBackUrl,
        profile_photo_url: profilePhotoUrl, emergency_contact_name: form.emergencyContactName,
        emergency_contact_phone: form.emergencyContactPhone, bkash_number: form.bkashNumber,
        preferred_zone: form.preferredZone, registration_fee_paid: false,
      }).select('id').single();

      if (error) throw error;

      setRiderId(riderData.id);

      notifyTelegramRiderApplication({
        rider_id: riderData.id,
        rider_name: form.fullName,
        rider_phone: form.phone,
        vehicle_type: form.vehicleType,
        vehicle_registration: form.vehicleRegistration,
        nid_number: form.nidNumber,
        preferred_zone: form.preferredZone,
      });

      toast.success('আবেদন সংরক্ষিত হয়েছে! এখন ফি পরিশোধ করুন।');
    } catch (err: any) { toast.error(err.message || 'আবেদন জমা দিতে সমস্যা হয়েছে'); } finally { setLoading(false); }
  }, [user, form, files, router]);

  const submitFee = useCallback(async () => {
    if (!user || !riderId) return;
    if (!trxId) { toast.error('TRX ID লিখুন'); return; }
    if (!screenshotFile) { toast.error('পেমেন্ট স্ক্রিনশট আপলোড করুন'); return; }

    setFeeSubmitting(true);
    try {
      const ext = screenshotFile.name.split('.').pop();
      const path = `rider-fees/${user.id}/registration-fee.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('rider-docs').upload(path, screenshotFile, { upsert: true });
      if (uploadErr) { toast.error(`স্ক্রিনশট আপলোড ব্যর্থ: ${uploadErr.message}`); setFeeSubmitting(false); return; }
      const { data: urlData } = supabase.storage.from('rider-docs').getPublicUrl(path);

      const { error: updateErr } = await supabase.from('riders').update({
        registration_fee_paid: true,
        registration_fee_trx_id: trxId,
        registration_fee_screenshot_url: urlData.publicUrl,
      }).eq('id', riderId);

      if (updateErr) throw updateErr;

      notifyTelegramRiderFee({
        rider_name: form.fullName,
        rider_phone: form.phone,
        fee_type: 'registration',
        trx_id: trxId,
      });

      const waMessage = `ভাই, আমি NagarGo এর সাইটে বিকাশ এর মাধ্যমে ৫০ টাকা পরিশোধ করেছি '${senderBkash || form.bkashNumber || 'আমার'}' Number থেকে যার TrxID '${trxId}' ! অনুগ্রহ করে কনফার্ম করবেন ।`;
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waMessage)}`, '_blank');

      setSuccess(true);
      toast.success('রেজিস্ট্রেশন সম্পন্ন!');
    } catch (err: any) { toast.error(err.message || 'ফি জমা দিতে সমস্যা'); } finally { setFeeSubmitting(false); }
  }, [user, riderId, trxId, senderBkash, screenshotFile, form.fullName, form.bkashNumber, form.phone]);

  const copyBkash = () => { navigator.clipboard.writeText(BKASH_NUMBER); toast.success('bKash নম্বর কপি হয়েছে'); };

  if (success) {
    return (
      <SiteLayout>
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring' }} className="w-20 h-20 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-6 border border-primary/30">
            <Check className="w-10 h-10 text-primary" />
          </motion.div>
          <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-display), system-ui' }}>Registration Complete!</h2>
          <p className="text-muted-foreground mb-6">আপনার রাইডার আবেদন এবং রেজিস্ট্রেশন ফি জমা হয়েছে। ডকুমেন্ট যাচাই শেষে আমরা আপনাকে জানাব।</p>
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 mb-6 text-left">
            <div className="flex items-center gap-2 mb-2">
              <Check className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Application Submitted</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Check className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Payment Submitted</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Admin Review — অপেক্ষমাণ</span>
            </div>
          </div>
          <Link href="/rider/dashboard" className="inline-flex items-center gap-2 px-6 h-12 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary-bright transition-all">
            Go to Rider Dashboard
          </Link>
        </div>
      </SiteLayout>
    );
  }

  const showFeeStep = riderId !== null && step === 3;

  return (
    <SiteLayout>
      <PageHeader title="Become a Rider" subtitle="Join NagarGo and earn money delivering in your city. 80% rider earnings, flexible hours." icon={<UserPlus className="w-8 h-8 text-primary" />} />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Trust badges */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: ShieldCheck, label: 'Verified Platform' },
            { icon: Bike, label: '80% Earnings' },
            { icon: Check, label: 'Flexible Hours' },
          ].map((b, i) => (
            <motion.div key={b.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass rounded-lg p-3 border border-border/60 text-center">
              <b.icon className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-xs font-medium">{b.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-between mb-6 px-2">
          {STEPS.map((s, i) => (
            <div key={s.num} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
                  step >= s.num ? 'bg-primary text-primary-foreground border border-primary' : 'bg-secondary/40 text-muted-foreground border border-border/60'
                }`}>
                  {step > s.num ? <Check className="w-5 h-5" /> : `0${s.num}`}
                </div>
                <p className={`text-xs mt-1.5 font-medium hidden sm:block ${step >= s.num ? 'text-primary' : 'text-muted-foreground'}`}>{s.label}</p>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 rounded transition-all ${step > s.num ? 'bg-primary' : 'bg-border/60'}`} />
              )}
            </div>
          ))}
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass rounded-xl border border-border/60 p-6 space-y-4"
        >
          {/* STEP 1: Personal */}
          {step === 1 && (
            <>
              <div className="flex items-center gap-2 mb-2">
                <User className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">ব্যক্তিগত তথ্য</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field icon={User} label="Full Name *" value={form.fullName} onChange={(v) => update('fullName', v)} />
                <Field icon={Phone} label="Phone *" value={form.phone} onChange={(v) => update('phone', v)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field icon={Mail} label="Email" value={form.email} onChange={(v) => update('email', v)} />
                <Field label="Date of Birth" value={form.dob} onChange={(v) => update('dob', v)} type="date" />
              </div>
              <Field icon={IdCard} label="NID Number *" value={form.nidNumber} onChange={(v) => update('nidNumber', v)} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Emergency Contact Name *" value={form.emergencyContactName} onChange={(v) => update('emergencyContactName', v)} />
                <Field icon={Phone} label="Emergency Contact Phone *" value={form.emergencyContactPhone} onChange={(v) => update('emergencyContactPhone', v)} />
              </div>
              <FileUpload label="Profile Photo" onChange={(f) => setFiles((prev) => ({ ...prev, profilePhoto: f }))} file={files.profilePhoto} />
              <FileUpload label="NID Front" onChange={(f) => setFiles((prev) => ({ ...prev, nidFront: f }))} file={files.nidFront} />
              <FileUpload label="NID Back" onChange={(f) => setFiles((prev) => ({ ...prev, nidBack: f }))} file={files.nidBack} />
            </>
          )}

          {/* STEP 2: Rider & Service */}
          {step === 2 && (
            <>
              <div className="flex items-center gap-2 mb-2">
                <Bike className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">রাইডার ও সার্ভিস তথ্য</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <SelectField label="Vehicle Type" value={form.vehicleType} onChange={(v) => update('vehicleType', v)} options={['motorcycle', 'bicycle', 'cng', 'van']} />
                <Field label="Vehicle Number *" value={form.vehicleRegistration} onChange={(v) => update('vehicleRegistration', v)} />
              </div>
              <Field label="Driving License" value={form.drivingLicense} onChange={(v) => update('drivingLicense', v)} />

              <div className="pt-2">
                <h4 className="text-sm font-semibold text-muted-foreground mb-3">সার্ভিস এরিয়া</h4>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <SelectField label="Division *" value={form.division} onChange={(v) => update('division', v)} options={divisions.map(d => d.name)} />
                <SelectField label="District" value={form.district} onChange={(v) => update('district', v)} options={divisions.find(d => d.name === form.division)?.districts || []} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="City / Municipality" value={form.city} onChange={(v) => update('city', v)} />
                <Field label="Thana / Upazila" value={form.thana} onChange={(v) => update('thana', v)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Union" value={form.union} onChange={(v) => update('union', v)} />
                <Field label="Ward" value={form.ward} onChange={(v) => update('ward', v)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Village" value={form.village} onChange={(v) => update('village', v)} />
                <Field label="Area" value={form.area} onChange={(v) => update('area', v)} />
              </div>
              <Field label="Preferred Operating Zone" value={form.preferredZone} onChange={(v) => update('preferredZone', v)} />

              {/* GPS */}
              <div className="rounded-lg bg-secondary/30 border border-border/60 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Navigation className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold">Exact GPS Location</span>
                </div>
                {form.gpsLat && form.gpsLng ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-primary font-medium flex items-center gap-1">
                        <Check className="w-4 h-4" /> Location detected
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{form.gpsLat}, {form.gpsLng}</p>
                    </div>
                    <button onClick={detectGPS} className="text-xs text-primary hover:underline">Re-detect</button>
                  </div>
                ) : (
                  <button onClick={detectGPS} className="flex items-center gap-2 px-4 h-10 rounded-lg bg-primary/10 border border-primary/30 text-primary text-sm font-medium hover:bg-primary/20 transition-all">
                    <MapPin className="w-4 h-4" /> আমার Location চালু করুন
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="bKash Number" value={form.bkashNumber} onChange={(v) => update('bkashNumber', v)} />
              </div>
            </>
          )}

          {/* STEP 3: Verification / Payment */}
          {step === 3 && (
            <>
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">যাচাইকরণ / পেমেন্ট</h3>
              </div>

              {/* Fee summary */}
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Registration Fee</span>
                  <span className="text-lg font-bold text-primary">৳50</span>
                </div>
                <p className="text-xs text-muted-foreground">এককালীন রেজিস্ট্রেশন ফি। এছাড়া প্রতি মাস ৳50 maintenance fee।</p>
              </div>

              {/* bKash number */}
              <div className="rounded-lg bg-secondary/40 border border-border/60 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">bKash Number</span>
                  <button onClick={copyBkash} className="flex items-center gap-1 text-xs text-primary hover:underline">
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                </div>
                <p className="text-lg font-bold text-primary">{BKASH_NUMBER}</p>
                <p className="text-xs text-muted-foreground mt-1">Account Type: Personal · Method: Send Money</p>
              </div>

              {/* Instructions */}
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
                <h4 className="text-sm font-semibold mb-2 text-primary">সেন্ড মানি করার নিয়ম:</h4>
                <ol className="space-y-1.5 text-xs text-muted-foreground list-decimal list-inside leading-relaxed">
                  <li>আপনার bKash অ্যাপ ওপেন করুন</li>
                  <li>"সেন্ড মানি" সিলেক্ট করুন</li>
                  <li>{BKASH_NUMBER} নম্বরে ৫০ টাকা পাঠান</li>
                  <li>Transaction ID (TRX ID) কপি করুন</li>
                  <li>স্ক্রিনশট নিন এবং নিচে আপলোড করুন</li>
                  <li>TRX ID নিচের বক্সে লিখুন</li>
                  <li>Submit বাটনে ক্লিক করুন</li>
                </ol>
              </div>

              {/* Screenshot upload */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">পেমেন্ট স্ক্রিনশট *</label>
                <label className="block">
                  <div className="border-2 border-dashed border-border/60 rounded-lg p-6 text-center cursor-pointer hover:border-primary/40 transition-colors">
                    {screenshotFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        <span className="text-sm font-medium">{screenshotFile.name}</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Upload className="w-5 h-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">স্ক্রিনশট আপলোড করুন</span>
                      </div>
                    )}
                  </div>
                  <input type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f && f.size <= 5 * 1024 * 1024) setScreenshotFile(f);
                    else if (f) toast.error('File too large. Max 5MB.');
                  }} />
                </label>
              </div>

              {/* TRX ID */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Transaction ID (TRX ID) *</label>
                <input
                  type="text"
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value)}
                  placeholder="যেমন: 9X8K7M3N2L"
                  className="w-full px-3 h-10 rounded-md bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40"
                />
              </div>

              {/* Sender bKash */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">আপনার bKash Number</label>
                <input
                  type="text"
                  value={senderBkash}
                  onChange={(e) => setSenderBkash(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full px-3 h-10 rounded-md bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40"
                />
              </div>
            </>
          )}

          {/* Login warning */}
          {!user && (
            <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
              রাইডার আবেদন জমা দিতে <Link href="/login" className="underline font-medium">লগইন</Link> করুন।
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center gap-3 pt-4">
            {step > 1 && (
              <button onClick={prevStep} className="flex items-center gap-1 px-5 h-12 rounded-md border border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40 font-medium text-sm transition-all">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}

            {step < 3 ? (
              <button onClick={nextStep} className="flex-1 flex items-center justify-center gap-2 px-5 h-12 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary-bright transition-all">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : showFeeStep ? (
              <button
                onClick={submitFee}
                disabled={feeSubmitting || !trxId || !screenshotFile || !user}
                className="flex-1 flex items-center justify-center gap-2 px-5 h-12 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary-bright disabled:opacity-50 transition-all"
              >
                {feeSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <MessageCircle className="w-5 h-5" />}
                {feeSubmitting ? 'Submitting...' : 'Submit & Confirm via WhatsApp'}
              </button>
            ) : (
              <button
                onClick={submitApplication}
                disabled={loading || !user}
                className="flex-1 flex items-center justify-center gap-2 px-5 h-12 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary-bright disabled:opacity-50 transition-all"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                {loading ? 'Submitting...' : 'Submit Application & Pay'}
              </button>
            )}
          </div>

          {step === 3 && showFeeStep && (
            <p className="text-center text-xs text-muted-foreground">Submit করলে স্বয়ংক্রিয়ভাবে WhatsApp এ কনফার্মেশন মেসেজ পাঠানো হবে</p>
          )}
        </motion.div>
      </div>
    </SiteLayout>
  );
}

function Field({ label, value, onChange, type = 'text', icon: Icon }: { label: string; value: string; onChange: (v: string) => void; type?: string; icon?: any }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />}
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className={`w-full h-10 rounded-md bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40 ${Icon ? 'pl-8' : 'px-3'}`} />
      </div>
    </div>
  );
}
function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 h-10 rounded-md bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40 capitalize">
        <option value="">Select {label}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
function FileUpload({ label, file, onChange }: { label: string; file?: File; onChange: (f: File) => void }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</span>
      <div className="border-2 border-dashed border-border/60 rounded-lg p-4 text-center cursor-pointer hover:border-primary/40 transition-colors">
        {file ? <div className="flex items-center justify-center gap-2"><FileText className="w-5 h-5 text-primary" /><span className="text-sm font-medium">{file.name}</span></div> : <div className="flex items-center justify-center gap-2"><Upload className="w-5 h-5 text-muted-foreground" /><span className="text-sm text-muted-foreground">Upload {label}</span></div>}
      </div>
      <input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f && f.size <= 5 * 1024 * 1024) onChange(f); else if (f) toast.error('File too large. Max 5MB.'); }} />
    </label>
  );
}
