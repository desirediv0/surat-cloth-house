"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { fetchApi, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Star,
  Minus,
  Plus,
  AlertCircle,
  ShoppingCart,
  Heart,
  ChevronRight,
  CheckCircle,
} from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import ReviewSection from "./ReviewSection";
import { useAddVariantToCart } from "@/lib/cart-utils";

export default function ProductContent({ slug }) {
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mainImage, setMainImage] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [cartSuccess, setCartSuccess] = useState(false);
  const [selectedShade, setSelectedShade] = useState(null);
  const [availableCombinations, setAvailableCombinations] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [sizesOrderMap, setSizesOrderMap] = useState({});
  const [colorsOrderMap, setColorsOrderMap] = useState({});

  const { addToCart } = useCart();
  const { addVariantToCart } = useAddVariantToCart();

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

        // Fetch colors order (if order field exists in API)
        try {
          const colorsResponse = await fetchApi("/public/colors");
          if (colorsResponse?.data?.colors) {
            const colorsMap = {};
            colorsResponse.data.colors.forEach((color) => {
              // Color order might not be in API, use name as fallback
              colorsMap[color.id] = color.order || 0;
            });
            setColorsOrderMap(colorsMap);
          }
        } catch (err) {
          // Colors API might not have order, that's okay
          console.log("Colors order not available");
        }
      } catch (err) {
        console.error("Error fetching order maps:", err);
        // Continue without order maps
      }
    };

    if (slug) {
      fetchOrderMaps();
    }
  }, [slug]);

  // Fetch product details
  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoading(true);
      setInitialLoading(true);
      try {
        const response = await fetchApi(`/public/products/${slug}`);
        const productData = response.data.product;

        // Sort sizeOptions by order if available
        if (productData.sizeOptions && productData.sizeOptions.length > 0) {
          productData.sizeOptions = [...productData.sizeOptions].sort(
            (a, b) => {
              const aOrder =
                sizesOrderMap[a.id] ??
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

        // Sort colorOptions by order if available (colors might not have order, so use name as fallback)
        if (productData.colorOptions && productData.colorOptions.length > 0) {
          productData.colorOptions = [...productData.colorOptions].sort(
            (a, b) => {
              // Try to get order from colorsOrderMap or variant color order
              const aOrder =
                colorsOrderMap[a.id] ??
                productData.variants?.find(
                  (v) => v.color?.id === a.id || v.colorId === a.id
                )?.color?.order ??
                999;
              const bOrder =
                colorsOrderMap[b.id] ??
                productData.variants?.find(
                  (v) => v.color?.id === b.id || v.colorId === b.id
                )?.color?.order ??
                999;

              // If both have order, sort by order, otherwise sort by name
              if (aOrder !== 999 || bOrder !== 999) {
                return aOrder - bOrder;
              }
              return (a.name || "").localeCompare(b.name || "");
            }
          );
        }

        setProduct(productData);
        setRelatedProducts(response.data.relatedProducts || []);

        // Set main image
        if (productData.images && productData.images.length > 0) {
          setMainImage(productData.images[0]);
        }

        // Extract all available combinations from variants
        if (productData.variants && productData.variants.length > 0) {
          const combinations = productData.variants
            .filter((v) => v.isActive && v.quantity > 0)
            .map((variant) => ({
              colorId: variant.colorId,
              sizeId: variant.sizeId,
              variant: variant,
            }));

          setAvailableCombinations(combinations);

          // Set default color and size if available
          if (productData.colorOptions && productData.colorOptions.length > 0) {
            const firstColor = productData.colorOptions[0];
            setSelectedColor(firstColor);

            // Find matching sizes for this color
            const matchingVariant = combinations.find(
              (combo) => combo.colorId === firstColor.id
            );

            if (matchingVariant && productData.sizeOptions) {
              const matchingSize = productData.sizeOptions.find(
                (size) => size.id === matchingVariant.sizeId
              );

              if (matchingSize) {
                setSelectedSize(matchingSize);
                setSelectedVariant(matchingVariant.variant);
              }
            }
          } else if (
            productData.sizeOptions?.length > 0 &&
            combinations.length > 0
          ) {
            // No colors, but sizes and variants exist
            const firstSize = productData.sizeOptions[0];
            setSelectedSize(firstSize);
            // Find the variant for this size
            const matchingVariant = combinations.find(
              (combo) => combo.sizeId === firstSize.id
            );
            if (matchingVariant) {
              setSelectedVariant(matchingVariant.variant);
            }
          } else if (productData.variants.length > 0) {
            // Fallback: just pick the first variant
            setSelectedVariant(productData.variants[0]);
          }
        }
      } catch (err) {
        console.error("Error fetching product details:", err);
        setError(err.message);
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    };

    if (slug) {
      fetchProductDetails();
    }
  }, [slug, sizesOrderMap, colorsOrderMap]);



  // Get available sizes for a specific color
  const getAvailableSizesForColor = (colorId) => {
    const availableSizes = availableCombinations
      .filter((combo) => combo.colorId === colorId)
      .map((combo) => combo.sizeId);

    return availableSizes;
  };

  // Get available colors for a specific size
  const getAvailableColorsForSize = (sizeId) => {
    const availableColors = availableCombinations
      .filter((combo) => combo.sizeId === sizeId)
      .map((combo) => combo.colorId);

    return availableColors;
  };

  // Handle color change
  const handleColorChange = (color) => {
    setSelectedColor(color);

    // Find available sizes for this color
    const availableSizeIds = getAvailableSizesForColor(color.id);

    if (product?.sizeOptions?.length > 0 && availableSizeIds.length > 0) {
      // Use currently selected size if it's compatible with the new color
      if (selectedSize && availableSizeIds.includes(selectedSize.id)) {
        // Current size is compatible, keep it selected
        const matchingVariant = availableCombinations.find(
          (combo) =>
            combo.colorId === color.id && combo.sizeId === selectedSize.id
        );

        if (matchingVariant) {
          setSelectedVariant(matchingVariant.variant);
        }
      } else {
        // Current size is not compatible, switch to first available
        const firstAvailableSize = product.sizeOptions.find((size) =>
          availableSizeIds.includes(size.id)
        );

        if (firstAvailableSize) {
          setSelectedSize(firstAvailableSize);

          // Find the corresponding variant
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

    // Find available colors for this size
    const availableColorIds = getAvailableColorsForSize(size.id);

    if (product?.colorOptions?.length > 0 && availableColorIds.length > 0) {
      // Use currently selected color if it's compatible with the new size
      if (selectedColor && availableColorIds.includes(selectedColor.id)) {
        // Current color is compatible, keep it selected
        const matchingVariant = availableCombinations.find(
          (combo) =>
            combo.sizeId === size.id && combo.colorId === selectedColor.id
        );

        if (matchingVariant) {
          setSelectedVariant(matchingVariant.variant);
        }
      } else {
        // Current color is not compatible, switch to first available
        const firstAvailableColor = product.colorOptions.find((color) =>
          availableColorIds.includes(color.id)
        );

        if (firstAvailableColor) {
          setSelectedColor(firstAvailableColor);

          // Find the corresponding variant
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
      // No colors, just pick the variant for this size
      const matchingVariant = availableCombinations.find(
        (combo) => combo.sizeId === size.id
      );
      if (matchingVariant) {
        setSelectedVariant(matchingVariant.variant);
      }
    }
  };

  // Check if product is in wishlist
  useEffect(() => {
    const checkWishlistStatus = async () => {
      if (!isAuthenticated || !product) return;

      try {
        const response = await fetchApi("/users/wishlist", {
          credentials: "include",
        });

        const wishlistItems = response.data.wishlistItems || [];
        const inWishlist = wishlistItems.some(
          (item) => item.productId === product.id
        );
        setIsInWishlist(inWishlist);
      } catch (error) {
        console.error("Failed to check wishlist status:", error);
      }
    };

    checkWishlistStatus();
  }, [isAuthenticated, product]);

  // Handle quantity change
  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity < 1) return;
    if (
      selectedVariant &&
      selectedVariant.quantity > 0 &&
      newQuantity > selectedVariant.quantity
    )
      return;
    setQuantity(newQuantity);
  };

  // Handle add to cart
  const handleAddToCart = async () => {
    if (!selectedVariant) {
      // If no variant is selected but product has variants, use the first one
      if (product?.variants && product.variants.length > 0) {
        setIsAddingToCart(true);
        setCartSuccess(false);

        try {
          const result = await addVariantToCart(
            product.variants[0],
            quantity,
            product.name
          );
          if (result.success) {
            setCartSuccess(true);
            // Clear success message after 3 seconds
            setTimeout(() => {
              setCartSuccess(false);
            }, 3000);
          }
        } catch (err) {
          console.error("Error adding to cart:", err);
        } finally {
          setIsAddingToCart(false);
        }
      }
      return;
    }

    setIsAddingToCart(true);
    setCartSuccess(false);

    try {
      const result = await addVariantToCart(
        selectedVariant,
        quantity,
        product.name
      );
      if (result.success) {
        setCartSuccess(true);
        // Clear success message after 3 seconds
        setTimeout(() => {
          setCartSuccess(false);
        }, 3000);
      }
    } catch (err) {
      console.error("Error adding to cart:", err);
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Handle buy now - add to cart and redirect to checkout
  const handleBuyNow = async () => {
    const variantToUse = selectedVariant || (product?.variants && product.variants.length > 0 ? product.variants[0] : null);

    if (!variantToUse) {
      return;
    }

    setIsAddingToCart(true);

    try {
      const result = await addVariantToCart(
        variantToUse,
        quantity,
        product.name
      );
      if (result.success) {
        // Redirect to checkout
        router.push("/checkout");
      }
    } catch (err) {
      console.error("Error adding to cart:", err);
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Render product images - now supports variant images with improved fallback
  const renderImages = () => {
    let imagesToShow = [];

    // Priority 1: Selected variant images
    if (
      selectedVariant &&
      selectedVariant.images &&
      selectedVariant.images.length > 0
    ) {
      imagesToShow = selectedVariant.images;
    }
    // Priority 2: Product images
    else if (product && product.images && product.images.length > 0) {
      imagesToShow = product.images;
    }
    // Priority 3: Any variant images from any variant
    else if (product && product.variants && product.variants.length > 0) {
      const variantWithImages = product.variants.find(
        (variant) => variant.images && variant.images.length > 0
      );
      if (variantWithImages) {
        imagesToShow = variantWithImages.images;
      }
    }

    // If still no images available
    if (imagesToShow.length === 0) {
      return (
        <div className="relative aspect-square w-full bg-gray-100 rounded-lg overflow-hidden">
          <Image
            src="/images/product-placeholder.jpg"
            alt={product?.name || "Product"}
            fill
            className="object-contain"
            priority
          />
        </div>
      );
    }

    // If there's only one image
    if (imagesToShow.length === 1) {
      return (
        <div className="relative aspect-square w-full bg-gray-100 rounded-lg overflow-hidden">
          <Image
            src={getImageUrl(imagesToShow[0].url)}
            alt={product?.name || "Product"}
            fill
            className="object-contain"
            priority
          />
        </div>
      );
    }

    // Find primary image or use first one
    const primaryImage =
      imagesToShow.find((img) => img.isPrimary) || imagesToShow[0];
    const currentMainImage =
      mainImage && imagesToShow.some((img) => img.url === mainImage.url)
        ? mainImage
        : primaryImage;

    // Main image display
    return (
      <div className="space-y-4">
        <div className="relative aspect-square w-full bg-gray-100 rounded-lg overflow-hidden">
          <Image
            src={getImageUrl(currentMainImage?.url)}
            alt={product?.name || "Product"}
            fill
            className="object-contain"
            priority
          />
        </div>

        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
          {imagesToShow.map((image, index) => (
            <div
              key={index}
              className={`relative aspect-square w-full bg-gray-100 rounded-lg overflow-hidden cursor-pointer border-2 ${currentMainImage?.url === image.url
                ? "border-primary"
                : "border-transparent"
                }`}
              onClick={() => setMainImage(image)}
            >
              <Image
                src={getImageUrl(image.url)}
                alt={`${product.name} - Image ${index + 1}`}
                fill
                className="object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Get image URL helper
  const getImageUrl = (image) => {
    if (!image) return "/images/product-placeholder.jpg";
    if (image.startsWith("http")) return image;
    return `https://desirediv-storage.blr1.cdn.digitaloceanspaces.com/${image}`;
  };

  // Calculate discount percentage
  const calculateDiscount = (regularPrice, salePrice) => {
    if (!regularPrice || !salePrice || regularPrice <= salePrice) return 0;
    return Math.round(((regularPrice - salePrice) / regularPrice) * 100);
  };

  // Format price display
  const getPriceDisplay = () => {
    // Show loading state while initial data is being fetched
    if (initialLoading) {
      return <div className="h-8 w-32 bg-gray-200 animate-pulse rounded"></div>;
    }

    // If we have a selected variant, use its price
    if (selectedVariant) {
      const variantPrice = selectedVariant.price || selectedVariant.salePrice || 0;
      const variantSalePrice = selectedVariant.salePrice;
      const variantRegularPrice = selectedVariant.price;

      if (variantSalePrice && variantSalePrice > 0 && variantRegularPrice && variantRegularPrice > variantSalePrice) {
        const discount = calculateDiscount(variantRegularPrice, variantSalePrice);
        return (
          <div className="space-y-2">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-3xl md:text-4xl font-bold text-primary">
                {formatCurrency(variantSalePrice)}
              </span>
              <span className="text-xl md:text-2xl text-gray-500 line-through">
                {formatCurrency(variantRegularPrice)}
              </span>
              {discount > 0 && (
                <span className="bg-red-500 text-white text-xs md:text-sm font-bold px-2 md:px-3 py-1 rounded">
                  {discount}% OFF
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">Inclusive of all taxes</p>
          </div>
        );
      }

      if (variantPrice > 0) {
        return (
          <div className="space-y-2">
            <span className="text-3xl md:text-4xl font-bold text-primary">
              {formatCurrency(variantPrice)}
            </span>
            <p className="text-xs text-gray-500">Inclusive of all taxes</p>
          </div>
        );
      }
    }

    // Fallback to product base price if no variant is selected
    if (product) {
      const basePrice = product.basePrice || 0;
      const regularPrice = product.regularPrice || 0;

      if (product.hasSale && basePrice > 0 && regularPrice > basePrice) {
        const discount = calculateDiscount(regularPrice, basePrice);
        return (
          <div className="space-y-2">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-3xl md:text-4xl font-bold text-primary">
                {formatCurrency(basePrice)}
              </span>
              <span className="text-xl md:text-2xl text-gray-500 line-through">
                {formatCurrency(regularPrice)}
              </span>
              {discount > 0 && (
                <span className="bg-red-500 text-white text-xs md:text-sm font-bold px-2 md:px-3 py-1 rounded">
                  {discount}% OFF
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">Inclusive of all taxes</p>
          </div>
        );
      }

      if (basePrice > 0) {
        return (
          <div className="space-y-2">
            <span className="text-3xl md:text-4xl font-bold text-primary">
              {formatCurrency(basePrice)}
            </span>
            <p className="text-xs text-gray-500">Inclusive of all taxes</p>
          </div>
        );
      }
    }

    // Final fallback - show placeholder
    return (
      <div className="space-y-2">
        <span className="text-3xl md:text-4xl font-bold text-gray-400">
          Price not available
        </span>
      </div>
    );
  };

  // Handle add to wishlist
  const handleAddToWishlist = async () => {
    if (!isAuthenticated) {
      router.push(`/auth?redirect=/products/${slug}`);
      return;
    }

    setIsAddingToWishlist(true);

    try {
      if (isInWishlist) {
        // Get wishlist to find the item ID
        const wishlistResponse = await fetchApi("/users/wishlist", {
          credentials: "include",
        });

        const wishlistItem = wishlistResponse.data.wishlistItems.find(
          (item) => item.productId === product.id
        );

        if (wishlistItem) {
          await fetchApi(`/users/wishlist/${wishlistItem.id}`, {
            method: "DELETE",
            credentials: "include",
          });

          setIsInWishlist(false);
        }
      } else {
        // Add to wishlist
        await fetchApi("/users/wishlist", {
          method: "POST",
          credentials: "include",
          body: JSON.stringify({ productId: product.id }),
        });

        setIsInWishlist(true);
      }
    } catch (error) {
      console.error("Error updating wishlist:", error);
    } finally {
      setIsAddingToWishlist(false);
    }
  };

  // Display loading state
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
          <p className="text-gray-600 text-lg">Loading product details...</p>
        </div>
      </div>
    );
  }

  // Display error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 p-6 rounded-lg shadow-sm border border-red-200 flex flex-col items-center text-center">
          <AlertCircle className="text-red-500 h-12 w-12 mb-4" />
          <h2 className="text-2xl font-semibold text-red-700 mb-2">
            Error Loading Product
          </h2>
          <p className="text-red-600 mb-6">{error}</p>
          <Link href="/products">
            <Button className="px-6">
              <ChevronRight className="mr-2 h-4 w-4" /> Browse Other Products
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // If product not found
  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 p-6 rounded-lg shadow-sm border border-yellow-200 flex flex-col items-center text-center">
          <AlertCircle className="text-yellow-500 h-12 w-12 mb-4" />
          <h2 className="text-2xl font-semibold text-yellow-700 mb-2">
            Product Not Found
          </h2>
          <p className="text-yellow-600 mb-6">
            The product you are looking for does not exist or has been removed.
          </p>
          <Link href="/products">
            <Button className="px-6">
              <ChevronRight className="mr-2 h-4 w-4" /> Browse Products
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Updated render code for the product image carousel
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      {/* Breadcrumbs */}
      <div className="flex items-center text-xs sm:text-sm mb-6 md:mb-8 flex-wrap">
        <Link href="/" className="text-gray-500 hover:text-primary transition-colors">
          HOME
        </Link>
        <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 mx-1 sm:mx-2 text-gray-400" />
        <Link href="/products" className="text-gray-500 hover:text-primary transition-colors">
          PRODUCTS
        </Link>
        {(product?.category || product?.categories?.[0]?.category) && (
          <>
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 mx-1 sm:mx-2 text-gray-400" />
            <Link
              href={`/category/${product.category?.slug || product.categories[0]?.category?.slug
                }`}
              className="text-gray-500 hover:text-primary transition-colors uppercase"
            >
              {product.category?.name || product.categories[0]?.category?.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 mx-1 sm:mx-2 text-gray-400" />
        <span className="text-primary font-medium truncate max-w-[200px] sm:max-w-none">{product?.name}</span>
      </div>

      {/* Product Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Product Images */}
        <div className="w-full">
          {loading ? (
            <div className="aspect-square w-full bg-gray-100 rounded-lg animate-pulse"></div>
          ) : error ? (
            <div className="aspect-square w-full bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center p-6">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          ) : (
            renderImages()
          )}
        </div>

        {/* Right Column - Product Details */}
        <div className="flex flex-col space-y-6">
          {/* Brand name (show plain text regardless of shape) */}
          {product.brand && (
            <Link
              href={`/brand/${product.brand.slug}`}
              className="text-orange-500 text-sm mb-1"
            >
              {product.brand?.name ?? product.brand ?? product.brandName ?? ""}
            </Link>
          )}

          {/* Product name */}
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 uppercase tracking-wide">
            {product.name}
          </h1>

          {/* Rating */}
          <div className="flex items-center mb-4">
            <div className="flex text-yellow-400 mr-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="h-4 w-4 md:h-5 md:w-5"
                  fill={
                    i < Math.round(product.avgRating || 0)
                      ? "currentColor"
                      : "none"
                  }
                />
              ))}
            </div>
            <span className="text-sm text-gray-500">
              {product.avgRating
                ? `${product.avgRating} (${product.reviewCount} reviews)`
                : "No reviews yet"}
            </span>
          </div>

          {/* Price */}
          <div className="mb-6">{getPriceDisplay()}</div>

          {/* Short Description */}
          {product.shortDescription && (
            <div className="p-4 border border-gray-200 rounded-md mb-6 bg-white">
              <p className="text-gray-700">
                {product.shortDescription ||
                  product.description?.substring(0, 150)}
                {product.description?.length > 150 &&
                  !product.shortDescription &&
                  "..."}
              </p>
            </div>
          )}

          {/* Color Selection */}
          {product.colorOptions && product.colorOptions.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-3 uppercase tracking-wide">SELECT COLOR</h3>
              <div className="flex flex-wrap gap-3 items-center">
                {product.colorOptions.map((color) => {
                  // Check if this color has any available combinations
                  const availableSizeIds = getAvailableSizesForColor(color.id);
                  const isAvailable = availableSizeIds.length > 0;
                  const isSelected = selectedColor?.id === color.id;

                  return (
                    <button
                      key={color.id}
                      className={`flex flex-col items-center gap-2 transition-all ${!isAvailable ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                      onClick={() => isAvailable && handleColorChange(color)}
                      disabled={!isAvailable}
                      title={color.name}
                    >
                      {color.hexCode ? (
                        <div
                          className={`w-12 h-12 md:w-14 md:h-14 rounded-full border-2 transition-all ${isSelected
                              ? "border-primary ring-2 ring-primary ring-offset-2"
                              : isAvailable
                                ? "border-gray-300 hover:border-gray-500"
                                : "border-gray-200"
                            }`}
                          style={{ backgroundColor: color.hexCode }}
                        />
                      ) : (
                        <div
                          className={`w-12 h-12 md:w-14 md:h-14 rounded-full border-2 transition-all flex items-center justify-center text-xs ${isSelected
                              ? "border-primary bg-primary text-white ring-2 ring-primary ring-offset-2"
                              : isAvailable
                                ? "border-gray-300 hover:border-gray-500"
                                : "border-gray-200"
                            }`}
                        >
                          {color.name.charAt(0)}
                        </div>
                      )}
                      <span className={`text-xs ${isSelected ? "font-semibold text-primary" : "text-gray-700"}`}>
                        {color.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Size Selection */}
          {product.sizeOptions && product.sizeOptions.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide">SELECT SIZE</h3>
                <Link href="#size-guide" className="text-xs text-gray-500 hover:text-primary flex items-center gap-1">
                  <span>Size Guide</span>
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizeOptions.map((size) => {
                  // Check if this size has any available combinations with the selected color
                  const availableColorIds = getAvailableColorsForSize(size.id);
                  const isAvailable = selectedColor
                    ? availableCombinations.some(
                      (combo) =>
                        combo.colorId === selectedColor.id &&
                        combo.sizeId === size.id
                    )
                    : availableColorIds.length > 0;
                  const isSelected = selectedSize?.id === size.id;

                  return (
                    <button
                      key={size.id}
                      className={`w-12 h-12 md:w-14 md:h-14 rounded-full border-2 text-sm font-medium transition-all flex items-center justify-center ${isSelected
                          ? "border-primary bg-primary text-white"
                          : isAvailable
                            ? "border-gray-300 hover:border-gray-500 text-gray-700"
                            : "border-gray-200 text-gray-400 cursor-not-allowed"
                        }`}
                      onClick={() => isAvailable && handleSizeChange(size)}
                      disabled={!isAvailable}
                      title={size.display || size.name}
                    >
                      {size.display || size.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Success/Error Messages */}
          {cartSuccess && (
            <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm rounded-md flex items-center border border-green-200">
              <CheckCircle className="h-4 w-4 mr-2" />
              Item successfully added to your cart!
            </div>
          )}

          <div className="mb-4">
            {selectedVariant && selectedVariant.quantity > 0 && (
              <div className="p-2 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                In Stock ({selectedVariant.quantity} available)
              </div>
            )}
            {selectedVariant && selectedVariant.quantity === 0 && (
              <div className="p-2 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm flex items-center">
                <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                Out of stock
              </div>
            )}
          </div>

          {/* Quantity Selector */}
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-3 uppercase">Quantity</h3>
            <div className="flex items-center">
              <button
                className="p-2 border rounded-l-sm hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1 || isAddingToCart}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="px-6 py-2 border-t border-b min-w-[3rem] text-center font-medium">
                {quantity}
              </span>
              <button
                className="p-2 border rounded-r-sm hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handleQuantityChange(1)}
                disabled={
                  (selectedVariant &&
                    selectedVariant.quantity > 0 &&
                    quantity >= selectedVariant.quantity) ||
                  isAddingToCart
                }
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Button
              className="flex-1 flex items-center justify-center gap-2 py-4 md:py-6 text-base bg-primary hover:bg-primary/90 text-white rounded-md font-semibold uppercase tracking-wide"
              size="lg"
              onClick={handleAddToCart}
              disabled={
                isAddingToCart ||
                (selectedVariant && selectedVariant.quantity < 1) ||
                (!selectedVariant &&
                  (!product?.variants ||
                    product.variants.length === 0 ||
                    product.variants[0].quantity < 1))
              }
            >
              {isAddingToCart ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Adding...
                </>
              ) : (
                <>
                  <ShoppingCart className="h-5 w-5" />
                  ADD TO BAG
                </>
              )}
            </Button>


            <Button
              variant="outline"
              className={`rounded-md py-6 ${isInWishlist
                ? "text-red-600 border-red-600 hover:bg-red-50"
                : "border-gray-300 hover:border-primary hover:text-primary"
                }`}
              size="icon"
              onClick={handleAddToWishlist}
              disabled={isAddingToWishlist}
            >
              <Heart
                className={`h-5 w-5 ${isInWishlist ? "fill-current" : ""}`}
              />
            </Button>
          </div>

          {/* Product Metadata */}
          <div className="border-t border-gray-200 pt-5 space-y-3 text-sm">
            {selectedVariant && selectedVariant.sku && (
              <div className="flex">
                <span className="font-medium w-32 text-gray-700">SKU:</span>
                <span className="text-gray-600">{selectedVariant.sku}</span>
              </div>
            )}

            {product.category && (
              <div className="flex">
                <span className="font-medium w-32 text-gray-700">
                  Category:
                </span>
                <Link
                  href={`/category/${product.category?.slug}`}
                  className="text-primary hover:underline"
                >
                  {product.category?.name}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Tabs */}
      <div className="mb-16">
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            <button
              className={`px-6 py-3 font-medium text-sm uppercase transition-colors ${activeTab === "description"
                ? "border-b-2 border-primary text-primary"
                : "text-gray-500 hover:text-gray-700"
                }`}
              onClick={() => setActiveTab("description")}
            >
              Description
            </button>
            <button
              className={`px-6 py-3 font-medium text-sm uppercase transition-colors ${activeTab === "reviews"
                ? "border-b-2 border-primary text-primary"
                : "text-gray-500 hover:text-gray-700"
                }`}
              onClick={() => setActiveTab("reviews")}
            >
              Reviews ({product.reviewCount || 0})
            </button>
            <button
              className={`px-6 py-3 font-medium text-sm uppercase transition-colors ${activeTab === "shipping"
                ? "border-b-2 border-primary text-primary"
                : "text-gray-500 hover:text-gray-700"
                }`}
              onClick={() => setActiveTab("shipping")}
            >
              Shipping & Returns
            </button>
          </div>
        </div>

        <div className="py-8">
          {activeTab === "description" && (
            <div className="prose max-w-none">
              <div className="mb-8">
                <p className="text-gray-700 leading-relaxed mb-6">
                  {product.description}
                </p>
              </div>

              {product.directions && (
                <div className="mt-8 p-6 bg-gray-50 rounded-md border border-gray-200">
                  <h3 className="text-xl font-bold mb-4 text-primary">
                    Directions for Use
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {product.directions}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "reviews" && <ReviewSection product={product} />}

          {activeTab === "shipping" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-lg mb-4">
                  Shipping Information
                </h3>
                <ul className="space-y-4">
                  <li className="pb-4 border-b border-gray-100">
                    <p className="font-medium mb-1">Delivery Time</p>
                    <p className="text-gray-600 text-sm">
                      3-5 business days (standard shipping)
                    </p>
                  </li>
                  <li className="pb-4 border-b border-gray-100">
                    <p className="font-medium mb-1">Free Shipping</p>
                    <p className="text-gray-600 text-sm">
                      Free shipping on all orders above ₹999
                    </p>
                  </li>
                  <li className="pb-4 border-b border-gray-100">
                    <p className="font-medium mb-1">Express Delivery</p>
                    <p className="text-gray-600 text-sm">
                      1-2 business days (₹199 extra)
                    </p>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-4">Return Policy</h3>
                <ul className="space-y-4">
                  <li className="pb-4 border-b border-gray-100">
                    <p className="font-medium mb-1">Return Window</p>
                    <p className="text-gray-600 text-sm">
                      30 days from the date of delivery
                    </p>
                  </li>
                  <li className="pb-4 border-b border-gray-100">
                    <p className="font-medium mb-1">Condition</p>
                    <p className="text-gray-600 text-sm">
                      Product must be unused and in original packaging
                    </p>
                  </li>
                  <li className="pb-4 border-b border-gray-100">
                    <p className="font-medium mb-1">Process</p>
                    <p className="text-gray-600 text-sm">
                      Initiate return from your account and we&apos;ll arrange
                      pickup
                    </p>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recently Viewed section would go here */}

      {/* Related Products */}
      {relatedProducts && relatedProducts.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6 relative border-b pb-2">
            <span className="bg-primary h-1 w-12 absolute bottom-0 left-0"></span>
            RELATED PRODUCTS
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((product) => {
              // Get image from lowest weight variant, or fallback
              const getRelatedProductImage = (product) => {
                if (product.variants && product.variants.length > 0) {
                  let selectedVariant = product.variants.reduce((min, v) => {
                    if (!v.weight || typeof v.weight.value !== "number")
                      return min;
                    if (
                      !min ||
                      (min.weight && v.weight.value < min.weight.value)
                    )
                      return v;
                    return min;
                  }, null);
                  if (!selectedVariant) selectedVariant = product.variants[0];
                  if (
                    selectedVariant.images &&
                    selectedVariant.images.length > 0
                  ) {
                    const primaryImg = selectedVariant.images.find(
                      (img) => img.isPrimary
                    );
                    if (primaryImg && primaryImg.url)
                      return getImageUrl(primaryImg.url);
                    if (selectedVariant.images[0].url)
                      return getImageUrl(selectedVariant.images[0].url);
                  }
                }
                if (product.image) return getImageUrl(product.image);
                return "/product-placeholder.jpg";
              };
              return (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="bg-white rounded-md overflow-hidden transition-all hover:shadow-lg border border-gray-200 group"
                >
                  <div className="relative h-64 w-full bg-gray-50 overflow-hidden">
                    <Image
                      src={getRelatedProductImage(product)}
                      alt={product.name}
                      fill
                      className="object-contain p-4 transition-transform group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />
                    {product.hasSale && (
                      <span className="absolute top-2 left-2 bg-primary text-white text-xs font-bold px-2 py-1 rounded">
                        SALE
                      </span>
                    )}

                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all"></div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-center mb-2">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className="h-4 w-4"
                            fill={
                              i < Math.round(product.avgRating || 0)
                                ? "currentColor"
                                : "none"
                            }
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500 ml-2">
                        ({product.reviewCount || 0})
                      </span>
                    </div>

                    <h3 className="font-bold mb-2 line-clamp-2 hover:text-primary transition-colors">
                      {product.name}
                    </h3>

                    <div>
                      {product.hasSale ? (
                        <div className="flex items-center">
                          <span className="font-bold text-primary text-lg">
                            {formatCurrency(product.basePrice)}
                          </span>
                          <span className="text-gray-500 line-through text-sm ml-2">
                            {formatCurrency(product.regularPrice)}
                          </span>
                        </div>
                      ) : (
                        <span className="font-bold text-primary text-lg">
                          {formatCurrency(product.basePrice)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
