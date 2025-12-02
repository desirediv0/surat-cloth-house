"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { fetchApi, fetchProductsByType } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { motion } from "framer-motion";
import BenefitsSec from "@/components/benifit-sec";

import { useRouter } from "next/navigation";
import { bg1, bg1sm, bg2, bg2sm, bg3, bg3sm, bg4, bg4sm } from "@/assets";
import SupplementStoreUI from "@/components/SupplementStoreUI";
import CategoryGrid from "@/components/CategoryGrid";
import BrandCarousel from "@/components/BrandCarousel";
import ProducCard from "@/components/ProducCard";

const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [api, setApi] = useState(null);
  const [autoplay, setAutoplay] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const router = useRouter();

  const slides = [
    {
      ctaLink: "/products",
      img: bg1,
      smimg: bg1sm,
      title: "Fashion Collection",
      subtitle: "Style That Defines You",
    },
    {
      ctaLink: "/products",
      img: bg2,
      smimg: bg2sm,
      title: "New Arrivals",
      subtitle: "Latest Trends in Fashion",
    },
    {
      ctaLink: "/products",
      img: bg3,
      smimg: bg3sm,
      title: "Premium Collection",
      subtitle: "Luxury Meets Comfort",
    },
    {
      ctaLink: "/products",
      img: bg4,
      smimg: bg4sm,
      title: "Summer Collection",
      subtitle: "Stay Cool & Stylish",
    },
  ];

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Handle autoplay functionality
  useEffect(() => {
    if (!api || !autoplay) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [api, autoplay]);

  // Update current slide index when carousel changes
  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setCurrentSlide(api.selectedScrollSnap());
    };

    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  const handleSlideClick = (ctaLink) => {
    router.push(ctaLink);
  };

  return (
    <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
      {/* Mobile: Smaller height, Desktop: Larger height */}
      <div className="relative overflow-hidden w-full">
        <Carousel
          setApi={setApi}
          className="w-full"
          opts={{
            loop: true,
            align: "start",
          }}
        >
          <CarouselContent className="-ml-0">
            {slides.map((slide, index) => (
              <CarouselItem key={index} className="pl-0 basis-full">
                <div
                  className="relative aspect-[9/16] md:aspect-[16/9] w-full cursor-pointer group overflow-hidden"
                  onClick={() => handleSlideClick(slide.ctaLink)}
                >
                  {/* Background Image */}
                  <Image
                    src={isMobile ? slide.smimg : slide.img}
                    alt={slide.title || "Hero banner"}
                    fill
                    priority={index === 0}
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="100vw"
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Navigation Controls - Better positioned and sized */}
          <CarouselPrevious className="absolute left-2 sm:left-4 top-1/2 hidden md:flex -translate-y-1/2 h-4 w-4 sm:h-10 sm:w-10 md:h-12 md:w-12 z-30 bg-white/10 hover:bg-white/20 border-white/20 text-white backdrop-blur-sm" />
          <CarouselNext className="absolute right-2 sm:right-4 top-1/2 hidden md:flex -translate-y-1/2 h-4 w-4 sm:h-10 sm:w-10 md:h-12 md:w-12 z-30 bg-white/10 hover:bg-white/20 border-white/20 text-white backdrop-blur-sm" />

          {/* Dot Indicators - Better responsive sizing */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex space-x-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => api?.scrollTo(index)}
                className={`w-2 h-2  rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? "bg-white scale-125 shadow-lg"
                    : "bg-white/50 hover:bg-white/70"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Autoplay Toggle - Better positioned */}
          <div className="absolute top-4 right-4 z-30  hidden md:flex">
            <Button
              variant="outline"
              size="sm"
              className="h-5 w-5  bg-white/10 hover:bg-white/20 border-white/20 text-white backdrop-blur-sm"
              onClick={() => setAutoplay(!autoplay)}
              aria-label={autoplay ? "Pause slideshow" : "Play slideshow"}
            >
              {autoplay ? (
                <div className="w-2 h-2 flex space-x-0.5">
                  <div className="w-1 h-full bg-current"></div>
                  <div className="w-1 h-full bg-current"></div>
                </div>
              ) : (
                <div className="w-0 h-0 border-t-[4px] sm:border-t-[6px] border-t-transparent border-b-[4px] sm:border-b-[6px] border-b-transparent border-l-[6px] sm:border-l-[8px] border-l-current ml-0.5"></div>
              )}
            </Button>
          </div>
        </Carousel>
      </div>
    </div>
  );
};

// Announcement Banner
const AnnouncementBanner = () => {
  return (
    <div className="bg-primary/10 py-2 md:py-4 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-center">
          <div className="flex items-center">
            <span className="text-xs md:text-base font-medium">
              ⚡ Spend ₹999 or more and unlock a scratch card – win exciting
              goodies!
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const FeaturedProducts = ({
  products = [],
  isLoading = false,
  error = null,
}) => {
  const [api, setApi] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setCurrentSlide(api.selectedScrollSnap());
    };

    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {[...Array(8)].map((_, index) => (
          <ProductSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Failed to load products</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No products found</p>
      </div>
    );
  }

  return (
    <>
      <div className="relative">
        <Carousel
          setApi={setApi}
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {products.map((product, index) => (
              <CarouselItem
                key={product.id || product.slug || index}
                className="pl-4 basis-1/2 md:basis-1/4 lg:basis-1/6 py-5 md:py-6"
              >
                <ProducCard product={product} />
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Navigation Controls */}
          <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 sm:h-10 sm:w-10 bg-white/90 hover:bg-white hover:text-black border-gray-200 text-gray-700 shadow-lg" />
          <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 sm:h-10 sm:w-10 bg-white/90 hover:bg-white hover:text-black border-gray-200 text-gray-700 shadow-lg" />
        </Carousel>
      </div>

      <div className="text-center mt-2">
        <Link href="/products">
          <Button
            variant="outline"
            size="lg"
            className="font-medium border-primary text-primary hover:bg-primary hover:text-white group rounded-full"
          >
            View All Products
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
          </Button>
        </Link>
      </div>
    </>
  );
};

const TestimonialsSection = () => {
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

  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-gray-50 to-white relative">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-10 md:mb-12">
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
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {testimonials.map((testimonial, index) => (
                <CarouselItem
                  key={index}
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
                        "{testimonial.quote}"
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
                key={index}
                onClick={() => api?.scrollTo(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? "bg-[#136C5B] w-8"
                    : "bg-gray-300 hover:bg-gray-400"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const NewsletterSection = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      console.log(`Subscribed with: ${email}`);
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 5000);
      setEmail("");
    }
  };

  return (
    <section className="relative py-10 md:py-12 overflow-hidden">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 to-black/90 z-10" />
        <Image
          src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1500"
          alt="Fitness background"
          fill
          className="object-cover object-center"
          priority
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-md p-10 rounded-2xl border border-white/20 shadow-xl">
            <div className="flex flex-col md:flex-row gap-10 items-center">
              {/* Left content */}
              <div className="w-full md:w-1/2 text-white">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                  JOIN OUR <span className="text-gray-400">FASHION</span>{" "}
                  COMMUNITY
                </h2>

                <p className="text-gray-300 mb-5">
                  Get exclusive fashion trends, style tips, and special offers
                  straight to your inbox.
                </p>

                <div className="flex flex-col gap-2 md:gap-4 mb-3 md:mb-6">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center mr-4">
                      <div className="h-6 w-6 text-primary">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                        </svg>
                      </div>
                    </div>
                    <span className="text-sm">Weekly fashion newsletter</span>
                  </div>

                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center mr-4">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-primary"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 7h-9"></path>
                        <path d="M14 17H5"></path>
                        <circle cx="17" cy="17" r="3"></circle>
                        <circle cx="7" cy="7" r="3"></circle>
                      </svg>
                    </div>
                    <span className="text-sm">Personalized workout plans</span>
                  </div>

                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center mr-4">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-primary"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
                      </svg>
                    </div>
                    <span className="text-sm">
                      Exclusive discounts & offers
                    </span>
                  </div>
                </div>
              </div>

              {/* Right form */}
              <div className="w-full md:w-1/2 bg-white p-6 rounded-xl shadow-lg">
                {subscribed ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-10"
                  >
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8 text-green-600"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6L9 17l-5-5"></path>
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Thank You for Subscribing!
                    </h3>
                    <p className="text-gray-600">
                      Check your inbox for a welcome message and a special
                      discount code.
                    </p>
                  </motion.div>
                ) : (
                  <>
                    <h3 className="text-xl font-bold text-gray-900 mb-6">
                      Subscribe to Our Newsletter
                    </h3>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-4">
                        <div>
                          <label
                            htmlFor="email"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Your Email
                          </label>
                          <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="john@example.com"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            required
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="submit"
                          className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-300 flex items-center justify-center"
                        >
                          Subscribe Now
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 ml-2"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M5 12h14M12 5l7 7-7 7"></path>
                          </svg>
                        </motion.button>
                      </div>

                      <p className="text-xs text-gray-500 text-center mt-4">
                        By subscribing, you agree to our Privacy Policy and
                        consent to receive updates from our company.
                      </p>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const ProductSkeleton = () => (
  <div className="bg-white rounded-lg overflow-hidden shadow-sm animate-pulse">
    <div className="aspect-square bg-gray-200"></div>
    <div className="p-4">
      <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded mb-4 w-1/2"></div>
      <div className="h-8 bg-gray-200 rounded w-full"></div>
    </div>
  </div>
);

// Home page component
export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [bestsellerProducts, setBestsellerProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [newProducts, setNewProducts] = useState([]);
  // Clothing Categories
  const [mensProducts, setMensProducts] = useState([]);
  const [womensProducts, setWomensProducts] = useState([]);
  const [kidsProducts, setKidsProducts] = useState([]);
  const [accessoriesProducts, setAccessoriesProducts] = useState([]);
  const [footwearProducts, setFootwearProducts] = useState([]);
  const [bagsProducts, setBagsProducts] = useState([]);
  // Special Collections
  const [saleProducts, setSaleProducts] = useState([]);
  const [premiumProducts, setPremiumProducts] = useState([]);
  const [comboProducts, setComboProducts] = useState([]);
  const [giftProducts, setGiftProducts] = useState([]);
  // Seasonal & Occasions
  const [summerProducts, setSummerProducts] = useState([]);
  const [winterProducts, setWinterProducts] = useState([]);
  const [partyProducts, setPartyProducts] = useState([]);
  const [casualProducts, setCasualProducts] = useState([]);
  const [formalProducts, setFormalProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch products by different types
    const fetchData = async () => {
      try {
        setProductsLoading(true);

        const [
          featuredRes,
          bestsellerRes,
          trendingRes,
          newRes,
          // Clothing Categories
          mensRes,
          womensRes,
          kidsRes,
          accessoriesRes,
          footwearRes,
          bagsRes,
          // Special Collections
          saleRes,
          premiumRes,
          comboRes,
          giftRes,
          // Seasonal & Occasions
          summerRes,
          winterRes,
          partyRes,
          casualRes,
          formalRes,
        ] = await Promise.allSettled([
          fetchProductsByType("featured", 8),
          fetchProductsByType("bestseller", 8),
          fetchProductsByType("trending", 8),
          fetchProductsByType("new", 8),
          // Clothing Categories
          fetchProductsByType("mens", 8),
          fetchProductsByType("womens", 8),
          fetchProductsByType("kids", 8),
          fetchProductsByType("accessories", 8),
          fetchProductsByType("footwear", 8),
          fetchProductsByType("bags", 8),
          // Special Collections
          fetchProductsByType("sale", 8),
          fetchProductsByType("premium", 8),
          fetchProductsByType("combo", 8),
          fetchProductsByType("gift", 8),
          // Seasonal & Occasions
          fetchProductsByType("summer", 8),
          fetchProductsByType("winter", 8),
          fetchProductsByType("party", 8),
          fetchProductsByType("casual", 8),
          fetchProductsByType("formal", 8),
        ]);

        // Set featured products (fallback to regular featured if type doesn't exist)
        if (featuredRes.status === "fulfilled") {
          setFeaturedProducts(featuredRes.value?.data?.products || []);
        } else {
          // Fallback to regular featured products
          const fallbackRes = await fetchApi(
            "/public/products?featured=true&limit=8"
          );
          setFeaturedProducts(fallbackRes?.data?.products || []);
        }

        // Set bestseller products
        if (bestsellerRes.status === "fulfilled") {
          setBestsellerProducts(bestsellerRes.value?.data?.products || []);
        }

        // Set trending products
        if (trendingRes.status === "fulfilled") {
          setTrendingProducts(trendingRes.value?.data?.products || []);
        }

        // Set new products
        if (newRes.status === "fulfilled") {
          setNewProducts(newRes.value?.data?.products || []);
        }

        // Clothing Categories
        if (mensRes.status === "fulfilled") {
          setMensProducts(mensRes.value?.data?.products || []);
        }

        if (womensRes.status === "fulfilled") {
          setWomensProducts(womensRes.value?.data?.products || []);
        }

        if (kidsRes.status === "fulfilled") {
          setKidsProducts(kidsRes.value?.data?.products || []);
        }

        if (accessoriesRes.status === "fulfilled") {
          setAccessoriesProducts(accessoriesRes.value?.data?.products || []);
        }

        if (footwearRes.status === "fulfilled") {
          setFootwearProducts(footwearRes.value?.data?.products || []);
        }

        if (bagsRes.status === "fulfilled") {
          setBagsProducts(bagsRes.value?.data?.products || []);
        }

        // Special Collections
        if (saleRes.status === "fulfilled") {
          setSaleProducts(saleRes.value?.data?.products || []);
        }

        if (premiumRes.status === "fulfilled") {
          setPremiumProducts(premiumRes.value?.data?.products || []);
        }

        if (comboRes.status === "fulfilled") {
          setComboProducts(comboRes.value?.data?.products || []);
        }

        if (giftRes.status === "fulfilled") {
          setGiftProducts(giftRes.value?.data?.products || []);
        }

        // Seasonal & Occasions
        if (summerRes.status === "fulfilled") {
          setSummerProducts(summerRes.value?.data?.products || []);
        }

        if (winterRes.status === "fulfilled") {
          setWinterProducts(winterRes.value?.data?.products || []);
        }

        if (partyRes.status === "fulfilled") {
          setPartyProducts(partyRes.value?.data?.products || []);
        }

        if (casualRes.status === "fulfilled") {
          setCasualProducts(casualRes.value?.data?.products || []);
        }

        if (formalRes.status === "fulfilled") {
          setFormalProducts(formalRes.value?.data?.products || []);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err?.message || "Failed to fetch data");
      } finally {
        setProductsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="w-full">
      {/* <CategoriesCarousel /> */}
      <div className="w-full overflow-hidden">
        <HeroCarousel />
      </div>
      <AnnouncementBanner />

      {/* TOP BRANDS */}
      <BrandCarousel tag="TOP" title="TOP BRANDS" />

      {/* FEATURED PRODUCTS */}
      {featuredProducts.length > 0 && (
        <section className="py-12 md:py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-light tracking-wide mb-3 text-gray-900">
                Featured Products
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto text-sm">
                Discover our curated selection of premium fashion
              </p>
            </div>

            <FeaturedProducts
              products={featuredProducts}
              isLoading={productsLoading}
              error={error}
            />
          </div>
        </section>
      )}

      <SupplementStoreUI />

      {/* NEW BRANDS */}
      <BrandCarousel tag="NEW" title="NEW BRANDS" />

      <CategoryGrid />

      {/* BEST SELLERS */}
      {bestsellerProducts.length > 0 && (
        <section className="py-12 md:py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-light tracking-wide mb-3 text-gray-900">
                Best Sellers
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto text-sm">
                Our most popular products loved by customers
              </p>
            </div>

            <FeaturedProducts
              products={bestsellerProducts}
              isLoading={productsLoading}
              error={error}
            />
          </div>
        </section>
      )}

      {/* TRENDING */}
      {trendingProducts.length > 0 && (
        <section className="py-12 md:py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-light tracking-wide mb-3 text-gray-900">
                Trending Now
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto text-sm">
                Products that are currently trending in fashion
              </p>
            </div>

            <FeaturedProducts
              products={trendingProducts}
              isLoading={productsLoading}
              error={error}
            />
          </div>
        </section>
      )}

      {/* NEW ARRIVALS */}
      {newProducts.length > 0 && (
        <section className="py-12 md:py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-light tracking-wide mb-3 text-gray-900">
                New Arrivals
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto text-sm">
                Fresh products just added to our collection
              </p>
            </div>

            <FeaturedProducts
              products={newProducts}
              isLoading={productsLoading}
              error={error}
            />
          </div>
        </section>
      )}

      {/* ========== CLOTHING SECTIONS START ========== */}

      {/* MEN'S COLLECTION */}
      {mensProducts.length > 0 && (
        <section className="py-12 md:py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-light tracking-wide mb-3 text-gray-900">
                Men&apos;s Collection
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto text-sm">
                Stylish and comfortable clothing for men
              </p>
            </div>

            <FeaturedProducts
              products={mensProducts}
              isLoading={productsLoading}
              error={error}
            />
          </div>
        </section>
      )}

      {/* WOMEN'S COLLECTION */}
      {womensProducts.length > 0 && (
        <section className="py-12 md:py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-light tracking-wide mb-3 text-gray-900">
                Women&apos;s Collection
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto text-sm">
                Trendy and elegant fashion for women
              </p>
            </div>

            <FeaturedProducts
              products={womensProducts}
              isLoading={productsLoading}
              error={error}
            />
          </div>
        </section>
      )}

      {/* KIDS COLLECTION */}
      {kidsProducts.length > 0 && (
        <section className="py-12 md:py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-light tracking-wide mb-3 text-gray-900">
                Kids Collection
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto text-sm">
                Fun and comfortable clothing for kids
              </p>
            </div>

            <FeaturedProducts
              products={kidsProducts}
              isLoading={productsLoading}
              error={error}
            />
          </div>
        </section>
      )}

      {/* ACCESSORIES */}
      {accessoriesProducts.length > 0 && (
        <section className="py-12 md:py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-light tracking-wide mb-3 text-gray-900">
                Accessories
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto text-sm">
                Complete your look with stylish accessories
              </p>
            </div>

            <FeaturedProducts
              products={accessoriesProducts}
              isLoading={productsLoading}
              error={error}
            />
          </div>
        </section>
      )}

      {/* FOOTWEAR */}
      {footwearProducts.length > 0 && (
        <section className="py-12 md:py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-light tracking-wide mb-3 text-gray-900">
                Footwear
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto text-sm">
                Comfortable and stylish shoes for every occasion
              </p>
            </div>

            <FeaturedProducts
              products={footwearProducts}
              isLoading={productsLoading}
              error={error}
            />
          </div>
        </section>
      )}

      {/* BAGS & LUGGAGE */}
      {bagsProducts.length > 0 && (
        <section className="py-12 md:py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-light tracking-wide mb-3 text-gray-900">
                Bags & Luggage
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto text-sm">
                Functional and fashionable bags for every need
              </p>
            </div>

            <FeaturedProducts
              products={bagsProducts}
              isLoading={productsLoading}
              error={error}
            />
          </div>
        </section>
      )}

      {/* SALE & OFFERS */}
      {saleProducts.length > 0 && (
        <section className="py-12 md:py-16 bg-black text-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-light tracking-wide mb-3 text-white">
                Sale & Offers
              </h2>
              <p className="text-white/70 max-w-2xl mx-auto text-sm">
                Great deals and discounts on selected items
              </p>
            </div>

            <FeaturedProducts
              products={saleProducts}
              isLoading={productsLoading}
              error={error}
            />
          </div>
        </section>
      )}

      {/* PREMIUM COLLECTION */}
      {premiumProducts.length > 0 && (
        <section className="py-12 md:py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-light tracking-wide mb-3 text-gray-900">
                Premium Collection
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto text-sm">
                Exclusive high-quality premium clothing
              </p>
            </div>

            <FeaturedProducts
              products={premiumProducts}
              isLoading={productsLoading}
              error={error}
            />
          </div>
        </section>
      )}

      {/* COMBO PACKS */}
      {comboProducts.length > 0 && (
        <section className="py-12 md:py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-light tracking-wide mb-3 text-gray-900">
                Combo Packs
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto text-sm">
                Best value bundles and combo offers
              </p>
            </div>

            <FeaturedProducts
              products={comboProducts}
              isLoading={productsLoading}
              error={error}
            />
          </div>
        </section>
      )}

      {/* GIFT COLLECTION */}
      {giftProducts.length > 0 && (
        <section className="py-12 md:py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-light tracking-wide mb-3 text-gray-900">
                Gift Collection
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto text-sm">
                Perfect gifts for your loved ones
              </p>
            </div>

            <FeaturedProducts
              products={giftProducts}
              isLoading={productsLoading}
              error={error}
            />
          </div>
        </section>
      )}

      {/* SUMMER COLLECTION */}
      {summerProducts.length > 0 && (
        <section className="py-12 md:py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-light tracking-wide mb-3 text-gray-900">
                Summer Collection
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto text-sm">
                Light and breezy summer essentials
              </p>
            </div>

            <FeaturedProducts
              products={summerProducts}
              isLoading={productsLoading}
              error={error}
            />
          </div>
        </section>
      )}

      {/* WINTER COLLECTION */}
      {winterProducts.length > 0 && (
        <section className="py-12 md:py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-light tracking-wide mb-3 text-gray-900">
                Winter Collection
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto text-sm">
                Warm and cozy winter wear
              </p>
            </div>

            <FeaturedProducts
              products={winterProducts}
              isLoading={productsLoading}
              error={error}
            />
          </div>
        </section>
      )}

      {/* PARTY WEAR */}
      {partyProducts.length > 0 && (
        <section className="py-12 md:py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-light tracking-wide mb-3 text-gray-900">
                Party Wear
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto text-sm">
                Stand out at every party with our collection
              </p>
            </div>

            <FeaturedProducts
              products={partyProducts}
              isLoading={productsLoading}
              error={error}
            />
          </div>
        </section>
      )}

      {/* CASUAL WEAR */}
      {casualProducts.length > 0 && (
        <section className="py-12 md:py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-light tracking-wide mb-3 text-gray-900">
                Casual Wear
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto text-sm">
                Comfortable everyday casual clothing
              </p>
            </div>

            <FeaturedProducts
              products={casualProducts}
              isLoading={productsLoading}
              error={error}
            />
          </div>
        </section>
      )}

      {/* FORMAL WEAR */}
      {formalProducts.length > 0 && (
        <section className="py-12 md:py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-light tracking-wide mb-3 text-gray-900">
                Formal Wear
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto text-sm">
                Professional and elegant formal attire
              </p>
            </div>

            <FeaturedProducts
              products={formalProducts}
              isLoading={productsLoading}
              error={error}
            />
          </div>
        </section>
      )}

      {/* HOT BRANDS */}
      <BrandCarousel tag="HOT" title="HOT BRANDS" />
      {/* 
      <Image
        src={scratch}
        alt="scratch"
        width={1920}
        height={1080}
        className="object-cover object-center"
      /> */}

      <BenefitsSec />
      <TestimonialsSection />
      <NewsletterSection />
    </div>
  );
}
