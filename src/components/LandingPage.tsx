"use client";

import { useCallback, useState } from "react";
import { Benefits } from "@/components/Benefits";
import { Calculator } from "@/components/Calculator";
import { CustomerValue } from "@/components/CustomerValue";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { HouseProjects } from "@/components/HouseProjects";
import { LeadForm } from "@/components/LeadForm";
import { Portfolio } from "@/components/Portfolio";
import { WorkSteps } from "@/components/WorkSteps";
import type { CalculatorValues } from "@/lib/types";

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

type LandingPageProps = {
  siteMode: "demo" | "production";
};

export function LandingPage({ siteMode }: LandingPageProps) {
  const [calculatorValues, setCalculatorValues] = useState<CalculatorValues | null>(
    null,
  );
  const [calculatorSeed, setCalculatorSeed] = useState(0);
  const [calculatorPreset, setCalculatorPreset] = useState<
    Partial<CalculatorValues> | undefined
  >(undefined);

  const goToCalculator = useCallback(() => {
    scrollToId("calculator");
  }, []);

  const applyCalculator = useCallback((values: CalculatorValues) => {
    setCalculatorValues(values);
    window.setTimeout(() => scrollToId("contact"), 50);
  }, []);

  const requestQuoteFromProject = useCallback((preset: Partial<CalculatorValues>) => {
    setCalculatorPreset(preset);
    setCalculatorSeed((n) => n + 1);
    window.setTimeout(() => scrollToId("calculator"), 50);
  }, []);

  return (
    <>
      <Header onCalcClick={goToCalculator} />
      <main>
        <Hero onCalcClick={goToCalculator} />
        <Benefits />
        <HouseProjects onRequestQuote={requestQuoteFromProject} />
        <WorkSteps />
        <Calculator
          key={calculatorSeed}
          initial={calculatorPreset}
          onSubmit={applyCalculator}
        />
        <Portfolio />
        <CustomerValue />
        <LeadForm calculatorValues={calculatorValues} siteMode={siteMode} />
      </main>
      <Footer siteMode={siteMode} />
    </>
  );
}
