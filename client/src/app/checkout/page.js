"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { fetchApi, formatCurrency, loadScript } from "@/lib/utils";
import { playSuccessSound, fireConfetti } from "@/lib/sound-utils";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  AlertCircle,
  Loader2,
  CheckCircle,
  MapPin,
  Plus,
  IndianRupee,
  ShoppingBag,
  PartyPopper,
  Gift,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import AddressForm from "@/components/AddressForm";
import Image from "next/image";

// Helper function to format image URLs correctly
const getImageUrl = (image) => {
  if (!image) return "/placeholder.jpg";
  if (image.startsWith("http")) return image;
  return `https://desirediv-storage.blr1.digitaloceanspaces.com/${image}`;
};

export default function CheckoutPage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const { cart, coupon, getCartTotals, clearCart } = useCart();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("RAZORPAY");
  const [processing, setProcessing] = useState(false);
  const [orderCreated, setOrderCreated] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [razorpayKey, setRazorpayKey] = useState("");
  const [error, setError] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [successAnimation, setSuccessAnimation] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(2); // Reduced from 3 to 2 seconds
  const [confettiCannon, setConfettiCannon] = useState(false);

  const totals = getCartTotals();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth?redirect=checkout");
    }
  }, [isAuthenticated, router]);

  // Redirect if cart is empty (but not if order is already created)
  useEffect(() => {
    if (isAuthenticated && cart.items?.length === 0 && !orderCreated) {
      router.push("/cart");
    }
  }, [isAuthenticated, cart, router, orderCreated]);

  // Fetch addresses
  const fetchAddresses = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoadingAddresses(true);
    try {
      const response = await fetchApi("/users/addresses", {
        credentials: "include",
      });

      if (response.success) {
        setAddresses(response.data.addresses || []);

        // Set the default address if available
        if (response.data.addresses?.length > 0) {
          const defaultAddress = response.data.addresses.find(
            (addr) => addr.isDefault
          );
          if (defaultAddress) {
            setSelectedAddressId(defaultAddress.id);
          } else {
            setSelectedAddressId(response.data.addresses[0].id);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
      toast.error("Failed to load your addresses");
    } finally {
      setLoadingAddresses(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  // Fetch Razorpay key
  useEffect(() => {
    const fetchRazorpayKey = async () => {
      try {
        const response = await fetchApi("/payment/razorpay-key", {
          credentials: "include",
        });
        if (response.success) {
          console.log("Razorpay key fetched successfully");
          setRazorpayKey(response.data.key);
        } else {
          console.error("Failed to fetch Razorpay key:", response);
        }
      } catch (error) {
        console.error("Error fetching Razorpay key:", error);
      }
    };

    if (isAuthenticated) {
      fetchRazorpayKey();
    }
  }, [isAuthenticated]);

  // Handle address selection
  const handleAddressSelect = (id) => {
    setSelectedAddressId(id);
  };

  // Handle payment method selection
  const handlePaymentMethodSelect = (method) => {
    setPaymentMethod(method);
  };

  // Handle address form success
  const handleAddressFormSuccess = () => {
    setShowAddressForm(false);
    fetchAddresses();
  };

  // Add countdown for redirect
  useEffect(() => {
    if (orderCreated && redirectCountdown > 0) {
      const timer = setTimeout(() => {
        setRedirectCountdown(redirectCountdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (orderCreated && redirectCountdown === 0) {
      router.push(`/account/orders`);
    }
  }, [orderCreated, redirectCountdown, router]);

  // Enhanced confetti effect when order is successful
  useEffect(() => {
    if (successAnimation) {
      // Trigger the celebration confetti
      fireConfetti.celebration();

      // Follow with just one more cannon after 1.5 seconds for lighter effect
      const timer = setTimeout(() => {
        setConfettiCannon(true);
        fireConfetti.sides();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [successAnimation]);

  // Update the payment handler with enhanced audio feedback
  const handleSuccessfulPayment = (paymentResponse, orderData) => {
    setPaymentId(paymentResponse.razorpay_payment_id);
    setOrderNumber(orderData.orderNumber || "");

    // Start success animation
    setSuccessAnimation(true);

    // Play a single success sound
    // Don't play both sounds as that might be too much
    playSuccessSound();

    // Clear cart after successful order
    clearCart();

    // Show enhanced success toast
    toast.success("Order placed successfully!", {
      duration: 4000,
      icon: <PartyPopper className="h-5 w-5 text-green-500" />,
      description: `Your order #${
        orderData.orderNumber || ""
      } has been confirmed. Redirecting to orders page...`,
    });

    // Set order created after a brief delay to ensure cart is cleared first
    setTimeout(() => {
      setOrderCreated(true);
    }, 100);
  };

  // Process checkout
  const handleCheckout = async () => {
    if (!selectedAddressId) {
      toast.error("Please select a shipping address");
      return;
    }

    setProcessing(true);
    setError("");

    try {
      // Get checkout amount
      const calculatedAmount = totals.subtotal - totals.discount;
      // Fix: Keep 2 decimal places instead of rounding to preserve exact amount
      const amount = Math.max(parseFloat(calculatedAmount.toFixed(2)), 1);

      // Show warning if original amount was less than 1
      if (calculatedAmount < 1) {
        toast.info("Minimum order amount is ₹1. Your total has been adjusted.");
      }

      if (paymentMethod === "RAZORPAY") {
        // Show loading toast for order creation
        toast.loading("Creating your order...", {
          id: "order-creation",
          duration: 10000,
        });

        // Step 1: Create Razorpay order
        const orderResponse = await fetchApi("/payment/checkout", {
          method: "POST",
          credentials: "include",
          body: JSON.stringify({
            amount,
            currency: "INR",
            // Include coupon information for proper tracking
            couponCode: coupon?.code || null,
            couponId: coupon?.id || null,
            discountAmount: totals.discount || 0,
          }),
        });

        // Dismiss order creation toast
        toast.dismiss("order-creation");

        if (!orderResponse.success) {
          throw new Error(orderResponse.message || "Failed to create order");
        }

        // Show success toast for order creation
        toast.success("Order created! Opening payment gateway...", {
          duration: 2000,
        });

        const razorpayOrder = orderResponse.data;
        setOrderId(razorpayOrder.id);

        // Step 2: Load Razorpay script with loading indicator
        toast.loading("Loading payment gateway...", {
          id: "payment-gateway",
          duration: 5000,
        });

        const loaded = await loadScript(
          "https://checkout.razorpay.com/v1/checkout.js"
        );

        toast.dismiss("payment-gateway");

        if (!loaded) {
          throw new Error("Razorpay SDK failed to load");
        }

        const options = {
          key: razorpayKey,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          name: "Surat Cloth House - Premium Women's Fashion",
          description:
            "Elegant women's clothing - Kurtis, Suits, Sarees & more.",
          order_id: razorpayOrder.id,
          prefill: {
            name: user?.name || "",
            email: user?.email || "",
            contact: user?.phone || "",
          },
          handler: async function (response) {
            // Step 4: Verify payment - Show loading state during verification
            setProcessing(true);

            // Add a toast to show payment verification is in progress
            toast.loading("Verifying your payment...", {
              id: "payment-verification",
              duration: 10000,
            });

            try {
              const verificationResponse = await fetchApi("/payment/verify", {
                method: "POST",
                credentials: "include",
                body: JSON.stringify({
                  // Send both formats to ensure compatibility
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  // Also send camelCase versions
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                  // Include shipping and coupon information
                  shippingAddressId: selectedAddressId,
                  billingAddressSameAsShipping: true,
                  // Also pass coupon information again to ensure it's included
                  couponCode: coupon?.code || null,
                  couponId: coupon?.id || null,
                  discountAmount: totals.discount || 0,
                  notes: "",
                }),
              });

              // Dismiss the loading toast
              toast.dismiss("payment-verification");

              if (verificationResponse.success) {
                // Show success message
                toast.success("Payment verified successfully! 🎉", {
                  duration: 3000,
                });

                setOrderId(verificationResponse.data.orderId);
                handleSuccessfulPayment(response, verificationResponse.data);
              } else {
                throw new Error(
                  verificationResponse.message || "Payment verification failed"
                );
              }
            } catch (error) {
              console.error("Payment verification error:", error);

              // Dismiss the loading toast
              toast.dismiss("payment-verification");

              // If the error is about a previously cancelled order, guide the user
              if (
                error.message &&
                error.message.includes("previously cancelled")
              ) {
                setError(
                  "Your previous order was cancelled. Please refresh the page and try again."
                );
                toast.error("Please refresh the page to start a new checkout", {
                  duration: 6000,
                  style: {
                    backgroundColor: "#FEF3C7",
                    color: "#D97706",
                    border: "1px solid #FCD34D",
                  },
                });
              } else {
                setError(error.message || "Payment verification failed");
                toast.error(
                  error.message ||
                    "Payment verification failed. Please try again.",
                  {
                    duration: 5000,
                    style: {
                      backgroundColor: "#FEE2E2",
                      color: "#DC2626",
                      border: "1px solid #FECACA",
                    },
                  }
                );
              }

              setProcessing(false);
            }
          },
          theme: {
            color: "#166454",
          },
          modal: {
            ondismiss: function () {
              // When Razorpay modal is dismissed
              setProcessing(false);
            },
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      }
      // Add COD implementation here if required
    } catch (error) {
      console.error("Checkout error:", error);

      // Dismiss any pending loading toasts
      toast.dismiss("order-creation");
      toast.dismiss("payment-gateway");
      toast.dismiss("payment-verification");

      if (
        error.message &&
        error.message.includes("order was previously cancelled")
      ) {
        // Clear local state and guide the user
        setError(
          "This order was previously cancelled. Please refresh the page to start a new checkout."
        );
        toast.error("Please refresh the page to start a new checkout", {
          duration: 6000,
          style: {
            backgroundColor: "#FEF3C7",
            color: "#D97706",
            border: "1px solid #FCD34D",
          },
        });
      } else {
        setError(error.message || "Checkout failed");
        toast.error(error.message || "Checkout failed", {
          duration: 4000,
          style: {
            backgroundColor: "#FEE2E2",
            color: "#DC2626",
            border: "1px solid #FECACA",
          },
        });
      }
    } finally {
      setProcessing(false);
    }
  };

  if (!isAuthenticated || loadingAddresses) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-[#166454] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // If order created successfully
  if (orderCreated) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-lg mx-auto bg-white p-8 rounded-lg border shadow-lg relative overflow-hidden">
          {/* Background pattern for festive feel */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#166454]/5 to-transparent z-0"></div>

          {/* Celebration animation */}
          <div className="relative z-10">
            <div className="relative flex justify-center">
              <div className="h-36 w-36 bg-[#166454]/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                <PartyPopper
                  className={`h-20 w-20 text-[#166454] ${
                    confettiCannon ? "animate-pulse" : ""
                  }`}
                />
              </div>

              {/* Radiating circles animation */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-ping absolute h-40 w-40 rounded-full bg-[#166454] opacity-20"></div>
                <div className="animate-ping absolute h-32 w-32 rounded-full bg-green-500 opacity-10 delay-150"></div>
                <div className="animate-ping absolute h-24 w-24 rounded-full bg-yellow-500 opacity-10 delay-300"></div>
              </div>
            </div>

            <div className="text-center">
              <h1 className="text-4xl font-bold mb-2 text-gray-800 animate-pulse">
                Woohoo!
              </h1>

              <h2 className="text-2xl font-bold mb-2 text-gray-800">
                Order Confirmed!
              </h2>

              {orderNumber && (
                <div className="bg-[#166454]/10 py-2 px-4 rounded-full inline-block mb-3">
                  <p className="text-lg font-semibold text-[#166454]">
                    Order #{orderNumber}
                  </p>
                </div>
              )}

              <div className="my-6 flex items-center justify-center bg-green-50 p-4 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-500 mr-2" />
                <p className="text-xl text-green-600 font-medium">
                  Payment Successful
                </p>
              </div>

              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Thank you for your purchase! Your order has been successfully
                placed and you&apos;ll receive an email confirmation shortly.
              </p>

              <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div className="flex items-center justify-center space-x-2 mb-3">
                  <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                  <p className="text-blue-700">
                    Redirecting to orders page in {redirectCountdown} seconds...
                  </p>
                </div>
                <div className="text-center">
                  <Link href="/account/orders">
                    <button className="text-blue-600 hover:text-blue-800 text-sm underline">
                      Go to orders now →
                    </button>
                  </Link>
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <Link href="/account/orders">
                  <Button className="gap-2">
                    <ShoppingBag size={16} />
                    My Orders
                  </Button>
                </Link>
                <Link href="/products">
                  <Button variant="outline" className="gap-2">
                    <Gift size={16} />
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 relative">
      {/* Loading Overlay for Payment Processing */}
      {processing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl">
            <div className="mb-6">
              <div className="h-20 w-20 bg-[#166454]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="h-10 w-10 text-[#166454] animate-spin" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Processing Your Payment
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Please wait while we securely process your payment. Do not
                refresh or close this page.
              </p>
            </div>

            {/* Progress indicators */}
            <div className="space-y-3">
              <div className="flex items-center justify-center space-x-2">
                <div className="h-2 w-2 bg-[#166454] rounded-full animate-bounce"></div>
                <div className="h-2 w-2 bg-[#166454] rounded-full animate-bounce delay-100"></div>
                <div className="h-2 w-2 bg-[#166454] rounded-full animate-bounce delay-200"></div>
              </div>
              <p className="text-xs text-gray-500">
                This may take a few moments...
              </p>
            </div>
          </div>
        </div>
      )}

      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
          <AlertCircle className="text-red-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <p className="text-red-700 font-semibold">Payment Failed</p>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main checkout area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Addresses */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-[#166454]" />
                Shipping Address
              </h2>
              <Button
                variant="ghost"
                size="sm"
                className="text-[#166454]"
                onClick={() => setShowAddressForm(!showAddressForm)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add New
              </Button>
            </div>

            {showAddressForm && (
              <AddressForm
                onSuccess={handleAddressFormSuccess}
                onCancel={() => setShowAddressForm(false)}
                isInline={true}
              />
            )}

            {addresses.length === 0 && !showAddressForm ? (
              <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
                <span className="text-yellow-700">
                  You don&apos;t have any saved addresses.{" "}
                  <button
                    className="font-medium underline"
                    onClick={() => setShowAddressForm(true)}
                  >
                    Add an address
                  </button>{" "}
                  to continue.
                </span>
              </div>
            ) : (
              <div
                className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${
                  showAddressForm ? "mt-6" : ""
                }`}
              >
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    className={`border rounded-md p-4 cursor-pointer transition-all ${
                      selectedAddressId === address.id
                        ? "border-[#166454] bg-[#166454]/5"
                        : "hover:border-gray-400"
                    }`}
                    onClick={() => handleAddressSelect(address.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium">{address.name}</span>
                      {address.isDefault && (
                        <span className="text-xs bg-[#166454]/10 text-[#166454] px-2 py-0.5 rounded">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>{address.street}</p>
                      <p>
                        {address.city}, {address.state} {address.postalCode}
                      </p>
                      <p>{address.country}</p>
                      <p className="mt-1">
                        Phone: {address.phone || "Not provided"}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center">
                      <input
                        type="radio"
                        name="addressSelection"
                        checked={selectedAddressId === address.id}
                        onChange={() => handleAddressSelect(address.id)}
                        className="h-4 w-4 text-[#166454] border-gray-300 focus:ring-[#166454]"
                      />
                      <label
                        htmlFor={`address-${address.id}`}
                        className="ml-2 text-sm font-medium"
                      >
                        Ship to this address
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold flex items-center mb-4">
              <CreditCard className="h-5 w-5 mr-2 text-[#166454]" />
              Payment Method
            </h2>

            <div className="space-y-3">
              <div
                className={`border rounded-md p-4 cursor-pointer transition-all ${
                  paymentMethod === "RAZORPAY"
                    ? "border-[#166454] bg-[#166454]/5"
                    : "hover:border-gray-400"
                }`}
                onClick={() => handlePaymentMethodSelect("RAZORPAY")}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="razorpay"
                    name="paymentMethod"
                    checked={paymentMethod === "RAZORPAY"}
                    onChange={() => handlePaymentMethodSelect("RAZORPAY")}
                    className="h-4 w-4 text-[#166454] border-gray-300 focus:ring-[#166454]"
                  />
                  <label
                    htmlFor="razorpay"
                    className="ml-2 flex items-center flex-1"
                  >
                    <span className="font-medium">Pay Online</span>
                    <span className="ml-2 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                      Recommended
                    </span>
                  </label>
                  <span className="flex items-center">
                    <IndianRupee className="h-4 w-4 text-[#166454]" />
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-2 ml-6">
                  Pay securely with Credit/Debit Card, UPI, NetBanking, etc.
                </p>
              </div>

              {/* COD option can be added here if required */}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-20">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

            <div className="divide-y">
              <div className="pb-4">
                <p className="text-sm font-medium mb-2">
                  {cart.totalQuantity} Items in Cart
                </p>
                <div className="max-h-52 overflow-y-auto space-y-3">
                  {cart.items?.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-gray-100 rounded flex-shrink-0 relative">
                        {item.product.image && (
                          <Image
                            src={getImageUrl(item.product.image)}
                            alt={item.product.name}
                            fill
                            className="object-contain p-1"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {item.product.name}
                        </p>
                        {(item.variant?.color || item.variant?.size) && (
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            {item.variant?.color && (
                              <>
                                {item.variant.color?.hexCode && (
                                  <div
                                    className="w-3 h-3 rounded-full border"
                                    style={{
                                      backgroundColor:
                                        item.variant.color.hexCode,
                                    }}
                                  />
                                )}
                                <span>
                                  {item.variant.color?.name ||
                                    item.variant.color}
                                </span>
                              </>
                            )}
                            {item.variant?.color && item.variant?.size && (
                              <span> • </span>
                            )}
                            {item.variant?.size && (
                              <span>
                                {item.variant.size?.name || item.variant.size}
                              </span>
                            )}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          {item.quantity} × {formatCurrency(item.price)}
                        </p>
                      </div>
                      <p className="font-medium text-sm">
                        {formatCurrency(item.subtotal)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="py-4 space-y-2 text-sm">
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

                {/* Tax removed */}
              </div>

              <div className="pt-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>
                    {formatCurrency(totals.subtotal - totals.discount)}
                  </span>
                </div>
              </div>
            </div>

            <Button
              className={`w-full mt-6 bg-[#166454] hover:bg-[#0d4a3d] text-white transition-all duration-200 ${
                processing ? "shadow-lg" : "hover:shadow-lg"
              }`}
              size="lg"
              onClick={handleCheckout}
              disabled={
                processing ||
                !selectedAddressId ||
                !paymentMethod ||
                addresses.length === 0
              }
            >
              {processing ? (
                <span className="flex items-center">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  <span className="animate-pulse">Processing Payment...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <IndianRupee className="mr-2 h-4 w-4" />
                  Place Order •{" "}
                  {formatCurrency(totals.subtotal - totals.discount)}
                </span>
              )}
            </Button>

            <p className="text-xs text-gray-500 mt-4 text-center">
              By placing your order, you agree to our terms and conditions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
