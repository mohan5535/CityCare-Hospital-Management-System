import React from 'react';
import { Hero } from '../components/landing/Hero';
import { QuickActionPanel } from '../components/landing/QuickActionPanel';
import { FeaturedDoctors } from '../components/landing/FeaturedDoctors';
import { DepartmentGrid } from '../components/landing/DepartmentGrid';
import { ServicesSection } from '../components/landing/ServicesSection';
import { HowItWorks } from '../components/landing/HowItWorks';
import { WhyChooseUs } from '../components/landing/WhyChooseUs';
import { AISymptomChecker } from '../components/landing/AISymptomChecker';
import { Testimonials } from '../components/landing/Testimonials';
import { FinalCTA } from '../components/landing/FinalCTA';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      {/* 1. Hero with realistic photography & floating cards */}
      <Hero />

      {/* 2. Quick-Action horizontal navigation panel */}
      <QuickActionPanel />

      {/* 3. Find the Right Doctor */}
      <FeaturedDoctors />

      {/* 4. Medical Departments */}
      <DepartmentGrid />

      {/* 5. Healthcare Services */}
      <ServicesSection />

      {/* 6. How Appointment Booking Works */}
      <HowItWorks />

      {/* 7. Why Choose Us / Trust & Architecture */}
      <div id="why-us">
        <WhyChooseUs />
      </div>

      {/* 8. AI-Assisted Symptom Triage */}
      <AISymptomChecker />

      {/* 9. Patient Stories & Testimonials */}
      <Testimonials />

      {/* 10. Final High-Impact Booking CTA */}
      <FinalCTA />
    </div>
  );
}
