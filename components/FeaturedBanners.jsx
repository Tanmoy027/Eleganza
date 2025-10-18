"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"

export default function FeaturedBanners() {
    const [hoveredBanner, setHoveredBanner] = useState(null)

    const banners = [
        {
            id: "seasons",
            title: "SEASONAL COLLECTIONS",
            subtitle: "Discover styles for every season",
            image: "https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=800",
            href: "#seasons",
            cta: "SHOP SEASONS"
        },
        {
            id: "occasions",
            title: "SPECIAL OCCASIONS",
            subtitle: "Perfect outfits for every event",
            image: "https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=800",
            href: "#occasions",
            cta: "SHOP OCCASIONS"
        },
        {
            id: "new-arrivals",
            title: "NEW ARRIVALS",
            subtitle: "Latest fashion trends",
            image: "https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=800",
            href: "/products?filter=new",
            cta: "SHOP NEW"
        }
    ]

    const scrollToSection = (sectionId) => {
        if (sectionId.startsWith('#')) {
            const element = document.querySelector(sectionId)
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' })
            }
        }
    }

    return (
        <section className="py-12 md:py-16 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8 md:mb-12">
                    <p className="text-sm tracking-widest text-gray-600 mb-4">EXPLORE OUR COLLECTIONS</p>
                    <h2 className="text-2xl md:text-3xl font-light tracking-wide">DISCOVER YOUR STYLE</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    {banners.map((banner, index) => (
                        <div
                            key={banner.id}
                            className={`relative h-64 md:h-80 group cursor-pointer overflow-hidden rounded-lg transition-all duration-500 ${hoveredBanner === banner.id ? "scale-105 shadow-2xl" : "hover:scale-102 hover:shadow-xl"
                                }`}
                            onMouseEnter={() => setHoveredBanner(banner.id)}
                            onMouseLeave={() => setHoveredBanner(null)}
                            onClick={() => {
                                if (banner.href.startsWith('#')) {
                                    scrollToSection(banner.href)
                                } else {
                                    window.location.href = banner.href
                                }
                            }}
                            style={{
                                animationDelay: `${index * 0.1}s`
                            }}
                        >
                            <Image
                                src={banner.image}
                                alt={banner.title}
                                fill
                                className={`object-cover transition-transform duration-700 ${hoveredBanner === banner.id ? "scale-110" : "group-hover:scale-105"
                                    }`}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>

                            <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
                                <div className={`transform transition-all duration-500 ${hoveredBanner === banner.id ? "translate-y-0 opacity-100" : "translate-y-2 opacity-90"
                                    }`}>
                                    <p className="text-xs tracking-widest mb-2 opacity-90">{banner.subtitle}</p>
                                    <h3 className="text-xl md:text-2xl font-light tracking-wide mb-4">{banner.title}</h3>
                                    <div className={`transform transition-all duration-500 ${hoveredBanner === banner.id ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                                        }`}>
                                        <span className="inline-flex items-center bg-white text-black text-xs font-medium py-2 px-4 rounded-full hover:bg-gray-100 transition-colors">
                                            {banner.cta}
                                            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                            </svg>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Overlay effect */}
                            <div className={`absolute inset-0 transition-opacity duration-500 ${hoveredBanner === banner.id ? "opacity-100" : "opacity-0"
                                }`}>
                                <div className="absolute inset-0 bg-black/20"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
