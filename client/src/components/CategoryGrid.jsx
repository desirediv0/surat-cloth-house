"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { fetchApi } from "@/lib/utils";
import Headtext from "./ui/headtext";

const CategoryCard = ({ category, index }) => {
  const isOffers =
    category.name?.toLowerCase().includes("offer") ||
    category.slug === "offers";

  return (
    <div className="flex flex-col items-center group cursor-pointer">
      <div className="relative bg-white rounded p-1 mb-1  md:w-[200px] md:h-[200px] flex items-center justify-center shadow group-hover:shadow-md border border-gray-100 overflow-hidden transition-all duration-200">
        {isOffers ? (
          <div className="relative">
            <div className="w-9 h-9 sm:w-11 sm:h-11 md:w-16 md:h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow">
              <span className="text-white text-lg sm:text-xl md:text-2xl font-bold">
                %
              </span>
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-[10px] sm:text-xs md:text-sm font-bold">
                !
              </span>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full  overflow-hidden bg-gray-50 flex items-center justify-center">
            <Image
              src={category.image || "/placeholder.jpg"}
              alt={category.name || "Category"}
              width={300}
              height={300}
              className="object-contain w-full h-full"
              loading="lazy"
            />
          </div>
        )}
      </div>
      <div className="text-center px-1 mt-1">
        <h3 className="text-[11px] sm:text-xs md:text-base font-medium text-gray-700 group-hover:text-[#166454] transition-colors duration-200 leading-tight max-w-[64px] sm:max-w-[110px] md:max-w-[140px] truncate">
          {category.name}
        </h3>
      </div>
    </div>
  );
};

const SkeletonLoader = () => (
  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
    {[...Array(6)].map((_, index) => (
      <div
        key={index}
        className="flex flex-col items-center animate-pulse flex-shrink-0"
      >
        <div className="bg-gray-200 rounded-2xl w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] md:w-[140px] md:h-[140px] mb-3"></div>
        <div className="h-3 bg-gray-200 rounded w-12 sm:w-16 md:w-20 mb-1"></div>
        <div className="h-2 bg-gray-200 rounded w-8 sm:w-10 md:w-12"></div>
      </div>
    ))}
  </div>
);

const CategoryGrid = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchApi("/public/categories");
        if (response.success && response.data?.categories) {
          setCategories(response.data.categories);
        } else {
          setError(response.message || "Failed to fetch categories");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch categories"
        );
      } finally {
        setLoading(false);
      }
    };
    loadCategories();
  }, []);

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    window.location.reload();
  };

  if (loading) {
    return (
      <section className="py-5 md:py-6 my-3 md:my-4 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-6 sm:mb-8">
            <Headtext text="Shop By Category" />
            <p className="text-gray-600 text-sm sm:text-base">
              Discover our wide range of fashion and clothing products
            </p>
          </div>
          <SkeletonLoader />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-8 sm:py-12 bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">Error: {error}</p>
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <section className="py-8 sm:py-12 bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <p className="text-gray-500">
              No categories available at the moment
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-5 md:py-6 my-3 md:my-4 bg-gradient-to-br from-slate-50 to-blue-50/30">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="text-center mb-6 sm:mb-8">
          <Headtext text="Shop By Category" />
          <p className="text-gray-600 text-sm sm:text-base my-6 ">
            Discover our wide range of women&apos;s fashion categories
          </p>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          {categories.map((category, index) => (
            <Link
              href={`/category/${category.slug}`}
              key={category.id}
              className="block"
            >
              <CategoryCard category={category} index={index} />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;
