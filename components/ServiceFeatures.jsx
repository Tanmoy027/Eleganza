import { Truck, RotateCcw, Headphones, Shield } from "lucide-react"

export default function ServiceFeatures() {
  const features = [
    {
      icon: Truck,
      title: "SUPER FAST DELIVERY",
      description: "We use DHL, DPD & Royal Mail to fulfil our orders, so your delivery is in safe hands.",
    },
    {
      icon: RotateCcw,
      title: "EASY RETURNS",
      description:
        "We hope you find your Onoora purchase, however, if it's not quite right, our returns are simple.",
    },
    {
      icon: Headphones,
      title: "24/7 CLIENT CARE",
      description: "Our dedicated Client Care team is available 24/7 and are always on hand to help.",
    },
    {
      icon: Shield,
      title: "SECURE PAYMENTS",
      description: "We offer a wide range of payment options to suit every customer. We accept payments via Clearpay.",
    },
  ]

  return (
    <section className="py-12 md:py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center">
              <div className="flex justify-center mb-4">
                <feature.icon className="h-6 w-6 md:h-8 md:w-8 text-black" />
              </div>
              <h3 className="text-xs md:text-sm font-medium tracking-wide mb-2">{feature.title}</h3>
              <p className="text-xs md:text-sm text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
