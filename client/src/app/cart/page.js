"use client";

import React, { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

// Helper function to format image URLs correctly
const getImageUrl = (image) => {
  if (!image) return "/placeholder.jpg";
  if (image.startsWith("http")) return image;
  return `https://desirediv-storage.blr1.digitaloceanspaces.com/${image}`;
};

// Cart item component to optimize re-renders
const CartItem = React.memo(
  ({ item, onUpdateQuantity, onRemove, isLoading }) => {
    // Get product image - priority: variant images > product image > item image > placeholder
    const getProductImage = () => {
      // Priority 1: Variant images (from server cart)
      if (item.variant?.images && Array.isArray(item.variant.images) && item.variant.images.length > 0) {
        const primaryImage = item.variant.images.find((img) => img.isPrimary);
        const imageUrl = primaryImage?.url || item.variant.images[0]?.url;
        if (imageUrl) return getImageUrl(imageUrl);
      }
      
      // Priority 2: Product image (from server cart)
      if (item.product?.image) {
        return getImageUrl(item.product.image);
      }
      
      // Priority 3: Direct image property (from guest cart)
      if (item.image) {
        return getImageUrl(item.image);
      }
      
      // Fallback to placeholder
      return "/placeholder.jpg";
    };

    // Get variant display name - handle both guest cart and server cart structures
    const getVariantName = () => {
      // If variantName exists and is not empty, use it
      if (item.variantName && item.variantName.trim() !== "") {
        return item.variantName;
      }
      
      // Try to get color and size from variant object (server cart)
      let color = item.variant?.color?.name;
      let size = item.variant?.size?.name;
      
      // Fallback to direct properties (guest cart or legacy)
      if (!color) color = item.color?.name;
      if (!size) size = item.size?.name;
      
      // Build variant string
      if (color && size) {
        return `${color} • ${size}`;
      } else if (color) {
        return color;
      } else if (size) {
        return size;
      }
      
      // Return null if no variant info - don't show "Standard"
      return null;
    };

    const variantName = getVariantName();
    const productImage = getProductImage();
    const productName = item.productName || item.product?.name || "Product";
    const productSlug = item.productSlug || item.product?.slug || "#";

    return (
      <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-6 flex items-center">
          <div className="relative h-20 w-20 bg-gray-100 rounded overflow-hidden mr-4 flex-shrink-0">
            <Image
              src={productImage}
              alt={productName}
              fill
              className="object-cover"
              sizes="80px"
            />
          </div>
          <div>
            <Link
              href={`/products/${productSlug}`}
              className="font-medium hover:text-[#166454] transition-colors"
            >
              {productName}
            </Link>
            {variantName && (
              <div className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                {(item.variant?.color?.hexCode || item.color?.hexCode) && (
                  <div
                    className="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0"
                    style={{ 
                      backgroundColor: item.variant?.color?.hexCode || item.color?.hexCode 
                    }}
                  />
                )}
                <span className="truncate">{variantName}</span>
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-2 flex items-center justify-between md:justify-center">
          <span className="md:hidden">Price:</span>
          <span className="font-medium">{formatCurrency(item.price)}</span>
        </div>

        <div className="md:col-span-2 flex items-center justify-between md:justify-center">
          <span className="md:hidden">Quantity:</span>
          <div className="flex items-center border rounded-md">
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity, -1)}
              className="px-2 py-1 hover:bg-gray-100 disabled:opacity-50"
              disabled={isLoading || item.quantity <= 1}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="px-3 py-1">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin inline" />
              ) : (
                item.quantity
              )}
            </span>
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity, 1)}
              className="px-2 py-1 hover:bg-gray-100 disabled:opacity-50"
              disabled={isLoading}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="md:col-span-2 flex items-center justify-between md:justify-center">
          <div className="flex items-center md:block">
            <span className="md:hidden mr-2">Subtotal:</span>
            <span className="font-medium">{formatCurrency(item.subtotal)}</span>
          </div>
          <button
            onClick={() => onRemove(item.id)}
            className="text-red-500 hover:text-red-700 ml-4 disabled:opacity-50"
            aria-label="Remove item"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Trash2 className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    );
  }
);
CartItem.displayName = "CartItem";

