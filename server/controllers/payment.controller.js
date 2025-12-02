import crypto from "crypto";
import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { razorpay } from "../app.js";
import sendEmail from "../utils/sendEmail.js";
import { getOrderConfirmationTemplate } from "../email/temp/EmailTemplate.js";
import { getFileUrl } from "../utils/deleteFromS3.js";

// Get Razorpay Key
export const getRazorpayKey = asyncHandler(async (req, res) => {
  res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        { key: process.env.RAZORPAY_KEY_ID },
        "Razorpay key fetched successfully"
      )
    );
});

// Create Razorpay order
export const checkout = asyncHandler(async (req, res) => {
  const {
    amount,
    currency = "INR",
    couponCode,
    couponId,
    discountAmount,
  } = req.body;
  const userId = req.user.id;

  if (!amount || amount < 1) {
    throw new ApiError(400, "Valid amount is required");
  }

  try {
    // Check if user has any previous canceled orders that might cause issues
    const existingCanceledOrders = await prisma.order.findMany({
      where: {
        userId,
        status: "CANCELLED",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 1,
    });

    if (existingCanceledOrders.length > 0) {
      // Log information about canceled orders
      console.log("User has canceled orders, proceeding with clean checkout");
    }

    // Generate a short receipt ID (must be ≤ 40 chars for Razorpay)
    // Use a short timestamp and last 4 chars of userId
    const shortUserId = userId.slice(-4);
    const timestamp = Date.now().toString().slice(-10);
    const receipt = `rcpt_${timestamp}_${shortUserId}`;

    // Store coupon information in the receipt notes
    const notes = {};
    if (couponCode) {
      notes.couponCode = couponCode;
    }
    if (couponId) {
      notes.couponId = couponId;
    }
    if (discountAmount && discountAmount > 0) {
      notes.discountAmount = discountAmount;
    }

    // Ensure amount has 2 decimal places for precise calculation
    // Then convert to paise (multiply by 100) and ensure it's an integer
    const decimalAmount = parseFloat(parseFloat(amount).toFixed(2));
    const amountInPaise = Math.round(decimalAmount * 100);

    const options = {
      amount: amountInPaise, // Razorpay takes amount in paise as integer
      currency,
      receipt: receipt,
      notes: Object.keys(notes).length > 0 ? notes : undefined,
    };

    const order = await razorpay.orders.create(options);

    if (!order) {
      throw new ApiError(500, "Error creating Razorpay order");
    }

    // Store the coupon information in the response
    const responseData = {
      ...order,
      couponData: Object.keys(notes).length > 0 ? notes : null,
    };

    res
      .status(200)
      .json(new ApiResponsive(200, responseData, "Order created successfully"));
  } catch (error) {
    console.error("Razorpay order creation error:", error);

    // Format error response properly
    let errorMessage = "Error creating Razorpay order";
    let errorDetails = [];

    if (error.error && error.error.description) {
      errorMessage = error.error.description;
    } else if (error.message) {
      errorMessage = error.message;
    }

    throw new ApiError(500, errorMessage, errorDetails);
  }
});

// Verify payment and create order
export const paymentVerification = asyncHandler(async (req, res) => {
  // Extract parameters with fallbacks for both snake_case and camelCase formats
  const razorpay_order_id =
    req.body.razorpay_order_id || req.body.razorpayOrderId;
  const razorpay_payment_id =
    req.body.razorpay_payment_id || req.body.razorpayPaymentId;
  const razorpay_signature =
    req.body.razorpay_signature || req.body.razorpaySignature;
  const {
    shippingAddressId,
    billingAddressSameAsShipping = true,
    billingAddress,
    couponCode: requestCouponCode,
    couponId: requestCouponId,
    discountAmount: requestDiscount,
    notes,
  } = req.body;

  // Validation
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new ApiError(400, "Missing payment details");
  }

  if (!shippingAddressId) {
    throw new ApiError(400, "Shipping address is required");
  }

  // Verify signature
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    throw new ApiError(400, "Invalid payment signature");
  }

  try {
    // Check if payment already processed
    const existingPayment = await prisma.razorpayPayment.findUnique({
      where: { razorpayPaymentId: razorpay_payment_id },
    });

    if (existingPayment) {
      throw new ApiError(400, "Payment already processed");
    }

    // Check for cancelled orders with this Razorpay order ID
    const cancelledOrder = await prisma.razorpayPayment.findFirst({
      where: {
        razorpayOrderId: razorpay_order_id,
        order: {
          status: "CANCELLED",
        },
      },
      include: {
        order: true,
      },
    });

    if (cancelledOrder) {
      console.log(
        `Detected payment for previously cancelled order: ${cancelledOrder.order.orderNumber}`
      );
      throw new ApiError(
        400,
        "This order was previously cancelled. Please start a new checkout process."
      );
    }

    if (!razorpay_signature) {
      throw new ApiError(400, "Razorpay signature is missing");
    }

    // Get user's cart items
    const userId = req.user.id;
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        productVariant: {
          include: {
            product: {
              include: {
                images: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
            color: true,
            size: true,
          },
        },
      },
    });

    if (!cartItems.length) {
      throw new ApiError(400, "No items in cart");
    }

    // Check if user has an active coupon
    const userCoupon = await prisma.userCoupon.findFirst({
      where: {
        userId,
        isActive: true,
      },
      include: {
        coupon: true,
      },
    });

    // Verify shipping address
    const shippingAddress = await prisma.address.findFirst({
      where: {
        id: shippingAddressId,
        userId,
      },
    });

    if (!shippingAddress) {
      throw new ApiError(404, "Shipping address not found");
    }

    // Calculate order totals
    let subTotal = 0;
    let tax = 0; // Tax is now set to 0
    const shippingCost = 0; // Fixed shipping cost at 0
    let discount = 0;
    let couponCode = null;
    let couponId = null;

    // Check inventory and calculate totals
    for (const item of cartItems) {
      const variant = item.productVariant;
      const price = variant.salePrice || variant.price;
      const itemTotal = parseFloat(price) * item.quantity;
      subTotal += itemTotal;

      // Check stock availability
      if (variant.quantity < item.quantity) {
        throw new ApiError(400, `Not enough stock for ${variant.product.name}`);
      }
    }

    // Apply coupon discount if available
    if (userCoupon && userCoupon.coupon) {
      couponCode = userCoupon.coupon.code;
      couponId = userCoupon.coupon.id;

      // Calculate discount based on coupon type
      if (userCoupon.coupon.discountType === "PERCENTAGE") {
        // Calculate percentage discount with cap if needed
        let discountPercentage = parseFloat(userCoupon.coupon.discountValue);

        if (discountPercentage > 90 || userCoupon.coupon.isDiscountCapped) {
          discountPercentage = Math.min(discountPercentage, 90);
        }

        discount = (subTotal * discountPercentage) / 100;
      } else {
        // Fixed amount discount, not exceeding subtotal
        discount = Math.min(
          parseFloat(userCoupon.coupon.discountValue),
          subTotal
        );
      }

      // After successful order, deactivate the coupon for this user
      // We'll do this in the transaction to ensure it only happens if order is created
    }
    // If no userCoupon but we have coupon info stored in the Razorpay order, use that
    else {
      try {
        // First check if direct coupon info was provided in the request
        if (requestCouponCode || requestCouponId || requestDiscount) {
          if (requestCouponCode) couponCode = requestCouponCode;
          if (requestCouponId) couponId = requestCouponId;
          if (requestDiscount) discount = parseFloat(requestDiscount);
        }
        // Fallback to Razorpay order notes
        else {
          // Fetch the Razorpay order to get notes
          const razorpayOrderDetails = await razorpay.orders.fetch(
            razorpay_order_id
          );

          if (razorpayOrderDetails.notes) {
            // Get coupon information from notes
            if (razorpayOrderDetails.notes.couponCode) {
              couponCode = razorpayOrderDetails.notes.couponCode;
            }

            if (razorpayOrderDetails.notes.couponId) {
              couponId = razorpayOrderDetails.notes.couponId;
            }

            if (razorpayOrderDetails.notes.discountAmount) {
              discount = parseFloat(razorpayOrderDetails.notes.discountAmount);
            }
          }
        }

        // If we have couponId but no couponCode or vice versa, try to get the missing information
        if (couponId && !couponCode) {
          const coupon = await prisma.coupon.findUnique({
            where: { id: couponId },
          });
          if (coupon) {
            couponCode = coupon.code;
          }
        } else if (couponCode && !couponId) {
          const coupon = await prisma.coupon.findUnique({
            where: { code: couponCode },
          });
          if (coupon) {
            couponId = coupon.id;
          }
        }
      } catch (err) {
        console.log("Error processing coupon information:", err);
        // Continue with the process, just without coupon info
      }
    }

    // Tax is 0% now
    tax = 0;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Get Razorpay payment details
    const razorpayPaymentDetails = await razorpay.payments.fetch(
      razorpay_payment_id
    );
    const paymentMethod = mapRazorpayMethod(razorpayPaymentDetails.method);

    // Create order and process payment in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the order
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId,
          subTotal: subTotal.toFixed(2),
          tax: tax.toFixed(2),
          shippingCost,
          discount,
          total: (subTotal - discount).toFixed(2),
          shippingAddressId,
          billingAddressSameAsShipping,
          billingAddress: !billingAddressSameAsShipping
            ? billingAddress
            : undefined,
          notes,
          status: "PAID",
          couponCode,
          couponId: couponId,
        },
      });

      // If a coupon was used, mark it as inactive for this user
      if (userCoupon && userCoupon.coupon) {
        await tx.userCoupon.update({
          where: {
            id: userCoupon.id,
          },
          data: {
            isActive: false,
          },
        });

        // Update the coupon's used count
        await tx.coupon.update({
          where: {
            id: userCoupon.coupon.id,
          },
          data: {
            usedCount: {
              increment: 1,
            },
          },
        });
      }

      // 2. Create the Razorpay payment record
      const payment = await tx.razorpayPayment.create({
        data: {
          orderId: order.id,
          amount: (subTotal + tax + shippingCost - discount).toFixed(2),
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          status: "CAPTURED",
          paymentMethod,
          notes: razorpayPaymentDetails,
        },
      });

      // Note: Partner commissions will be created automatically when order status is updated to DELIVERED
      // This ensures partners only get paid after successful delivery, not just on payment

      // 3. Create order items and update inventory
      const orderItems = [];
      for (const item of cartItems) {
        const variant = item.productVariant;
        const price = variant.salePrice || variant.price;
        const subtotal = parseFloat(price) * item.quantity;

        // Create order item
        const orderItem = await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: variant.product.id,
            variantId: variant.id,
            price,
            quantity: item.quantity,
            subtotal,
          },
        });
        orderItems.push(orderItem);

        // Update inventory
        await tx.productVariant.update({
          where: { id: variant.id },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });

        // Log inventory change
        await tx.inventoryLog.create({
          data: {
            variantId: variant.id,
            quantityChange: -item.quantity,
            reason: "sale",
            referenceId: order.id,
            previousQuantity: variant.quantity,
            newQuantity: variant.quantity - item.quantity,
            createdBy: userId,
          },
        });
      }

      // 4. Clear the user's cart
      await tx.cartItem.deleteMany({
        where: { userId },
      });

      return { order, payment, orderItems };
    });

    // Send order confirmation email
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (user && user.email) {
        const orderItems = await prisma.orderItem.findMany({
          where: { orderId: result.order.id },
          include: {
            product: true,
            variant: {
              include: {
                color: true,
                size: true,
              },
            },
          },
        });

        // Format items for email
        const emailItems = orderItems.map((item) => ({
          name: item.product.name,
          variant: `${item.variant.color?.name || ""} ${
            item.variant.size?.name || ""
          }`.trim(),
          quantity: item.quantity,
          price: parseFloat(item.price).toFixed(2),
        }));

        // Send email
        await sendEmail({
          email: user.email,
          subject: `Order Confirmation - #${result.order.orderNumber}`,
          html: getOrderConfirmationTemplate({
            userName: user.name || "Valued Customer",
            orderNumber: result.order.orderNumber,
            orderDate: result.order.createdAt,
            paymentMethod: result.payment.paymentMethod || "Online",
            items: emailItems,
            subtotal: parseFloat(result.order.subTotal).toFixed(2),
            shipping: "0.00", // Set shipping to 0
            tax: "0.00", // Set tax to 0
            total: (
              parseFloat(result.order.subTotal) -
              parseFloat(result.order.discount || 0)
            ).toFixed(2), // Calculate total without tax/shipping
            shippingAddress: shippingAddress,
          }),
        });
      }
    } catch (emailError) {
      console.error("Order confirmation email error:", emailError);
      // Don't throw error, continue with response
    }

    // Return success response
    return res.status(200).json(
      new ApiResponsive(
        200,
        {
          orderId: result.order.id,
          orderNumber: result.order.orderNumber,
          paymentId: result.payment.id,
        },
        "Payment verified and order created successfully"
      )
    );
  } catch (error) {
    console.error("Payment Verification Error:", error);

    if (error.code === "P2002") {
      throw new ApiError(400, "Duplicate payment record");
    }

    if (error.code === "P2025") {
      throw new ApiError(404, "Related record not found");
    }

    throw new ApiError(
      error.statusCode || 500,
      error.message || "Payment verification failed"
    );
  }
});

