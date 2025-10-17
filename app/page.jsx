import React from 'react';
import HeroSection from '../components/HeroSection';
import NewInSection from '../components/NewInSection';
import OccasionSection from '../components/OccasionSection';
import ShopBanners from '../components/ShopBanners';
import ImageGrid from '../components/ImageGrid';
import ServiceFeatures from '../components/ServiceFeatures';
import TestimonialSlider from '../components/TestimonialSlider';
import CraftsmanshipSection from '../components/CraftsmanshipSection';
import ClientOnly from '../components/client-only';

export default function Home() {
    return (
        <main>
            <HeroSection />
            <ClientOnly>
                <NewInSection />
            </ClientOnly>
            <ClientOnly>
                <OccasionSection />
            </ClientOnly>
            <ShopBanners />

            <CraftsmanshipSection />
            <ServiceFeatures />
            <TestimonialSlider />
        </main>
    );
}
