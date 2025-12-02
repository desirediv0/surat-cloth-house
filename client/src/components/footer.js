"use client";

import Link from "next/link";
import {
  Instagram,
  MapPin,
  Truck,
  Shield,
  CreditCard,
  CheckCircle,
  Mail,
} from "lucide-react";
import Image from "next/image";

export function Footer() {
  return (
    <footer>
      {/* Top Feature Section - Modern minimal style */}
      <div className="bg-gray-50 py-12 border-t border-gray-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Truck className="h-6 w-6" />,
                title: "Free Shipping",
                description: "On orders above ₹999",
              },
              {
                icon: <Shield className="h-6 w-6" />,
                title: "Secure Payment",
                description: "100% secure transaction",
              },
              {
                icon: <CreditCard className="h-6 w-6" />,
                title: "Easy Returns",
                description: "30-day return policy",
              },
              {
                icon: <CheckCircle className="h-6 w-6" />,
                title: "Quality Guaranteed",
                description: "Premium women's fashion",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="flex flex-col items-center text-center space-y-3"
              >
                <div className="text-[#166454]">{feature.icon}</div>
                <div>
                  <h3 className="font-semibold text-base text-gray-900 mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer - Modern minimal style */}
      <div className="bg-black py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-12">
            {/* Column 1 - About */}
            <div className="lg:col-span-1">
              <div className="mb-6">
                <Link href="/" className="flex items-center">
                  <Image
                    src="/logo.png"
                    alt="Surat Cloth House"
                    width={120}
                    height={50}
                  />
                </Link>
              </div>
              <p className="text-white/70 mb-6 text-sm leading-relaxed">
                Premium women&apos;s fashion at Surat Cloth House. Discover
                elegant Kurtis, Suits, Sarees, Western wear, and more. Your
                one-stop destination for stylish women&apos;s clothing.
              </p>

              {/* Social media icons */}
              <div className="flex space-x-3">
                {[
                  {
                    icon: <Instagram size={18} />,
                    href: "https://www.instagram.com/genuinenutrition.official",
                  },
                ].map((social, idx) => (
                  <Link
                    key={idx}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/10 hover:bg-[#166454] p-2.5 rounded-full text-white transition-all duration-300"
                  >
                    {social.icon}
                  </Link>
                ))}
              </div>
            </div>

            {/* Column 2 - Shop */}
            <div>
              <h3 className="text-white font-semibold text-base mb-5 uppercase tracking-wide">
                Shop
              </h3>
              <ul className="space-y-3">
                {[
                  { label: "All Products", href: "/products" },
                  { label: "Kurtis", href: "/products?productType=kurtis" },
                  { label: "Suits", href: "/products?productType=suits" },
                  { label: "Sarees", href: "/products?productType=sarees" },
                  { label: "Western", href: "/products?productType=western" },
                  { label: "New Arrivals", href: "/products?productType=new" },
                ].map((link, idx) => (
                  <li key={idx}>
                    <Link
                      href={link.href}
                      className="text-white/70 hover:text-[#166454] transition-colors duration-300 block text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3 - Help */}
            <div>
              <h3 className="text-white font-semibold text-base mb-5 uppercase tracking-wide">
                Customer Care
              </h3>
              <ul className="space-y-3">
                {[
                  { label: "Contact Us", href: "/contact" },
                  { label: "FAQ", href: "/faqs" },
                  { label: "Shipping Policy", href: "/shipping-policy" },
                  { label: "Returns & Refunds", href: "/refund-policy" },
                  { label: "Terms & Conditions", href: "/terms-conditions" },
                  { label: "Privacy Policy", href: "/privacy-policy" },
                ].map((link, idx) => (
                  <li key={idx}>
                    <Link
                      href={link.href}
                      className="text-white/70 hover:text-[#166454] transition-colors duration-300 block text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4 - Contact Info */}
            <div>
              <h3 className="text-white font-semibold text-base mb-5 uppercase tracking-wide">
                Contact
              </h3>
              <div className="space-y-4 text-white/70 text-sm">
                <div className="flex items-start">
                  <MapPin
                    size={18}
                    className="text-white mr-3 mt-0.5 flex-shrink-0"
                  />
                  <span>89/2 Sector 39, Gurugram, Haryana</span>
                </div>

                <div className="flex items-center">
                  <Mail size={18} className="text-white mr-3 flex-shrink-0" />
                  <span>connect.genuinenutrition@gmail.com</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="bg-black border-t border-white/10 py-6">
        <div className="container mx-auto px-4">
          <p className="text-white/60 text-center text-sm">
            © {new Date().getFullYear()} All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
