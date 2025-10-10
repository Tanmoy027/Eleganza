import Image from "next/image"
import Link from "next/link"

export default function ShopBanners() {
  return (
    <section className="py-0">
      <div className="grid grid-cols-1 md:grid-cols-3">
        <Link href="/dresses">
          <div className="relative h-48 md:h-80 group cursor-pointer overflow-hidden">
            <Image
              src="https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=600"
              alt="Shop New"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
              <h3 className="text-white text-xl md:text-2xl font-light tracking-widest">SHOP NEW</h3>
            </div>
          </div>
        </Link>

        <Link href="/occasions">
          <div className="relative h-48 md:h-80 group cursor-pointer overflow-hidden">
            <Image
              src="https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=600"
              alt="Shop Bridal"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
              <h3 className="text-white text-xl md:text-2xl font-light tracking-widest">SHOP BRIDAL</h3>
            </div>
          </div>
        </Link>

        <Link href="/clothing">
          <div className="relative h-48 md:h-80 group cursor-pointer overflow-hidden">
            <Image
              src="https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=600"
              alt="Shop Summer"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
              <h3 className="text-white text-xl md:text-2xl font-light tracking-widest">SHOP SUMMER</h3>
            </div>
          </div>
        </Link>
      </div>
    </section>
  )
}
