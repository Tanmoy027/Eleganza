export default function TestimonialSlider() {
  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <blockquote className="text-base md:text-lg text-gray-700 mb-6 leading-relaxed">
          "I have bought a beautiful dress from Onoora the quality of the dresses is outstanding. The customer
          service is excellent always there to help. I would definitely recommend using."
        </blockquote>
        <cite className="text-sm font-medium text-gray-900">- Raj Laker</cite>

        {/* Dots indicator */}
        <div className="flex justify-center space-x-2 mt-8">
          <div className="w-2 h-2 bg-black rounded-full"></div>
          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
        </div>
      </div>
    </section>
  )
}
