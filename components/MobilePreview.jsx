import Image from "next/image"

export default function MobilePreview() {
  return (
    <section className="py-12 md:py-16 bg-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="space-y-6 text-center lg:text-left">
            <h2 className="text-3xl md:text-4xl font-light tracking-wide">
              FASHION
              <br />
              AT YOUR
              <br />
              FINGERTIPS
            </h2>
          </div>

          <div className="relative flex justify-center">
            <div className="relative">
              <Image
                src="https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=300"
                alt="Mobile App Preview"
                width={250}
                height={500}
                className="rounded-3xl shadow-2xl"
              />
              <div className="absolute -right-4 md:-right-8 top-16 md:top-20">
                <Image
                  src="https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=200"
                  alt="Mobile App Preview 2"
                  width={150}
                  height={300}
                  className="rounded-2xl shadow-xl"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
