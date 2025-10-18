"use client"

import React from 'react';
import HeroSection from '../components/HeroSection';
import FeaturedBanners from '../components/FeaturedBanners';
import NewInSection from '../components/NewInSection';
import OccasionSection from '../components/OccasionSection';
import SeasonSection from '../components/SeasonSection';
import ShopBanners from '../components/ShopBanners';
import ServiceFeatures from '../components/ServiceFeatures';
import TestimonialSlider from '../components/TestimonialSlider';
import CraftsmanshipSection from '../components/CraftsmanshipSection';
import ClientOnly from '../components/client-only';

export default function Home() {
    return (
        <main>
            <HeroSection />
            <FeaturedBanners />
            <ClientOnly>
                <NewInSection />
            </ClientOnly>
            <ClientOnly>
                <SeasonSection />
            </ClientOnly>
            <ClientOnly>
                <OccasionSection />
            </ClientOnly>
            <CraftsmanshipSection />
            <ServiceFeatures />
            <TestimonialSlider />
        </main>
    );
}
