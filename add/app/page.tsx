import { SiteLayout } from '@/components/layout/site-layout';
import { Hero } from '@/components/landing/hero';
import { QuickServices } from '@/components/landing/quick-services';
import { WhyNagarGo } from '@/components/landing/why-nagargo';
import { ServiceSections } from '@/components/landing/service-sections';
import { LiveTrackingExplainer } from '@/components/landing/live-tracking';
import { BangladeshCoverage } from '@/components/landing/bangladesh-coverage';
import { TransparentPricing } from '@/components/landing/transparent-pricing';
import { PublicReviews } from '@/components/landing/public-reviews';
import { TelegramContact } from '@/components/landing/telegram-contact';
import { Faq } from '@/components/landing/faq';
import { CtaSection } from '@/components/landing/cta-section';

export default function Home() {
  return (
    <SiteLayout>
      <Hero />
      <QuickServices />
      <WhyNagarGo />
      <ServiceSections />
      <LiveTrackingExplainer />
      <BangladeshCoverage />
      <TransparentPricing />
      <PublicReviews />
      <TelegramContact />
      <Faq />
      <CtaSection />
    </SiteLayout>
  );
}