// Get order history
export const getOrderHistory = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 10 } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  // Get total count
  const totalOrders = await prisma.order.count({
    where: { userId },
  });

  // Get orders with pagination
  const orders = await prisma.order.findMany({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
          variant: {
            include: {
              color: true,
              size: true,
            },
          },
        },
      },
      tracking: true,
      razorpayPayment: {
        select: {
          paymentMethod: true,
          status: true,
          razorpayPaymentId: true,
        },
      },
      coupon: {
        select: {
          code: true,
          discountType: true,
          discountValue: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    skip,
    take,
  });

  // Format response
  const formattedOrders = orders.map((order) => {
    // Ensure we use the original total without modifying it
    const originalTotal = parseFloat(order.total);

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      date: order.createdAt,
      status: order.status,
      // Use the original stored total
      total: originalTotal,
      subTotal: parseFloat(order.subTotal),
      discount: parseFloat(order.discount) || 0,
      couponCode: order.couponCode || null,
      couponDetails: order.coupon
        ? {
            code: order.coupon.code,
            discountType: order.coupon.discountType,
            discountValue: parseFloat(order.coupon.discountValue),
          }
        : null,
      paymentMethod: order.razorpayPayment?.paymentMethod || "ONLINE",
      paymentStatus: order.razorpayPayment?.status || order.status,
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        name: item.product.name,
        image: item.product.images[0]
          ? getFileUrl(item.product.images[0].url)
          : null,
        slug: item.product.slug,
        color: item.variant.color?.name,
        size: item.variant.size?.name,
        price: parseFloat(item.price),
        quantity: item.quantity,
        subtotal: parseFloat(item.subtotal),
      })),
      tracking: order.tracking
        ? {
            carrier: order.tracking.carrier,
            trackingNumber: order.tracking.trackingNumber,
            status: order.tracking.status,
            estimatedDelivery: order.tracking.estimatedDelivery,
          }
        : null,
    };
  });

  res.status(200).json(
    new ApiResponsive(
      200,
      {
        orders: formattedOrders,
        pagination: {
          total: totalOrders,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(totalOrders / parseInt(limit)),
        },
      },
      "Order history fetched successfully"
    )
  );
});

