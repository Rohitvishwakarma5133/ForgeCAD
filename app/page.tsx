import Hero from '@/components/home/Hero';
import ProblemStatement from '@/components/home/ProblemStatement';
import Features from '@/components/home/Features';
import HowItWorks from '@/components/home/HowItWorks';
import Industries from '@/components/home/Industries';
import CTA from '@/components/home/CTA';

export default function Home() {
  return (
    <div className="min-h-screen">
      <Hero />
      <ProblemStatement />
      <HowItWorks />
      <Features />
      <Industries />
      <CTA />
    </div>
  );
}
