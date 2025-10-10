import { Facebook, Instagram, Twitter, Youtube, Mail, Phone, MapPin } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-black text-white">
      {/* USP Section - 4 key features */}
      <div className="container mx-auto px-4 py-6 md:py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 text-center border-b border-gray-800">
        <div className="space-y-2">
          <h3 className="text-xs uppercase tracking-wider">SUPER FAST DELIVERY</h3>
          <p className="text-xs text-gray-400">
            We use DPD, DHL & Royal Mail to fulfill your orders, so your delivery is safe and fast
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs uppercase tracking-wider">EASY RETURNS</h3>
          <p className="text-xs text-gray-400">
            We make sure your post-sale is as smooth as possible, however if it's not quite right, returning is simple
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs uppercase tracking-wider">24/7 CUSTOMER CARE</h3>
          <p className="text-xs text-gray-400">
            Our dedicated Customer Care team is just one call away and always on hand to help
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs uppercase tracking-wider">SECURE PAYMENTS</h3>
          <p className="text-xs text-gray-400">
            We offer a wide range of payment options to suit every customer. We accept all major credit cards, Apple Pay,
            PayPal, Amazon & Klarna
          </p>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-8 md:py-10 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
        {/* Subscribe section */}
        <div className="space-y-4">
          <h3 className="text-xs uppercase font-medium tracking-wider">SUBSCRIBE TO UPDATES</h3>
          <p className="text-xs text-gray-400">
            Subscribe to receive email updates, access to exclusive vouchers, and more.
          </p>
          <div className="flex">
            <input
              type="email"
              placeholder="Email"
              className="flex-1 py-3 px-4 bg-transparent border border-gray-700 text-white text-xs"
            />
            <button className="bg-white text-black px-4 md:px-5 py-3 text-xs uppercase font-medium hover:bg-gray-100 transition-colors">
              Subscribe
            </button>
          </div>
        </div>

        {/* Information links */}
        <div className="space-y-4">
          <h3 className="text-xs uppercase font-medium tracking-wider">INFORMATION</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <ul className="space-y-2 text-xs text-gray-400">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Contact / Store Care
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Delivery & Shipping
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Returns & Exchanges
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Terms & Conditions of Use
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Klarna FAQ
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Payment Portal
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Rewards Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Size Guide
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Website Terms of Service
                </a>
              </li>
            </ul>
            <ul className="space-y-2 text-xs text-gray-400">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Security & Protection
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Cookie Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Gift Cards
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Data Protection Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Store Reviews Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  The Team
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Shop links */}
        <div className="space-y-4">
          <h3 className="text-xs uppercase font-medium tracking-wider">SHOP</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <ul className="space-y-2 text-xs text-gray-400">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  New In
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Dresses
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Clothing
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Occasionwear
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Wedding Guest Dresses
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Evening Guest Dresses
                </a>
              </li>
            </ul>
            <ul className="space-y-2 text-xs text-gray-400">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Follow and Join Our Socials
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Work With Onoora
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Birthday Party Dresses
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Black Tie Dresses
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gray-800 py-4 md:py-6 text-xs text-gray-400 text-center">
        Onoora © ALL RIGHTS RESERVED
      </div>
    </footer>
  )
}
