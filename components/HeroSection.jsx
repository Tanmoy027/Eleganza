import Image from "next/image"
import Link from "next/link"

export default function HeroSection() {
  return (
    <section className="relative w-full h-screen">
      {/* Two-image hero layout */}
      <div className="flex h-full">
        {/* Left image */}
        <div className="relative w-1/2 h-full">
          <Image
            src="https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=800"
            alt="Onoora - Royal Ascot Ready - Model Close-up"
            fill
            className="object-cover"
            priority
          />
        </div>
        
        {/* Right image */}
        <div className="relative w-1/2 h-full">
          <Image
            src="https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=800"
            alt="Onoora - Royal Ascot Ready - Full Dress"
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>

      {/* Centered content overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10 px-4">
        {/* Collection text and CTA */}
        <div className="space-y-4 md:space-y-8">
          <div className="text-white text-xs md:text-sm tracking-widest">
            Races Season
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl text-white font-light tracking-widest leading-tight">
            ROYAL ASCOT READY
          </h1>
          <div className="pt-4 md:pt-8">
            <Link 
              href="/dresses" 
              className="inline-block bg-white text-black uppercase text-xs md:text-sm font-light py-3 px-8 md:px-16 hover:bg-gray-100 transition-colors"
            >
              SHOP NOW
            </Link>
          </div>
        </div>
      </div>
      
      {/* Very subtle overlay for better text visibility */}
      <div className="absolute inset-0 bg-black/20"></div>
    </section>
  )
}