// Get order details by ID
export const getOrderDetails = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { orderId } = req.params;

  // Get order with details
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
    },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
          variant: {
            include: {
              color: true,
              size: true,
            },
          },
        },
      },
      shippingAddress: true,
      tracking: {
        include: {
          updates: {
            orderBy: {
              timestamp: "desc",
            },
          },
        },
      },
      razorpayPayment: true,
      coupon: {
        select: {
          code: true,
          description: true,
          discountType: true,
          discountValue: true,
        },
      },
    },
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Format response - use original values to maintain historical pricing
  const formattedOrder = {
    id: order.id,
    orderNumber: order.orderNumber,
    date: order.createdAt,
    status: order.status,
    cancelReason: order.cancelReason || null,
    cancelledAt: order.cancelledAt || null,
    cancelledBy: order.cancelledBy || null,
    subTotal: parseFloat(order.subTotal),
    tax: parseFloat(order.tax),
    shippingCost: parseFloat(order.shippingCost),
    discount: parseFloat(order.discount) || 0,
    // Use the original total stored in the database to preserve historical pricing
    total: parseFloat(order.total),
    paymentMethod: order.razorpayPayment?.paymentMethod || "ONLINE",
    paymentId: order.razorpayPayment?.razorpayPaymentId,
    paymentStatus: order.razorpayPayment?.status || order.status,
    notes: order.notes,
    couponCode: order.couponCode,
    couponId: order.couponId,
    // Add detailed coupon information
    couponDetails: order.coupon
      ? {
          code: order.coupon.code,
          description: order.coupon.description,
          discountType: order.coupon.discountType,
          discountValue: parseFloat(order.coupon.discountValue),
        }
      : null,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      name: item.product.name,
      image: item.product.images[0]
        ? getFileUrl(item.product.images[0].url)
        : null,
      slug: item.product.slug,
      color: item.variant.color?.name,
      size: item.variant.size?.name || null,
      price: parseFloat(item.price),
      quantity: item.quantity,
      subtotal: parseFloat(item.subtotal),
    })),
    shippingAddress: order.shippingAddress,
    billingAddress: order.billingAddressSameAsShipping
      ? order.shippingAddress
      : order.billingAddress,
    tracking: order.tracking
      ? {
          carrier: order.tracking.carrier,
          trackingNumber: order.tracking.trackingNumber,
          status: order.tracking.status,
          estimatedDelivery: order.tracking.estimatedDelivery,
          updates: order.tracking.updates.map((update) => ({
            status: update.status,
            timestamp: update.timestamp,
            location: update.location,
            description: update.description,
          })),
        }
      : null,
  };

  res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        formattedOrder,
        "Order details fetched successfully"
      )
    );
});

