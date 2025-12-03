"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";

export default function TestimonialsSection() {
  const testimonials = [
    {
      name: "Shweta",
      location: "Ahmedabad",
      quote:
        "Received so many compliments at the family get-together. Loved how comfortable yet festive it looked!",
      rating: 5,
    },
    {
      name: "Aarohi",
      location: "Noida",
      quote:
        "Surat Cloth House has become my one-stop shop - from workwear to casual outings to festive looks, I find everything here!",
      rating: 5,
    },
    {
      name: "Neha",
      location: "Delhi",
      quote:
        "Perfect fit & gorgeous fabric - wore it for my best friend's sangeet ceremony. Absolutely loved it!",
      rating: 5,
    },
    {
      name: "Priyanka",
      location: "Jaipur",
      quote:
        "This suit set looks amazing ❤️ Cotton fabric, lightweight and the colour combination looks stunning. It's a great purchase. Go for it ladies!",
      rating: 5,
    },
    {
      name: "Kavita",
      location: "Mumbai",
      quote:
        "Been shopping here for 2 years. The quality is exceptional and delivery is always super quick. Highly recommended!",
      rating: 5,
    },
    {
      name: "Anjali",
      location: "Surat",
      quote:
        "Customer support is helpful and products are top-notch. The kurtis fit perfectly and the fabric quality is amazing!",
      rating: 5,
    },
  ];

  const gradientColors = [
    "from-[#136C5B] to-[#0F5A4A]",
    "from-[#F47C20] to-[#E66A0F]",
    "from-[#8B5CF6] to-[#7C3AED]",
    "from-[#EC4899] to-[#DB2777]",
    "from-[#06B6D4] to-[#0891B2]",
    "from-[#10B981] to-[#059669]",
  ];

  const [api, setApi] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrentSlide(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => api.off("select", onSelect);
  }, [api]);

  if (!testimonials || testimonials.length === 0) {
    return null;
  }

  return (
    <section className="py-5 md:py-8 bg-gradient-to-b from-gray-50 to-white relative w-full">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-5 md:mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Customer Reviews
          </h2>
          <div className="w-20 h-1 bg-[#F47C20] mx-auto"></div>
        </div>
        <div className="relative max-w-7xl mx-auto">
          <Carousel
            setApi={setApi}
            opts={{
              align: "start",
              loop: true,
              slidesToScroll: 1,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {testimonials.map((testimonial, index) => (
                <CarouselItem
                  key={`testimonial-${index}`}
                  className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3"
                >
                  <div className="relative h-full min-h-[300px] rounded-2xl overflow-hidden shadow-xl group cursor-pointer bg-white border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                    {/* Gradient Background */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${
                        gradientColors[index % gradientColors.length]
                      } opacity-5 group-hover:opacity-10 transition-opacity duration-300`}
                    ></div>

                    {/* Content */}
                    <div className="relative h-full flex flex-col p-6 md:p-8">
                      {/* Quote Icon */}
                      <div className="mb-4">
                        <svg
                          className={`w-12 h-12 text-transparent bg-gradient-to-br ${
                            gradientColors[index % gradientColors.length]
                          } bg-clip-text`}
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.996 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.432.917-3.995 3.638-3.995 5.849h3.983v10h-9.983z" />
                        </svg>
                      </div>

                      {/* Quote Text */}
                      <p className="text-gray-700 text-sm md:text-base font-medium leading-relaxed mb-6 flex-grow">
                        &ldquo;{testimonial.quote}&rdquo;
                      </p>

                      {/* Star Rating */}
                      <div className="flex items-center gap-1 mb-6">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className="w-4 h-4 md:w-5 md:h-5 text-[#F47C20] fill-[#F47C20]"
                          />
                        ))}
                      </div>

                      {/* Customer Info */}
                      <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                        <div
                          className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center bg-gradient-to-br ${
                            gradientColors[index % gradientColors.length]
                          } text-white font-bold text-lg md:text-xl shadow-lg`}
                        >
                          {testimonial.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-gray-900 font-bold text-sm md:text-base">
                            {testimonial.name}
                          </h3>
                          <p className="text-gray-500 text-xs md:text-sm">
                            {testimonial.location}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white border-2 border-gray-200 shadow-lg w-10 h-10 md:w-12 md:h-12" />
            <CarouselNext className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white border-2 border-gray-200 shadow-lg w-10 h-10 md:w-12 md:h-12" />
          </Carousel>

          {/* Pagination Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, index) => (
              <button
                key={`dot-${index}`}
                onClick={() => api?.scrollTo(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? "bg-[#136C5B] w-8"
                    : "bg-gray-300 hover:bg-gray-400 w-2"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
