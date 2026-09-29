'use client';

import { SiteLayout } from '@/components/layout/site-layout';
import { PageHeader } from '@/components/shared/page-header';
import { Info } from 'lucide-react';

export default function AboutPage() {
  return (
    <SiteLayout>
      <PageHeader title="About NagarGo" subtitle="Smartest and Most Trusted Delivery and Riding Network of Bangladesh" icon={<Info className="w-8 h-8 text-primary" />} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 prose prose-invert prose-sm">
        <h2>Our Mission</h2>
        <p>NagarGo is on a mission to make movement smarter and life easier for everyone in Bangladesh. We connect customers with verified riders for parcel delivery, rides, and medicine express delivery — all with live tracking, OTP security, and transparent pricing.</p>

        <h2>What We Offer</h2>
        <ul>
          <li><strong>Parcel Delivery:</strong> Send packages across the city with verified riders and live tracking.</li>
          <li><strong>Ride Service:</strong> Book motorcycle rides in minutes with transparent fares.</li>
          <li><strong>Medicine Express:</strong> Upload prescriptions and get medicines delivered securely.</li>
          <li><strong>Rider Marketplace:</strong> Earn money as a verified NagarGo rider with 80% earnings.</li>
          <li><strong>Live Tracking:</strong> Every trip gets a secure, shareable tracking link.</li>
        </ul>

        <h2>Why NagarGo?</h2>
        <p>We built NagarGo with trust, speed, and security at the core. Every rider is verified, every delivery is OTP-secured, and every fare is transparent. We are expanding across all major cities in Bangladesh — from Dhaka to Rajshahi, Chattogram to Sylhet.</p>

        <h2>Our Values</h2>
        <ul>
          <li><strong>Trust:</strong> Verified riders, secure OTP, and transparent processes.</li>
          <li><strong>Speed:</strong> Fast response times and efficient dispatch.</li>
          <li><strong>Security:</strong> Hashed passwords, private document storage, and secure tracking tokens.</li>
          <li><strong>Bangladesh First:</strong> Built for Bangladesh, with local payment methods and local understanding.</li>
        </ul>

        <h2>Contact</h2>
        <p>Telegram: <a href="https://t.me/SouraksPizzaPro">@SouraksPizzaPro</a></p>
        <p>WhatsApp: <a href="https://wa.me/8801410348109">+8801410348109</a></p>

        <p className="text-muted-foreground text-xs mt-8">All Copyrights of This Website are Reserved to Sourak Jain</p>
      </div>
    </SiteLayout>
  );
}
