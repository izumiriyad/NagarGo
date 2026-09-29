'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { useState } from 'react';

const faqs = [
  {
    q: 'How does NagarGo work?',
    a: 'NagarGo connects you with verified riders for parcel delivery, rides, and medicine delivery. Simply select a service, enter your pickup and drop-off locations, get a fare estimate, and confirm your order. A nearby rider will be assigned and you can track them live.',
  },
  {
    q: 'How do I send a parcel?',
    a: 'Go to Parcel Delivery, enter your pickup and drop-off details, package information, and contact numbers. You will see a fare estimate before confirming. Once assigned, track your rider live and verify delivery with OTP.',
  },
  {
    q: 'How do I book a ride?',
    a: 'Select Ride with me, enter your pickup and destination, choose ride type and passenger count. Get an instant fare estimate and confirm. Your rider will arrive at your location — track them live until you reach your destination.',
  },
  {
    q: 'How does live tracking work?',
    a: 'Every active trip gets a secure tracking link. The rider shares their GPS location in real-time, which updates every few seconds. You can share the tracking link with family or friends. Tracking stops automatically when the trip ends.',
  },
  {
    q: 'How do I become a rider?',
    a: 'Go to Become a Rider, fill out the registration form with your personal details, vehicle information, NID, and documents. Our team will review your application. Once approved, you can start accepting orders and earning.',
  },
  {
    q: 'How does bKash payment work?',
    a: 'After selecting bKash as your payment method, you will see our official bKash number. Send the required amount via Send Money, copy the Transaction ID, and submit it on the payment page. Our team will verify your payment manually.',
  },
  {
    q: 'What is Medicine Express?',
    a: 'Medicine Express lets you upload a prescription and get medicines delivered from your pharmacy. Your prescription is stored securely and privately. A verified rider will pick up and deliver your medicines.',
  },
  {
    q: 'How are fares calculated?',
    a: 'Fares are calculated server-side based on base fare, distance, service fee, and applicable surcharges. The formula is transparent and shown before you confirm. NagarGo commission is 20%, riders keep 80% by default.',
  },
  {
    q: 'Can I share my live trip?',
    a: 'Yes. During an active trip, you can copy or share the tracking link via the Web Share API or by copying the URL. The link stops working automatically after the trip ends.',
  },
  {
    q: 'How does OTP verification work?',
    a: 'OTP (One-Time Password) is used for secure pickup and delivery verification. The rider enters the OTP provided by the sender/receiver to confirm pickup and delivery. OTPs are hashed and expire after a short duration.',
  },
];

export function Faq() {
  const { t } = useI18n();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="py-20 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl font-bold"
          style={{ fontFamily: 'var(--font-display), system-ui' }}
        >
          {t('faq.title')}
        </motion.h2>
      </div>

      <div className="space-y-3">
        {faqs.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="glass rounded-lg border border-border/60 overflow-hidden"
          >
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/30 transition-colors"
            >
              <span className="font-medium text-sm sm:text-base">{f.q}</span>
              <ChevronDown
                className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`}
              />
            </button>
            <AnimatePresence>
              {open === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <p className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