export default function CartPage() {
  const {
    cart,
    loading,
    cartItemsLoading,
    error,
    removeFromCart,
    updateCartItem,
    clearCart,
    applyCoupon,
    removeCoupon,
    coupon,
    couponLoading,
    getCartTotals,
    isAuthenticated,
    mergeProgress,
  } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const router = useRouter();

  // Use useCallback to memoize handlers
  const handleQuantityChange = useCallback(
    async (cartItemId, currentQuantity, change) => {
      const newQuantity = currentQuantity + change;
      if (newQuantity < 1) return;

      try {
        await updateCartItem(cartItemId, newQuantity);
        // Toast notification for success
        toast.success("Cart updated successfully");
      } catch (err) {
        console.error("Error updating quantity:", err);
        toast.error(err.message || "Failed to update quantity");
      }
    },
    [updateCartItem]
  );

  const handleRemoveItem = useCallback(
    async (cartItemId) => {
      try {
        await removeFromCart(cartItemId);
        toast.success("Item removed from cart");
      } catch (err) {
        console.error("Error removing item:", err);
        toast.error("Failed to remove item");
      }
    },
    [removeFromCart]
  );

  const handleClearCart = useCallback(async () => {
    if (window.confirm("Are you sure you want to clear your cart?")) {
      try {
        await clearCart();
        toast.success("Cart has been cleared");
      } catch (err) {
        console.error("Error clearing cart:", err);
        toast.error("Failed to clear cart");
      }
    }
  }, [clearCart]);

  const handleApplyCoupon = useCallback(
    async (e) => {
      e.preventDefault();

      if (!couponCode.trim()) {
        setCouponError("Please enter a coupon code");
        return;
      }

      setCouponError("");

      try {
        await applyCoupon(couponCode);
        setCouponCode("");
      } catch (err) {
        setCouponError(err.message || "Invalid coupon code");
        toast.error(err.message || "Invalid coupon code");
      }
    },
    [couponCode, applyCoupon]
  );

  const handleRemoveCoupon = useCallback(() => {
    removeCoupon();
    setCouponCode("");
    setCouponError("");
    toast.success("Coupon removed");
  }, [removeCoupon]);

  // Memoize cart totals to prevent re-renders
  const totals = useMemo(() => getCartTotals(), [getCartTotals, cart, coupon]);

  const handleCheckout = useCallback(() => {
    // Ensure minimum amount is 1
    const calculatedAmount = totals.subtotal - totals.discount;
    if (calculatedAmount < 1) {
      toast.info("Minimum order amount is ₹1");
      return;
    }

    if (!isAuthenticated) {
      router.push("/auth?redirect=checkout");
    } else {
      router.push("/checkout");
    }
  }, [isAuthenticated, router, totals]);

  // Display loading state
  if (loading && (!cart.items || cart.items.length === 0)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Your Cart</h1>
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-[#166454] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // Display empty cart - but not when there's an error
  if ((!cart.items || cart.items.length === 0) && !error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-6">Your Cart</h1>
        <div className="bg-white p-8 rounded-lg shadow-sm text-center border">
          <div className="inline-flex justify-center items-center bg-gray-100 p-6 rounded-full mb-4">
            <ShoppingBag className="h-12 w-12 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold mb-3">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">
            Looks like you haven&apos;t added any products to your cart yet.
          </p>
          <Link href="/products">
            <Button>Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>

      {/* Guest cart notice */}
      {!isAuthenticated && cart.items.length > 0 && (
        <div className="bg-gradient-to-r from-orange-500/10 to-blue-500/10 border border-orange-200 p-6 rounded-lg flex items-start mb-6 shadow-sm">
          <div className="flex-shrink-0 mr-4">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-blue-500 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Guest Shopping Cart
            </h2>
            <p className="text-gray-700 mb-4 leading-relaxed">
              You&apos;re currently shopping as a guest. To complete your
              purchase and save your cart items for future visits, please log in
              to your account.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/auth?redirect=cart">
                <Button className="bg-gradient-to-r from-orange-500 to-blue-500 hover:from-orange-600 hover:to-blue-600 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105">
                  Log In to Continue
                </Button>
              </Link>
              <Link href="/auth?redirect=cart">
                <Button
                  variant="outline"
                  className="border-2 border-gray-300 hover:border-[#166454] text-gray-700 hover:text-[#166454] font-semibold px-6 py-3 rounded-lg transition-all duration-200"
                >
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Show merge progress */}
      {mergeProgress && (
        <div className="bg-blue-50 p-4 rounded-md flex items-start mb-6">
          <Loader2 className="text-blue-500 mr-3 mt-0.5 flex-shrink-0 animate-spin" />
          <div>
            <h2 className="text-lg font-semibold text-blue-700">
              Merging Cart
            </h2>
            <p className="text-blue-600">{mergeProgress}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b bg-gray-50">
              <div className="col-span-6 font-medium">Product</div>
              <div className="col-span-2 font-medium text-center">Price</div>
              <div className="col-span-2 font-medium text-center">Quantity</div>
              <div className="col-span-2 font-medium text-center">Subtotal</div>
            </div>

            {/* Cart Items */}
            <div className="divide-y">
              {cart.items.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onUpdateQuantity={handleQuantityChange}
                  onRemove={handleRemoveItem}
                  isLoading={cartItemsLoading[item.id]}
                />
              ))}
            </div>

            {/* Cart Actions */}
            <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
              <Link href="/products">
                <Button variant="outline">Continue Shopping</Button>
              </Link>
              <Button
                variant="outline"
                onClick={handleClearCart}
                className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-500"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Clear Cart
              </Button>
            </div>
          </div>
        </div>

        {/* Cart Summary Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h2 className="text-lg font-bold mb-4">Cart Summary</h2>

            {/* Apply Coupon */}
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-2">Have a coupon?</h3>
              {coupon ? (
                <div className="flex justify-between items-center bg-green-50 p-3 rounded-md border border-green-200">
                  <div>
                    <span className="font-medium text-green-700">
                      {coupon.code}
                    </span>
                    <p className="text-xs text-green-600 mt-1">
                      {coupon.discountType === "PERCENTAGE"
                        ? `${coupon.discountValue}% off`
                        : `₹${coupon.discountValue} off`}
                    </p>
                    {coupon.applicableSubtotal && (
                      <p className="text-xs text-green-600 mt-1">
                        Applies to {formatCurrency(coupon.applicableSubtotal)} worth of
                        {" "}
                        {coupon.matchedItems === 1 ? "eligible item" : "eligible items"}
                        {cart.items?.length
                          ? ` (${coupon.matchedItems || 0} of ${cart.items.length})`
                          : ""}
                      </p>
                    )}
                    {((parseFloat(coupon.discountValue) > 90 &&
                      coupon.discountType === "PERCENTAGE") ||
                      coupon.isDiscountCapped) && (
                        <p className="text-xs text-amber-600 mt-1">
                          *Maximum discount capped at 90%
                        </p>
                      )}
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-sm text-red-500 hover:text-red-700"
                    disabled={couponLoading}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <form onSubmit={handleApplyCoupon} className="flex space-x-2">
                    <Input
                      type="text"
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) =>
                        setCouponCode(e.target.value.toUpperCase())
                      }
                      className={`flex-1 ${couponError
                        ? "border-red-300 focus-visible:ring-red-300"
                        : ""
                        }`}
                    />
                    <Button
                      type="submit"
                      disabled={couponLoading}
                      variant="outline"
                    >
                      {couponLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Apply"
                      )}
                    </Button>
                  </form>
                  <p className="text-xs text-muted-foreground mt-1">
                    *Maximum discount limited to 90% of cart value
                  </p>
                  {couponError && (
                    <div className="mt-2 flex items-start gap-1.5 text-red-600">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <p className="text-xs">{couponError}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Price Details */}
            <div className="border-t pt-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatCurrency(totals.subtotal)}</span>
                </div>

                {coupon && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(totals.discount)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-green-600 font-medium">FREE</span>
                </div>
              </div>

              <div className="flex justify-between font-bold text-lg mt-4 pt-4 border-t">
                <span>Total</span>
                <span>{formatCurrency(totals.subtotal - totals.discount)}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <Button
              className="w-full mt-6 bg-[#166454] hover:bg-[#0d4a3d] text-white shadow-lg hover:shadow-xl transition-all duration-200"
              size="lg"
              onClick={handleCheckout}
            >
              <span className="flex items-center justify-center">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Proceed to Checkout • {formatCurrency(totals.subtotal - totals.discount)}
              </span>
            </Button>

            <p className="text-xs text-gray-500 mt-4 text-center">
              Taxes and shipping calculated at checkout
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
