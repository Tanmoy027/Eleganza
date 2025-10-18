import Image from "next/image"
import Link from "next/link"

export default function ShopBanners() {
  const banners = [
    {
      href: "/products?category=new-arrivals",
      image: "https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=600",
      title: "NEW ARRIVALS",
      subtitle: "Fresh styles for the season",
      bgColor: "from-blue-600/20 to-purple-600/20"
    },
    {
      href: "/occasions?occasion=wedding",
      image: "https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=600",
      title: "BRIDAL COLLECTION",
      subtitle: "Elegant wedding guest attire",
      bgColor: "from-rose-600/20 to-pink-600/20"
    },
    {
      href: "/products?season=summer",
      image: "https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=600",
      title: "SUMMER STYLES",
      subtitle: "Light & breezy fashion",
      bgColor: "from-yellow-600/20 to-orange-600/20"
    }
  ]

  return (
    <section className="py-8 md:py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 md:mb-12">
          <p className="text-sm tracking-widest text-gray-600 mb-4">CURATED COLLECTIONS</p>
          <h2 className="text-2xl md:text-3xl font-light tracking-wide">EXPLORE OUR LATEST</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {banners.map((banner, index) => (
            <Link key={index} href={banner.href}>
              <div className="relative h-64 md:h-80 group cursor-pointer overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300">
                <Image
                  src={banner.image}
                  alt={banner.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${banner.bgColor} from-black/60 via-black/20 to-transparent group-hover:from-black/70 transition-all duration-300`}></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white transform group-hover:translate-y-0 transition-transform duration-300">
                  <div className="text-center">
                    <h3 className="text-xl md:text-2xl font-bold tracking-widest mb-2 group-hover:scale-105 transition-transform duration-300">
                      {banner.title}
                    </h3>
                    <p className="text-sm md:text-base opacity-90 mb-4">{banner.subtitle}</p>
                    <div className="inline-block bg-white text-black px-6 py-2 text-xs font-medium uppercase tracking-wider rounded-full group-hover:bg-black group-hover:text-white transition-all duration-300">
                      Shop Now
                    </div>
                  </div>
                </div>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
