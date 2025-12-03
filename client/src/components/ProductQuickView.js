"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { fetchApi, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Star,
  ShoppingCart,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAddVariantToCart } from "@/lib/cart-utils";

// Helper function to format image URLs correctly
const getImageUrl = (image) => {
  if (!image) return "/placeholder.jpg";
  if (image.startsWith("http")) return image;
  return `https://desirediv-storage.blr1.digitaloceanspaces.com/${image}`;
};

export default function ProductQuickView({ product, open, onOpenChange }) {
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [success, setSuccess] = useState(false);
  const { addVariantToCart } = useAddVariantToCart();
  const [productDetails, setProductDetails] = useState(null);
  const [imgSrc, setImgSrc] = useState("");
  const [availableCombinations, setAvailableCombinations] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [sizesOrderMap, setSizesOrderMap] = useState({});
  const [colorsOrderMap, setColorsOrderMap] = useState({});

  // Reset states when product changes or dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedColor(null);
      setSelectedSize(null);
      setSelectedVariant(null);
      setQuantity(1);
      setError(null);
      setSuccess(false);
      setProductDetails(null);
      setImgSrc("");
      setAvailableCombinations([]);
      setInitialLoading(true);
      return;
    }

    if (product) {
      setImgSrc(product.image || "/placeholder.jpg");
    }
  }, [product, open]);

  // Fetch sizes and colors order mapping
  useEffect(() => {
    const fetchOrderMaps = async () => {
      try {
        // Fetch sizes order
        const sizesResponse = await fetchApi("/public/sizes");
        if (sizesResponse?.data?.sizes) {
          const sizesMap = {};
          sizesResponse.data.sizes.forEach((size) => {
            sizesMap[size.id] = size.order || 0;
          });
          setSizesOrderMap(sizesMap);
        }

        // Fetch colors order (if available)
        try {
          const colorsResponse = await fetchApi("/public/colors");
          if (colorsResponse?.data?.colors) {
            const colorsMap = {};
            colorsResponse.data.colors.forEach((color) => {
              colorsMap[color.id] = color.order || 0;
            });
            setColorsOrderMap(colorsMap);
          }
        } catch (err) {
          // Colors order might not be available, that's okay
          console.log("Colors order not available");
        }
      } catch (err) {
        console.error("Error fetching order maps:", err);
        // Continue without order maps
      }
    };

    if (open) {
      fetchOrderMaps();
    }
  }, [open]);

  // Fetch product details when product changes
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!product || !open) {
        setProductDetails(null);
        return;
      }

      setLoading(true);
      setInitialLoading(true);
      setError(null);

      try {
        const response = await fetchApi(`/public/products/${product.slug}`);

        if (response?.data?.product) {
          const productData = response.data.product;

          // Sort sizeOptions by order if available
          if (productData.sizeOptions && productData.sizeOptions.length > 0) {
            productData.sizeOptions = [...productData.sizeOptions].sort(
              (a, b) => {
                // First try to get order from sizesOrderMap (from /public/sizes API)
                const aOrder =
                  sizesOrderMap[a.id] ??
                  // Fallback: get order from variant size
                  productData.variants?.find(
                    (v) => v.size?.id === a.id || v.sizeId === a.id
                  )?.size?.order ??
                  999;
                const bOrder =
                  sizesOrderMap[b.id] ??
                  productData.variants?.find(
                    (v) => v.size?.id === b.id || v.sizeId === b.id
                  )?.size?.order ??
                  999;
                return aOrder - bOrder;
              }
            );
          }

          setProductDetails(productData);

          // Set initial image
          if (productData.images && productData.images.length > 0) {
            const firstImage =
              productData.images.find((img) => img.isPrimary) ||
              productData.images[0];
            setImgSrc(getImageUrl(firstImage.url) || "/placeholder.jpg");
          } else if (productData.image) {
            setImgSrc(getImageUrl(productData.image) || "/placeholder.jpg");
          }

          // Extract all available combinations from variants
          if (productData.variants && productData.variants.length > 0) {
            const combinations = productData.variants
              .filter(
                (v) =>
                  v.isActive !== false &&
                  (v.quantity > 0 || v.quantity === undefined)
              )
              .map((variant) => {
                // Handle both direct IDs and nested color/size objects
                const colorId = variant.colorId || variant.color?.id || null;
                const sizeId = variant.sizeId || variant.size?.id || null;

                // Ensure price is a number
                const price =
                  typeof variant.price === "string"
                    ? parseFloat(variant.price)
                    : variant.price;
                const salePrice = variant.salePrice
                  ? typeof variant.salePrice === "string"
                    ? parseFloat(variant.salePrice)
                    : variant.salePrice
                  : null;

                return {
                  colorId,
                  sizeId,
                  variant: {
                    ...variant,
                    price,
                    salePrice,
                  },
                };
              });

            setAvailableCombinations(combinations);

            // Set default selections - prioritize color then size
            if (productData.colorOptions?.length > 0) {
              const firstColor = productData.colorOptions[0];
              setSelectedColor(firstColor);

              // Find matching variant for first color
              const matchingVariant = combinations.find(
                (combo) => combo.colorId === firstColor.id
              );

              if (matchingVariant && productData.sizeOptions?.length > 0) {
                const matchingSize = productData.sizeOptions.find(
                  (size) => size.id === matchingVariant.sizeId
                );

                if (matchingSize) {
                  setSelectedSize(matchingSize);
                  setSelectedVariant(matchingVariant.variant);
                } else if (productData.sizeOptions.length > 0) {
                  // If no exact match, try to find any available size for this color
                  const availableSizes = combinations
                    .filter((c) => c.colorId === firstColor.id)
                    .map((c) => c.sizeId);

                  const firstAvailableSize = productData.sizeOptions.find(
                    (size) => availableSizes.includes(size.id)
                  );

                  if (firstAvailableSize) {
                    setSelectedSize(firstAvailableSize);
                    const variantMatch = combinations.find(
                      (c) =>
                        c.colorId === firstColor.id &&
                        c.sizeId === firstAvailableSize.id
                    );
                    if (variantMatch) {
                      setSelectedVariant(variantMatch.variant);
                    }
                  }
                }
              } else if (matchingVariant) {
                // No sizes, just set the variant
                setSelectedVariant(matchingVariant.variant);
              }
            } else if (
              productData.sizeOptions?.length > 0 &&
              combinations.length > 0
            ) {
              // No colors, but has sizes - select first available size
              // Sizes are already sorted by order in productData.sizeOptions
              const firstSize = productData.sizeOptions[0];
              setSelectedSize(firstSize);
              const matchingVariant = combinations.find(
                (combo) => combo.sizeId === firstSize.id
              );
              if (matchingVariant) {
                setSelectedVariant(matchingVariant.variant);
              } else {
                // Fallback: find any variant with this size
                const variantMatch = productData.variants.find(
                  (v) =>
                    (v.size?.id === firstSize.id ||
                      v.sizeId === firstSize.id) &&
                    v.isActive
                );
                if (variantMatch) {
                  setSelectedVariant(variantMatch);
                }
              }
            } else if (productData.variants.length > 0) {
              // Just set first available variant
              const firstAvailableVariant =
                productData.variants.find(
                  (v) =>
                    v.isActive !== false &&
                    (v.quantity > 0 || v.quantity === undefined)
                ) || productData.variants[0];
              setSelectedVariant(firstAvailableVariant);
            }
          }
        } else {
          setError("Product details not available");
        }
      } catch (err) {
        console.error("Error fetching product details:", err);
        setError(err?.message || "Failed to load product details");
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    };

    fetchProductDetails();
  }, [product?.slug, product?.id, open, sizesOrderMap, colorsOrderMap]);

  // Get available sizes for a specific color
  const getAvailableSizesForColor = (colorId) => {
    if (!colorId) {
      // If no color, return all available sizes
      return availableCombinations
        .filter((combo) => combo.sizeId)
        .map((combo) => combo.sizeId)
        .filter((id, index, self) => self.indexOf(id) === index);
    }
    return availableCombinations
      .filter((combo) => combo.colorId === colorId && combo.sizeId)
      .map((combo) => combo.sizeId)
      .filter((id, index, self) => self.indexOf(id) === index); // Remove duplicates
  };

  // Get available colors for a specific size
  const getAvailableColorsForSize = (sizeId) => {
    if (!sizeId) return [];
    return availableCombinations
      .filter((combo) => combo.sizeId === sizeId && combo.colorId)
      .map((combo) => combo.colorId)
      .filter((id, index, self) => self.indexOf(id) === index); // Remove duplicates
  };

  // Handle color change
  const handleColorChange = (color) => {
    setSelectedColor(color);
    const availableSizeIds = getAvailableSizesForColor(color.id);

    if (
      productDetails?.sizeOptions?.length > 0 &&
      availableSizeIds.length > 0
    ) {
      if (selectedSize && availableSizeIds.includes(selectedSize.id)) {
        const matchingVariant = availableCombinations.find(
          (combo) =>
            combo.colorId === color.id && combo.sizeId === selectedSize.id
        );
        if (matchingVariant) {
          setSelectedVariant(matchingVariant.variant);
        }
      } else {
        const firstAvailableSize = productDetails.sizeOptions.find((size) =>
          availableSizeIds.includes(size.id)
        );
        if (firstAvailableSize) {
          setSelectedSize(firstAvailableSize);
          const matchingVariant = availableCombinations.find(
            (combo) =>
              combo.colorId === color.id &&
              combo.sizeId === firstAvailableSize.id
          );
          if (matchingVariant) {
            setSelectedVariant(matchingVariant.variant);
          }
        }
      }
    } else {
      setSelectedSize(null);
      setSelectedVariant(null);
    }
  };

  // Handle size change
  const handleSizeChange = (size) => {
    setSelectedSize(size);

    if (productDetails?.colorOptions?.length > 0) {
      const availableColorIds = getAvailableColorsForSize(size.id);
      if (selectedColor && availableColorIds.includes(selectedColor.id)) {
        const matchingVariant = availableCombinations.find(
          (combo) =>
            combo.sizeId === size.id && combo.colorId === selectedColor.id
        );
        if (matchingVariant) {
          setSelectedVariant(matchingVariant.variant);
        }
      } else {
        const firstAvailableColor = productDetails.colorOptions.find((color) =>
          availableColorIds.includes(color.id)
        );
        if (firstAvailableColor) {
          setSelectedColor(firstAvailableColor);
          const matchingVariant = availableCombinations.find(
            (combo) =>
              combo.sizeId === size.id &&
              combo.colorId === firstAvailableColor.id
          );
          if (matchingVariant) {
            setSelectedVariant(matchingVariant.variant);
          }
        }
      }
    } else {
      const matchingVariant = availableCombinations.find(
        (combo) => combo.sizeId === size.id
      );
      if (matchingVariant) {
        setSelectedVariant(matchingVariant.variant);
      }
    }
  };


  // Handle add to cart
  const handleAddToCart = async () => {
    setAddingToCart(true);
    setError(null);
    setSuccess(false);

    let variantToAdd = selectedVariant;

    if (!variantToAdd && productDetails?.variants?.length > 0) {
      variantToAdd = productDetails.variants[0];
    }

    if (!variantToAdd) {
      setError("No product variant available");
      setAddingToCart(false);
      return;
    }

    try {
      const result = await addVariantToCart(
        variantToAdd,
        quantity,
        productDetails?.name || product?.name
      );
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onOpenChange(false);
        }, 2000);
      } else {
        setError("Failed to add to cart. Please try again.");
      }
    } catch (err) {
      console.error("Error adding to cart:", err);
      setError("Failed to add to cart. Please try again.");
    } finally {
      setAddingToCart(false);
    }
  };


  // Helper to parse price (handle Decimal types from API)
  const parsePrice = (price) => {
    if (!price) return 0;
    if (typeof price === "number") return price;
    if (typeof price === "string") return parseFloat(price) || 0;
    return 0;
  };

  // Get price data - single source of truth
  const getPriceData = () => {
    if (initialLoading || loading) {
      return { loading: true };
    }

    // Priority 1: Selected variant
    if (selectedVariant) {
      const salePrice = parsePrice(selectedVariant.salePrice);
      const price = parsePrice(selectedVariant.price);
      return {
        currentPrice: salePrice > 0 && salePrice < price ? salePrice : price,
        originalPrice: salePrice > 0 && salePrice < price ? price : null,
        loading: false,
      };
    }

    // Priority 2: Product details from API
    if (productDetails) {
      const basePrice = parsePrice(productDetails.basePrice);
      const regularPrice = parsePrice(productDetails.regularPrice);
      const hasSale =
        productDetails.hasSale && basePrice > 0 && regularPrice > basePrice;
      return {
        currentPrice: basePrice,
        originalPrice: hasSale ? regularPrice : null,
        loading: false,
      };
    }

    // Priority 3: Fallback to product prop
    if (product) {
      const basePrice = parsePrice(product.basePrice);
      const regularPrice = parsePrice(product.regularPrice);
      const hasSale =
        product.hasSale && basePrice > 0 && regularPrice > basePrice;
      return {
        currentPrice: basePrice,
        originalPrice: hasSale ? regularPrice : null,
        loading: false,
      };
    }

    return { loading: false, currentPrice: 0, originalPrice: null };
  };

  // Format price display - single display
  const getPriceDisplay = () => {
    const priceData = getPriceData();

    if (priceData.loading) {
      return <div className="h-8 w-32 bg-gray-200 animate-pulse rounded"></div>;
    }

    if (priceData.originalPrice && priceData.originalPrice > priceData.currentPrice) {
      return (
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-2xl font-bold text-[#136C5B]">
            {formatCurrency(priceData.currentPrice)}
          </span>
          <span className="text-lg text-gray-500 line-through">
            {formatCurrency(priceData.originalPrice)}
          </span>
        </div>
      );
    }

    return (
      <span className="text-2xl font-bold text-[#136C5B]">
        {formatCurrency(priceData.currentPrice || 0)}
      </span>
    );
  };

  // Get all product images - using useMemo to avoid recalculating
  const allImages = useMemo(() => {
    if (!product) return [];

    const displayProduct = productDetails || product;
    const images = [];

    // Priority 1: Selected variant images
    if (selectedVariant?.images?.length > 0) {
      selectedVariant.images
        .sort((a, b) => {
          // Sort by isPrimary first, then by order
          if (a.isPrimary && !b.isPrimary) return -1;
          if (!a.isPrimary && b.isPrimary) return 1;
          return (a.order || 0) - (b.order || 0);
        })
        .forEach((img) => {
          const url = getImageUrl(img.url);
          if (url && !images.includes(url)) images.push(url);
        });
    }

    // Priority 2: Product images
    if (displayProduct?.images?.length > 0) {
      displayProduct.images
        .sort((a, b) => {
          // Sort by isPrimary first, then by order
          if (a.isPrimary && !b.isPrimary) return -1;
          if (!a.isPrimary && b.isPrimary) return 1;
          return (a.order || 0) - (b.order || 0);
        })
        .forEach((img) => {
          const url = getImageUrl(img.url);
          if (url && !images.includes(url)) images.push(url);
        });
    }

    // Priority 3: Variant images from other variants
    if (displayProduct?.variants?.length > 0 && images.length === 0) {
      for (const variant of displayProduct.variants) {
        if (variant.images?.length > 0) {
          variant.images
            .sort((a, b) => {
              if (a.isPrimary && !b.isPrimary) return -1;
              if (!a.isPrimary && b.isPrimary) return 1;
              return (a.order || 0) - (b.order || 0);
            })
            .forEach((img) => {
              const url = getImageUrl(img.url);
              if (url && !images.includes(url)) images.push(url);
            });
          break; // Just get images from first variant with images
        }
      }
    }

    // Priority 4: Fallback images
    if (images.length === 0) {
      if (displayProduct?.image) {
        const url = getImageUrl(displayProduct.image);
        if (url) images.push(url);
      } else if (imgSrc) {
        images.push(imgSrc);
      } else {
        images.push("/placeholder.jpg");
      }
    }

    return images; // Already deduplicated
  }, [productDetails, selectedVariant, product, imgSrc]);

  // Reset image index when variant or product changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [selectedVariant?.id, productDetails?.id, product?.id]);

  if (!product) return null;

  const displayProduct = productDetails || product;

  // Calculate discount percentage - using single source of truth
  const getDiscountPercentage = () => {
    const priceData = getPriceData();

    if (priceData.loading || !priceData.originalPrice || !priceData.currentPrice) {
      return null;
    }

    if (priceData.originalPrice > priceData.currentPrice) {
      return Math.round(((priceData.originalPrice - priceData.currentPrice) / priceData.originalPrice) * 100);
    }

    return null;
  };

  const discountPercentage = getDiscountPercentage();
  const priceData = getPriceData();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl max-w-[95vw] max-h-[95vh] overflow-hidden p-0 gap-0">

        {loading && !productDetails ? (
          <div className="py-20 flex justify-center">
            <div className="w-10 h-10 border-4 border-[#136C5B] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 h-full max-h-[95vh]">
            {/* Left Side - Image Gallery */}
            <div className="relative bg-gray-50 flex flex-row  h-[400px] lg:h-auto">
              {/* Thumbnail Gallery */}
              {allImages.length > 1 && (
                <div className="hidden lg:flex flex-col gap-2 p-4 overflow-y-auto">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`relative w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${currentImageIndex === idx
                        ? "border-[#136C5B] shadow-md"
                        : "border-gray-200 hover:border-gray-300"
                        }`}
                    >
                      <Image
                        src={img}
                        alt={`${displayProduct.name} - Image ${idx + 1}`}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Main Image */}
              <div className="relative flex-1 flex items-center justify-center bg-white">
                <div className="relative w-full h-full min-h-[400px] ">
                  <Image
                    src={allImages[currentImageIndex] || "/placeholder.jpg"}
                    alt={displayProduct.name}
                    fill
                    className="object-contain p-4"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />

                  {/* Navigation Arrows */}
                  {allImages.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setCurrentImageIndex((prev) =>
                            prev === 0 ? allImages.length - 1 : prev - 1
                          )
                        }
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white border border-gray-200 flex items-center justify-center shadow-lg transition-colors z-10"
                      >
                        <ChevronLeft className="h-5 w-5 text-gray-700" />
                      </button>
                      <button
                        onClick={() =>
                          setCurrentImageIndex((prev) =>
                            prev === allImages.length - 1 ? 0 : prev + 1
                          )
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white border border-gray-200 flex items-center justify-center shadow-lg transition-colors z-10"
                      >
                        <ChevronRight className="h-5 w-5 text-gray-700" />
                      </button>
                    </>
                  )}

                  {/* Discount Badge */}
                  {discountPercentage && (
                    <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                      {discountPercentage}% OFF
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Side - Product Details */}
            <div className="flex flex-col p-6 lg:p-8 overflow-y-auto bg-white">
              {/* Success Message */}
              {success && (
                <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm rounded flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Item added to cart successfully
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {error}
                </div>
              )}

              {/* Product Name */}
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 uppercase tracking-tight">
                {displayProduct.name}
              </h2>

              {/* Price Section */}
              <div className="mb-6">
                <div className="flex items-baseline gap-3 mb-2 flex-wrap">
                  {getPriceDisplay()}
                  {discountPercentage && discountPercentage > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      {discountPercentage}% OFF
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-500 mt-1">
                  Inclusive of all taxes
                </p>
              </div>

              {/* Rating */}
              {displayProduct.avgRating > 0 && (
                <div className="flex items-center mb-4">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${star <= Math.round(displayProduct.avgRating || 0)
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                          }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600 ml-2">
                    ({displayProduct.reviewCount || 0} reviews)
                  </span>
                </div>
              )}

              {/* Description */}
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {displayProduct.description || "No description available"}
              </p>

              {/* Color Selection */}
              {productDetails?.colorOptions &&
                productDetails.colorOptions.length > 0 && (
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
                      SELECT COLOR
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {productDetails.colorOptions.map((color) => {
                        const availableSizeIds = getAvailableSizesForColor(
                          color.id
                        );
                        const isAvailable = availableSizeIds.length > 0;
                        const isSelected = selectedColor?.id === color.id;

                        return (
                          <button
                            key={color.id}
                            type="button"
                            onClick={() => handleColorChange(color)}
                            disabled={!isAvailable}
                            className={`flex flex-col items-center gap-2 transition-all ${!isAvailable
                              ? "opacity-50 cursor-not-allowed"
                              : "cursor-pointer"
                              }`}
                          >
                            <div
                              className={`w-12 h-12 rounded-full border-2 transition-all ${isSelected
                                ? "border-[#136C5B] shadow-lg scale-110"
                                : "border-gray-300 hover:border-gray-400"
                                }`}
                              style={{
                                backgroundColor: color.hexCode || "#ccc",
                              }}
                            />
                            <span
                              className={`text-xs font-medium ${isSelected ? "text-[#136C5B]" : "text-gray-700"
                                }`}
                            >
                              {color.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* Size Selection */}
              {productDetails?.sizeOptions &&
                productDetails.sizeOptions.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
                      SELECT SIZE
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {productDetails.sizeOptions.map((size) => {
                        // Check if size is available
                        // If colors exist, check combination with selected color
                        // If no colors, check if size exists in any variant
                        const isAvailable = selectedColor
                          ? availableCombinations.some(
                            (combo) =>
                              combo.colorId === selectedColor.id &&
                              combo.sizeId === size.id
                          )
                          : availableCombinations.some(
                            (combo) => combo.sizeId === size.id
                          );
                        const isSelected = selectedSize?.id === size.id;

                        return (
                          <button
                            key={size.id}
                            type="button"
                            onClick={() => handleSizeChange(size)}
                            disabled={!isAvailable}
                            className={`w-12 h-12 rounded-full border-2 text-sm font-semibold transition-all ${isSelected
                              ? "border-[#136C5B] bg-[#136C5B] text-white shadow-md"
                              : isAvailable
                                ? "border-gray-300 text-gray-700 hover:border-gray-400 bg-white"
                                : "border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed"
                              }`}
                          >
                            {size.display || size.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* Stock Availability */}
              {selectedVariant && (
                <div className="mb-4">
                  <span
                    className={`text-sm font-medium ${selectedVariant.quantity > 0
                      ? "text-green-600"
                      : "text-red-600"
                      }`}
                  >
                    {selectedVariant.quantity > 0
                      ? `✓ In Stock (${selectedVariant.quantity} available)`
                      : "✗ Out of Stock"}
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid md:grid-cols-2 gap-3 mt-auto pt-2">
                <Button
                  onClick={handleAddToCart}
                  className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold text-sm uppercase tracking-wide rounded-none"
                  disabled={
                    loading ||
                    addingToCart ||
                    (!selectedVariant &&
                      (!productDetails?.variants ||
                        productDetails.variants.length === 0)) ||
                    (selectedVariant && selectedVariant.quantity < 1)
                  }
                >
                  {addingToCart ? (
                    <>
                      <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mr-2"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      ADD TO BAG
                    </>
                  )}
                </Button>

                <Link href={`/products/${displayProduct.slug}`}>
                  <Button className="w-full py-4 bg-[#136C5B] hover:bg-[#0f5a4a] text-white font-semibold text-sm uppercase tracking-wide rounded-none">
                    BUY NOW
                  </Button>
                </Link>
              </div>
              <Link
                href={`/products/${displayProduct.slug}`}
                className="text-center text-sm text-[#136C5B] hover:underline font-medium mt-4"
              >
                PRODUCT DETAILS
              </Link>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
