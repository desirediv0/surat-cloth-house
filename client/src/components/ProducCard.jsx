"use client";

import { formatCurrency, fetchApi } from "@/lib/utils";
import { Eye, Heart } from "lucide-react";
import Image from "next/image";
import { useState, useEffect, useMemo } from "react";
import { Button } from "./ui/button";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useAddProductToCart } from "@/lib/cart-utils";
import ProductQuickView from "./ProductQuickView";

// Helper function to format image URLs correctly
const getImageUrl = (image) => {
  if (!image) return "/placeholder.jpg";
  if (image.startsWith("http")) return image;
  return `https://desirediv-storage.blr1.digitaloceanspaces.com/${image}`;
};

// Helper function to calculate discount percentage
const calculateDiscountPercentage = (regularPrice, salePrice) => {
  if (!regularPrice || !salePrice || regularPrice <= salePrice) return 0;
  return Math.round(((regularPrice - salePrice) / regularPrice) * 100);
};

const ProductCard = ({ product }) => {
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [wishlistItems, setWishlistItems] = useState({});
  const [isAddingToWishlist, setIsAddingToWishlist] = useState({});
  const [isAddingToCart, setIsAddingToCart] = useState({});
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { addProductToCart } = useAddProductToCart();

  // Fetch wishlist status for this product
  useEffect(() => {
    const fetchWishlistStatus = async () => {
      if (!isAuthenticated || typeof window === "undefined") return;

      try {
        const response = await fetchApi("/users/wishlist", {
          credentials: "include",
        });
        const items =
          response.data?.wishlistItems?.reduce((acc, item) => {
            acc[item.productId] = true;
            return acc;
          }, {}) || {};
        setWishlistItems(items);
      } catch (error) {
        console.error("Error fetching wishlist:", error);
      }
    };

    fetchWishlistStatus();
  }, [isAuthenticated]);

  const handleQuickView = (product) => {
    setQuickViewProduct(product);
    setQuickViewOpen(true);
  };

  // Handle add to cart click
  const handleAddToCart = async (product) => {
    setIsAddingToCart((prev) => ({ ...prev, [product.id]: true }));
    try {
      const result = await addProductToCart(product, 1);
      if (!result.success) {
        return;
      }
    } catch (err) {
      console.error("Error adding to cart:", err);
      toast.error("Failed to add product to cart");
    } finally {
      setIsAddingToCart((prev) => ({ ...prev, [product.id]: false }));
    }
  };

  const handleAddToWishlist = async (product, e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push(`/auth?redirect=/products/${product.slug}`);
      return;
    }

    setIsAddingToWishlist((prev) => ({ ...prev, [product.id]: true }));

    try {
      if (wishlistItems[product.id]) {
        // Get wishlist to find the item ID
        const wishlistResponse = await fetchApi("/users/wishlist", {
          credentials: "include",
        });

        const wishlistItem = wishlistResponse.data?.wishlistItems?.find(
          (item) => item.productId === product.id
        );

        if (wishlistItem) {
          await fetchApi(`/users/wishlist/${wishlistItem.id}`, {
            method: "DELETE",
            credentials: "include",
          });

          setWishlistItems((prev) => ({ ...prev, [product.id]: false }));
          toast.success("Removed from wishlist");
        }
      } else {
        // Add to wishlist
        await fetchApi("/users/wishlist", {
          method: "POST",
          credentials: "include",
          body: JSON.stringify({ productId: product.id }),
        });

        setWishlistItems((prev) => ({ ...prev, [product.id]: true }));
        toast.success("Added to wishlist");
      }
    } catch (error) {
      console.error("Error updating wishlist:", error);
      toast.error("Failed to update wishlist");
    } finally {
      setIsAddingToWishlist((prev) => ({ ...prev, [product.id]: false }));
    }
  };


  const getAllProductImages = useMemo(() => {
    const images = [];
    const imageUrls = new Set();


    if (
      product.variants &&
      Array.isArray(product.variants) &&
      product.variants.length > 0
    ) {
      product.variants.forEach((variant) => {
        // Handle variant.images array
        if (
          variant.images &&
          Array.isArray(variant.images) &&
          variant.images.length > 0
        ) {
          variant.images.forEach((img) => {
            const url = img?.url || img;
            if (url) {
              const imageUrl = getImageUrl(url);
              if (imageUrl && !imageUrls.has(imageUrl)) {
                imageUrls.add(imageUrl);
                images.push(imageUrl);
              }
            }
          });
        }
      });
    }

    // Priority 2: Get product images array
    if (
      product.images &&
      Array.isArray(product.images) &&
      product.images.length > 0
    ) {
      product.images.forEach((img) => {
        const url = img?.url || img;
        if (url) {
          const imageUrl = getImageUrl(url);
          if (imageUrl && !imageUrls.has(imageUrl)) {
            imageUrls.add(imageUrl);
            images.push(imageUrl);
          }
        }
      });
    }

    // Priority 3: Fallback to product.image (string)
    if (images.length === 0 && product.image) {
      const imageUrl = getImageUrl(product.image);
      if (imageUrl && !imageUrls.has(imageUrl)) {
        imageUrls.add(imageUrl);
        images.push(imageUrl);
      }
    }

    // Final fallback
    if (images.length === 0) {
      images.push("/placeholder.jpg");
    }

    return images;
  }, [product]);

  // Get current image to display
  const getCurrentImage = () => {
    if (getAllProductImages.length === 0) return "/placeholder.jpg";
    return getAllProductImages[currentImageIndex] || getAllProductImages[0];
  };

  // Auto-rotate images on hover
  useEffect(() => {
    if (!isHovered || getAllProductImages.length <= 1) {
      setCurrentImageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => {
        return (prev + 1) % getAllProductImages.length;
      });
    }, 2500); // Change image every 2.5 seconds for smooth transition

    return () => clearInterval(interval);
  }, [isHovered, getAllProductImages.length]);

  // Reset to first image when hover ends
  useEffect(() => {
    if (!isHovered) {
      setCurrentImageIndex(0);
    }
  }, [isHovered]);

  // Get variant info
  const getVariantInfo = () => {
    let selectedVariant = null;
    if (product.variants && product.variants.length > 0) {
      selectedVariant = product.variants[0];
    }
    if (!selectedVariant) return null;
    const color = selectedVariant.color?.name;
    const size = selectedVariant.size?.name;
    const hexCode = selectedVariant.color?.hexCode;
    return { color, size, hexCode };
  };

  const variantInfo = getVariantInfo();
  const discountPercent = calculateDiscountPercentage(
    product.regularPrice,
    product.basePrice
  );

  return (
    <div
      key={product.id}
      className="bg-white overflow-hidden transition-all duration-300 hover:shadow-xl border border-gray-100 rounded-none group"
    >
      <Link href={`/products/${product.slug}`}>
        <div
          className="relative aspect-[3/4] w-full overflow-hidden bg-gray-50"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="relative w-full h-full">
            {getAllProductImages.map((img, idx) => (
              <Image
                key={idx}
                src={img}
                alt={`${product.name} - Image ${idx + 1}`}
                fill
                className={`object-cover transition-all duration-500 ${idx === currentImageIndex
                  ? "opacity-100 scale-100 group-hover:scale-105"
                  : "opacity-0 scale-95 absolute"
                  }`}
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              />
            ))}
          </div>

          {/* Image indicators - show on hover if multiple images */}
          {isHovered && getAllProductImages.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
              {getAllProductImages.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentImageIndex
                    ? "bg-[#136C5B] w-6"
                    : "bg-white/50 w-1.5"
                    }`}
                />
              ))}
            </div>
          )}

          {/* Sale and Discount badges - always visible, enhanced on hover */}
          {product.hasSale && (
            <>
              <div className="absolute top-3 left-3 z-10">
                <div className="bg-red-500 text-white text-[10px] md:text-xs font-bold px-2.5 md:px-3 py-1 uppercase tracking-wide shadow-lg transition-transform duration-300 group-hover:scale-110">
                  Sale
                </div>
              </div>
              {discountPercent > 0 && (
                <div className="absolute top-3 right-3 z-10">
                  <div className="bg-pink-500 text-white text-[10px] md:text-xs font-bold px-2.5 md:px-3 py-1 rounded-full shadow-lg transition-transform duration-300 group-hover:scale-110">
                    {discountPercent}% OFF
                  </div>
                </div>
              )}
            </>
          )}

          {/* Hover overlay with actions */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="bg-white/95 hover:bg-white text-black hover:text-black rounded-none px-4 py-2 h-auto"
                onClick={(e) => {
                  e.preventDefault();
                  handleQuickView(product);
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                <span className="text-xs uppercase tracking-wide">
                  Quick View
                </span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`bg-white/95 hover:bg-white hover:text-red-400 rounded-none px-3 py-2 h-auto ${wishlistItems[product.id] ? "text-red-500" : "text-black"
                  }`}
                onClick={(e) => handleAddToWishlist(product, e)}
                disabled={isAddingToWishlist[product.id]}
              >
                <Heart
                  className={`h-4 w-4 ${wishlistItems[product.id] ? "fill-current" : ""
                    }`}
                />
              </Button>
            </div>
          </div>
        </div>
      </Link>

      <div className="p-4">
        <Link
          href={`/products/${product.slug}`}
          className="block group-hover:text-black"
        >
          <h3 className="font-medium text-sm mb-2 line-clamp-2 text-gray-900 uppercase tracking-wide">
            {product.name}
          </h3>

          {/* Show color and size from variants */}
          {variantInfo && (variantInfo.color || variantInfo.size) && (
            <div className="text-xs text-gray-500 mb-3 flex items-center gap-2">
              {variantInfo.color && (
                <>
                  {variantInfo.hexCode && (
                    <div
                      className="w-3 h-3 rounded-full border border-gray-300"
                      style={{ backgroundColor: variantInfo.hexCode }}
                    />
                  )}
                  <span>{variantInfo.color}</span>
                </>
              )}
              {variantInfo.color && variantInfo.size && (
                <span className="text-gray-300">•</span>
              )}
              {variantInfo.size && <span>{variantInfo.size}</span>}
            </div>
          )}
        </Link>

        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            {product.hasSale ? (
              <>
                <span className="font-semibold text-base text-black">
                  {formatCurrency(product.basePrice)}
                </span>
                <span className="text-gray-400 line-through text-xs">
                  {formatCurrency(product.regularPrice)}
                </span>
              </>
            ) : (
              <span className="font-semibold text-base text-black">
                {formatCurrency(product.basePrice)}
              </span>
            )}
          </div>
          <Button
            onClick={() => handleAddToCart(product)}
            variant="outline"
            size="sm"
            className="rounded-none border-[#136C5B] text-[#136C5B] hover:bg-[#136C5B] hover:text-white transition-all duration-300 px-4"
            disabled={isAddingToCart[product.id]}
          >
            {isAddingToCart[product.id] ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            ) : (
              <span className="text-xs uppercase tracking-wide">Add</span>
            )}
          </Button>
        </div>
      </div>

      {/* Quick View Dialog */}
      <ProductQuickView
        product={quickViewProduct}
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
      />
    </div>
  );
};

export default ProductCard;
