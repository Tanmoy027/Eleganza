import Image from "next/image"
import Link from "next/link"

export default function CategoryBanner() {
  return (
    <>
      {/* Press Section */}
      <section className="py-8 md:py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs md:text-sm tracking-widest text-gray-600 mb-6 md:mb-8">AS FEATURED IN</p>
          <div className="flex justify-center items-center space-x-6 md:space-x-12 opacity-60 text-sm md:text-xl">
            <span className="font-bold">COSMOPOLITAN</span>
            <span className="font-serif">GRAZIA</span>
            <span>marie claire</span>
            <span className="font-serif italic">VOGUE</span>
          </div>
        </div>
      </section>

      {/* Category Banners */}
      <section className="py-0">
        <div className="grid grid-cols-1 md:grid-cols-3">
          <Link href="/dresses?category=mini">
            <div className="relative h-64 md:h-[500px] group cursor-pointer overflow-hidden">
              <Image
                src="https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=600"
                alt="Mini Dresses"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black bg-opacity-20 flex items-end p-6 md:p-8">
                <h3 className="text-white text-xl md:text-3xl font-light tracking-widest">SHOP MINI</h3>
              </div>
            </div>
          </Link>

          <Link href="/dresses?category=midi">
            <div className="relative h-64 md:h-[500px] group cursor-pointer overflow-hidden">
              <Image
                src="https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=600"
                alt="Midi Dresses"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black bg-opacity-20 flex items-end p-6 md:p-8">
                <h3 className="text-white text-xl md:text-3xl font-light tracking-widest">SHOP MIDI</h3>
              </div>
            </div>
          </Link>

          <Link href="/dresses?category=maxi">
            <div className="relative h-64 md:h-[500px] group cursor-pointer overflow-hidden">
              <Image
                src="https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=600"
                alt="Maxi Dresses"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black bg-opacity-20 flex items-end p-6 md:p-8">
                <h3 className="text-white text-xl md:text-3xl font-light tracking-widest">SHOP MAXI</h3>
              </div>
            </div>
          </Link>
        </div>
      </section>
    </>
  )
}
