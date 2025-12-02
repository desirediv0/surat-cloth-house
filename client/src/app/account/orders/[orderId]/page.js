"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ClientOnly } from "@/components/client-only";
import { DynamicIcon } from "@/components/dynamic-icon";
import { fetchApi, formatCurrency, formatDate } from "@/lib/utils";
import Image from "next/image";

export default function OrderDetailsPage({ params }) {
  const { orderId } = params;
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [order, setOrder] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelForm, setShowCancelForm] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/auth");
    }
  }, [isAuthenticated, loading, router]);

  // Fetch order details
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!isAuthenticated || !orderId) return;

      setLoadingOrder(true);
      setError("");

      try {
        const response = await fetchApi(`/payment/orders/${orderId}`, {
          credentials: "include",
        });

        setOrder(response.data);
      } catch (error) {
        console.error("Failed to fetch order details:", error);
        setError("Failed to load order details. Please try again later.");
      } finally {
        setLoadingOrder(false);
      }
    };

    fetchOrderDetails();
  }, [isAuthenticated, orderId]);

  // Handle cancel order
  const handleCancelOrder = async (e) => {
    e.preventDefault();

    if (!cancelReason.trim()) {
      setError("Please provide a reason for cancellation");
      return;
    }

    setCancelling(true);
    setError("");

    try {
      await fetchApi(`/payment/orders/${orderId}/cancel`, {
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ reason: cancelReason }),
      });

      // Refresh order data
      const response = await fetchApi(`/payment/orders/${orderId}`, {
        credentials: "include",
      });

      setOrder(response.data);
      setShowCancelForm(false);
      setCancelReason("");
    } catch (error) {
      console.error("Failed to cancel order:", error);
      setError(
        error.message || "Failed to cancel order. Please try again later."
      );
    } finally {
      setCancelling(false);
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    const statusColors = {
      PENDING: "bg-yellow-100 text-yellow-800",
      PROCESSING: "bg-blue-100 text-blue-800",
      SHIPPED: "bg-indigo-100 text-indigo-800",
      DELIVERED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
      REFUNDED: "bg-purple-100 text-purple-800",
    };
    return statusColors[status] || "bg-gray-100 text-gray-800";
  };

  // Check if order can be cancelled (allow PAID before shipping)
  const canCancel =
    order && ["PENDING", "PROCESSING", "PAID"].includes(order.status);

  if (loading || !isAuthenticated) {
    return (
      <div className="container mx-auto py-10 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <ClientOnly>
      <div className="container mx-auto py-10 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/account/orders"
              className="inline-flex items-center text-sm text-gray-600 hover:text-primary mb-2"
            >
              <DynamicIcon name="ArrowLeft" className="mr-1 h-4 w-4" />
              Back to Orders
            </Link>
            <h1 className="text-3xl font-bold">Order Details</h1>
          </div>
          {canCancel && !showCancelForm && (
            <Button
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => setShowCancelForm(true)}
            >
              <DynamicIcon name="X" className="mr-2 h-4 w-4" />
              Cancel Order
            </Button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {loadingOrder ? (
          <div className="bg-white rounded-lg shadow p-8 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : !order ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <DynamicIcon
              name="FileX"
              className="h-16 w-16 mx-auto text-gray-400 mb-4"
            />
            <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
            <p className="text-gray-600 mb-6">
              The order you&apos;re looking for doesn&apos;t exist or you
              don&apos;t have permission to view it.
            </p>
            <Link href="/account/orders">
              <Button>View All Orders</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Order details and status - Left column on desktop */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order header */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
                  <div>
                    <h2 className="text-xl font-semibold">
                      Order #{order.orderNumber}
                    </h2>
                    <p className="text-gray-600">
                      Placed on {formatDate(order.date)}
                    </p>
                  </div>
                  <div className="mt-3 sm:mt-0">
                    <span
                      className={`px-3 py-1 inline-flex text-sm font-semibold rounded-md ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>

                {order.status === "CANCELLED" && order.cancelReason && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                    <p className="text-sm text-red-700">
                      <span className="font-semibold">
                        Cancellation reason:
                      </span>{" "}
                      {order.cancelReason}
                    </p>
                    {order.cancelledAt && (
                      <p className="text-sm text-red-700">
                        <span className="font-semibold">Cancelled on:</span>{" "}
                        {formatDate(order.cancelledAt)}
                      </p>
                    )}
                  </div>
                )}

                {/* Cancel form */}
                {showCancelForm && (
                  <div className="mt-4 border rounded-md p-4">
                    <h3 className="font-semibold mb-2">Cancel Order</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Please provide a reason for cancellation. This will help
                      us improve our service.
                    </p>
                    <form onSubmit={handleCancelOrder}>
                      <div className="mb-3">
                        <label
                          htmlFor="cancelReason"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Reason for cancellation
                        </label>
                        <textarea
                          id="cancelReason"
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                          rows={3}
                          required
                        ></textarea>
                      </div>
                      <div className="flex space-x-3">
                        <Button
                          type="submit"
                          variant="destructive"
                          disabled={cancelling}
                        >
                          {cancelling ? "Cancelling..." : "Cancel Order"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowCancelForm(false);
                            setCancelReason("");
                          }}
                        >
                          Never Mind
                        </Button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Tracking info */}
                {order.tracking && (
                  <div className="mt-4 border rounded-md p-4">
                    <h3 className="font-semibold mb-2">Tracking Information</h3>
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:justify-between">
                        <div className="text-sm">
                          <span className="text-gray-600">Carrier:</span>{" "}
                          {order.tracking.carrier}
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-600">Status:</span>{" "}
                          <span
                            className={`px-2 py-0.5 inline-flex text-xs font-semibold rounded-full ${getStatusColor(
                              order.tracking.status
                            )}`}
                          >
                            {order.tracking.status}
                          </span>
                        </div>
                      </div>
                      <span className="text-sm">
                        <span className="text-gray-600">Tracking Number:</span>{" "}
                        <span className="font-mono">
                          {order.tracking.trackingNumber}
                        </span>
                      </span>
                      {order.tracking.estimatedDelivery && (
                        <span className="text-sm">
                          <span className="text-gray-600">
                            Estimated Delivery:
                          </span>{" "}
                          {formatDate(order.tracking.estimatedDelivery)}
                        </span>
                      )}
                    </div>

                    {order.tracking.updates &&
                      order.tracking.updates.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-semibold mb-2">
                            Tracking Updates
                          </h4>
                          <div className="space-y-3">
                            {order.tracking.updates.map((update, index) => (
                              <div
                                key={index}
                                className="border-l-2 border-gray-200 pl-3 py-1"
                              >
                                <p className="text-sm font-medium">
                                  {update.status}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {formatDate(update.timestamp)}{" "}
                                  {update.location && `• ${update.location}`}
                                </p>
                                {update.description && (
                                  <p className="text-xs mt-1">
                                    {update.description}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </div>

              {/* Order items */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Order Items</h2>
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex border-b pb-4 last:border-0 last:pb-0"
                    >
                      <Link
                        href={`/products/${item.slug}`}
                        className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded overflow-hidden mr-4"
                      >
                        {item.image ? (
                          <Image
                            width={80}
                            height={80}
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <DynamicIcon
                              name="Package"
                              className="h-8 w-8 text-gray-400"
                            />
                          </div>
                        )}
                      </Link>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-medium truncate">
                          {item.name}
                        </h3>
                        <div className="text-sm text-gray-600 space-y-1">
                          {(item.color || item.size) && (
                            <p className="text-sm flex items-center gap-2">
                              {item.color && (
                                <span className="flex items-center gap-1">
                                  {item.colorHexCode && (
                                    <div
                                      className="w-3 h-3 rounded-full border"
                                      style={{ backgroundColor: item.colorHexCode }}
                                    />
                                  )}
                                  <span>Color: {item.color}</span>
                                </span>
                              )}
                              {item.color && item.size && <span> • </span>}
                              {item.size && (
                                <span>Size: {item.size}</span>
                              )}
                            </p>
                          )}
                          {item.variant?.color || item.variant?.size ? (
                            <p className="text-sm flex items-center gap-2">
                              {item.variant?.color && (
                                <span className="flex items-center gap-1">
                                  {item.variant.color?.hexCode && (
                                    <div
                                      className="w-3 h-3 rounded-full border"
                                      style={{ backgroundColor: item.variant.color.hexCode }}
                                    />
                                  )}
                                  <span>Color: {item.variant.color?.name || item.variant.color}</span>
                                </span>
                              )}
                              {item.variant?.color && item.variant?.size && <span> • </span>}
                              {item.variant?.size && (
                                <span>Size: {item.variant.size?.name || item.variant.size}</span>
                              )}
                            </p>
                          ) : null}
                          <p>
                            {formatCurrency(item.price)} × {item.quantity} ={" "}
                            {formatCurrency(item.subtotal)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order summary - Right column on desktop */}
            <div className="space-y-6">
              {/* Order summary */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span>{formatCurrency(order.subTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping:</span>
                    <span className="text-green-600 font-medium">FREE</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span>-{formatCurrency(order.discount)}</span>
                    </div>
                  )}
                  {order.couponCode && (
                    <div className="mt-1 p-2 bg-green-50 border border-green-100 rounded-md">
                      <div className="flex items-center text-green-700 text-sm font-medium mb-1">
                        <DynamicIcon name="Tag" className="h-4 w-4 mr-1" />
                        Coupon applied: {order.couponCode}
                      </div>
                      {order.couponDetails && (
                        <div className="text-xs text-green-600">
                          {order.couponDetails.discountType === "PERCENTAGE" ? (
                            <span>
                              {order.couponDetails.discountValue}% off your
                              order
                            </span>
                          ) : (
                            <span>
                              {formatCurrency(
                                order.couponDetails.discountValue
                              )}{" "}
                              off your order
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>{formatCurrency(order.total)}</span>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="mt-6">
                  <h3 className="text-sm font-semibold mb-2">
                    Payment Information
                  </h3>
                  <div className="text-sm space-y-1">
                    <p>
                      <span className="text-gray-600">Method:</span>{" "}
                      {order.paymentMethod}
                    </p>
                    <p>
                      <span className="text-gray-600">Status:</span>{" "}
                      <span
                        className={`px-2 py-0.5 inline-flex text-xs font-semibold rounded-full ${getStatusColor(
                          order.paymentStatus
                        )}`}
                      >
                        {order.paymentStatus}
                      </span>
                    </p>
                    {order.paymentId && (
                      <p className="break-all">
                        <span className="text-gray-600">Payment ID:</span>{" "}
                        {order.paymentId}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Shipping address */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Shipping Address</h2>
                {order.shippingAddress ? (
                  <div className="text-sm space-y-1">
                    <p className="font-medium">
                      {order.shippingAddress.name || ""}
                    </p>
                    <p>{order.shippingAddress.street}</p>
                    <p>
                      {order.shippingAddress.city},{" "}
                      {order.shippingAddress.state}{" "}
                      {order.shippingAddress.postalCode}
                    </p>
                    <p>{order.shippingAddress.country}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">
                    No shipping address available
                  </p>
                )}
              </div>

              {/* Order notes */}
              {order.notes && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold mb-2">Order Notes</h2>
                  <p className="text-sm">{order.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ClientOnly>
  );
}