// Cancel order
export const cancelOrder = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { orderId } = req.params;
  const { reason } = req.body;

  if (!reason) {
    throw new ApiError(400, "Cancellation reason is required");
  }

  // Find order
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
    },
    include: {
      items: {
        include: {
          variant: true,
        },
      },
    },
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Only allow cancellation for certain statuses (allow PAID if not yet shipped)
  const allowedStatuses = ["PENDING", "PROCESSING", "PAID"];
  if (!allowedStatuses.includes(order.status)) {
    throw new ApiError(400, "This order cannot be cancelled");
  }

  // Process cancellation in transaction
  await prisma.$transaction(async (tx) => {
    // 1. Update order status
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: "CANCELLED",
        cancelReason: reason,
        cancelledAt: new Date(),
        cancelledBy: userId,
      },
    });

    // 2. Return items to inventory
    for (const item of order.items) {
      // Update inventory
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: {
          quantity: {
            increment: item.quantity,
          },
        },
      });

      // Log inventory change
      await tx.inventoryLog.create({
        data: {
          variantId: item.variantId,
          quantityChange: item.quantity,
          reason: "cancellation",
          referenceId: order.id,
          previousQuantity: item.variant.quantity,
          newQuantity: item.variant.quantity + item.quantity,
          createdBy: userId,
        },
      });
    }

    // 3. Handle payment refund if needed (just mark as refund pending)
    if (order.razorpayPayment) {
      await tx.razorpayPayment.update({
        where: { orderId },
        data: {
          status: "REFUNDED",
        },
      });
    }
  });

  res
    .status(200)
    .json(
      new ApiResponsive(200, { success: true }, "Order cancelled successfully")
    );
});

// Helper function to map Razorpay payment method to our enum
function mapRazorpayMethod(method) {
  const methodMap = {
    card: "CARD",
    netbanking: "NETBANKING",
    wallet: "WALLET",
    upi: "UPI",
    emi: "EMI",
  };

  return methodMap[method] || "OTHER";
}
