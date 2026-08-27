import { LandingPage } from "@/components/LandingPage";
import { HomeJsonLd } from "@/components/HomeJsonLd";
import { getSiteMode } from "@/lib/siteMode";

export default function Home() {
  return (
    <>
      <HomeJsonLd />
      <LandingPage siteMode={getSiteMode()} />
    </>
  );
}
