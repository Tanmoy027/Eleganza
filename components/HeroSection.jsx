import Image from "next/image"
import Link from "next/link"

export default function HeroSection() {
  return (
    <section className="relative w-full h-screen overflow-hidden">
      {/* Two-image hero layout */}
      <div className="flex h-full">
        {/* Left image */}
        <div className="relative w-1/2 h-full">
          <Image
            src="https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=800"
            alt="Eleganza - Royal Ascot Ready - Model Close-up"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Right image */}
        <div className="relative w-1/2 h-full">
          <Image
            src="https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=800"
            alt="Eleganza - Royal Ascot Ready - Full Dress"
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>

      {/* Animated background overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20"></div>

      {/* Centered content overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10 px-4">
        {/* Collection text and CTA */}
        <div className="space-y-4 md:space-y-8">
          <div className="text-white text-xs md:text-sm tracking-[0.3em] font-light opacity-0 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            RACES SEASON COLLECTION
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-8xl text-white font-extralight tracking-[0.2em] leading-tight opacity-0 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            ROYAL ASCOT
            <br />
            <span className="font-light">READY</span>
          </h1>
          <div className="pt-6 md:pt-10 opacity-0 animate-slide-up" style={{ animationDelay: '0.6s' }}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/dresses"
                className="group inline-flex items-center bg-white text-black uppercase text-xs md:text-sm font-medium py-4 px-10 md:px-16 hover:bg-black hover:text-white transition-all duration-300 transform hover:scale-105 shadow-xl"
              >
                <span>SHOP COLLECTION</span>
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/occasions?occasion=wedding"
                className="group inline-flex items-center border-2 border-white text-white uppercase text-xs md:text-sm font-medium py-4 px-10 md:px-16 hover:bg-white hover:text-black transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
              >
                <span>WEDDING GUEST</span>
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white opacity-70 animate-bounce">
        <div className="flex flex-col items-center">
          <span className="text-xs tracking-widest mb-2">SCROLL</span>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </section>
  )
}
