"use client";
import VerticalCategoriesCarousel from "@/components/vertical-catgry";
import { usePathname } from "next/navigation";

export default function ProductsLayout({ children }) {
  const pathname = usePathname();

  // Check if we're on a product detail page (has slug parameter)
  const isProductDetailPage =
    pathname.includes("/products/") && pathname.split("/").length > 2;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-2 md:px-4 py-4 md:py-8">
        <div className="flex gap-2 md:gap-8">
          {/* Left Sidebar - Vertical Categories - Only on mobile and not on product detail pages */}
          {!isProductDetailPage && (
            <div className="flex-shrink-0 md:hidden block">
              <div className="sticky top-24">
                <VerticalCategoriesCarousel />
              </div>
            </div>
          )}

          {/* Right Side - Main Content */}
          <div
            className={`${isProductDetailPage ? "w-full" : "flex-1"} min-w-0`}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
