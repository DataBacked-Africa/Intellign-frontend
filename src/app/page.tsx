import MarketingNav from "@/components/Marketing/MarketingNav";
import Hero from "@/components/Marketing/Hero";
import CapabilityStrip from "@/components/Marketing/CapabilityStrip";
import InterfaceShowcase from "@/components/Marketing/InterfaceShowcase";
import HowItWorks from "@/components/Marketing/HowItWorks";
import UseCases from "@/components/Marketing/UseCases";
import CodeSample from "@/components/Marketing/CodeSample";
import Pricing from "@/components/Marketing/Pricing";
import LaunchCta from "@/components/Marketing/LaunchCta";
import MarketingFooter from "@/components/Marketing/MarketingFooter";

export default function MarketingPage() {
  return (
    <div className="mk-page">
      <MarketingNav />
      <main>
        <Hero />
        <CapabilityStrip />
        <InterfaceShowcase />
        <HowItWorks />
        <UseCases />
        <CodeSample />
        <Pricing />
        <LaunchCta />
      </main>
      <MarketingFooter />
    </div>
  );
}
