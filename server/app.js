import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import Razorpay from "razorpay";
import userRoutes from "./routes/user.routes.js";
import partnerRoutes from "./routes/partner.routes.js";
import partnerAuthRoutes from "./routes/partner.auth.routes.js";
import adminPartnerRoutes from "./routes/admin.partner.routes.js";
import adminPartnerListRoutes from "./routes/admin.partner.list.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import adminProductRoutes from "./routes/admin.product.routes.js";
import adminOrderRoutes from "./routes/admin.order.routes.js";
import adminCategoryRoutes from "./routes/admin.category.routes.js";
import adminSizeRoutes from "./routes/admin.size.routes.js";
import adminColorRoutes from "./routes/admin.color.routes.js";
import adminCouponRoutes from "./routes/admin.coupon.routes.js";
import adminContentRoutes from "./routes/admin.content.routes.js";
import adminReviewRoutes from "./routes/admin.review.routes.js";
import adminFaqRoutes from "./routes/admin.faq.routes.js";
import publicRoutes from "./routes/public.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import couponRoutes from "./routes/coupon.routes.js";
import contentRoutes from "./routes/content.routes.js";
import faqRoutes from "./routes/faq.routes.js";
import { trackPageView } from "./middlewares/tracking.middleware.js";
import adminBrandRoutes from "./routes/admin.brand.routes.js";

const app = express();

// Security & Parse Middlewares
app.use(express.json());

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// CORS Configuration
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
  : ["http://localhost:3000", "http://localhost:3001", "http://localhost:5173"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.indexOf(origin) !== -1 ||
        process.env.NODE_ENV === "development"
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cache-Control",
      "Pragma",
      "Origin",
      "Accept",
      "X-Requested-With",
    ],
    exposedHeaders: ["Set-Cookie"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 86400, // 24 hours
  })
);

// Handle preflight OPTIONS requests explicitly
app.options("*", cors());

// Cache Control Headers
app.use((req, res, next) => {
  res.header("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.header("Pragma", "no-cache");
  res.header("Expires", "0");
  res.header("X-Content-Type-Options", "nosniff");
  res.header("X-Frame-Options", "DENY");
  res.header("X-XSS-Protection", "1; mode=block");
  res.header(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );
  next();
});

// Add page view tracking middleware
app.use(trackPageView);

// Static Files
app.use(express.static("public/upload"));

// Initialize Razorpay
let razorpay;
try {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  console.log("Razorpay Initialized Successfully");
} catch (error) {
  console.error("Razorpay Initialization Error:", error);
}

export { razorpay };

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/partner/auth", partnerAuthRoutes);
app.use("/api/partner", partnerRoutes);
app.use("/api/admin", adminPartnerListRoutes);
app.use("/api/admin/partners", adminPartnerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin", adminProductRoutes);
app.use("/api/admin", adminOrderRoutes);
app.use("/api/admin", adminCategoryRoutes);
app.use("/api/admin", adminSizeRoutes);
app.use("/api/admin", adminColorRoutes);
app.use("/api/admin", adminCouponRoutes);
app.use("/api/admin", adminContentRoutes);
app.use("/api/admin", adminReviewRoutes);
app.use("/api/admin/faqs", adminFaqRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/faqs", faqRoutes);
app.use("/api/admin", adminBrandRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

export default app;
