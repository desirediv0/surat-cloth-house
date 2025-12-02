# E-Commerce API Integration Guide

## Overview

This document provides comprehensive guidance for frontend developers on integrating with the E-Commerce API. It covers authentication, product management, cart functionality, checkout processes, user accounts, and more.

## Base Configuration

All API requests go through our API client that handles authentication and error handling:

```typescript
// Base API URL is configured from environment variable
const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

// Authentication tokens are automatically added to requests
// JWT tokens are stored in localStorage under "adminToken" or "userToken" keys
```

## Authentication

### User Authentication

```typescript
// Register a new user
POST /api/users/register
Body: { email, password, name, phone? }

// Login
POST /api/users/login
Body: { email, password }

// Get current user profile
GET /api/users/profile
Headers: { Authorization: "Bearer {token}" }

// Update user profile
PATCH /api/users/profile
Headers: { Authorization: "Bearer {token}" }
Body: { name?, phone?, email? }

// Logout
POST /api/users/logout
```

### Admin Authentication

```typescript
// Admin login
POST / api / admin / login;
Body: {
  email, password;
}

// Get admin profile
GET / api / admin / profile;
Headers: {
  Authorization: "Bearer {token}";
}
```

## Product Management

### Retrieving Products

```typescript
// Get all products (with pagination and filtering)
GET /api/products
Query params: {
  page?, limit?, search?, category?,
  sortBy?, order?, featured?, minPrice?, maxPrice?
}

// Get single product details
GET /api/products/:productId

// Get products by category
GET /api/products/category/:categorySlug
```

### Product Data Structure

Each product includes:

- Basic details (name, description, slug)
- Category information
- Multiple variants (combinations of flavor and weight)
- Pricing per variant
- Stock quantity per variant
- Images

## Cart Operations

```typescript
// Get cart items for current user
GET /api/cart
Headers: { Authorization: "Bearer {token}" }

// Add item to cart
POST /api/cart
Headers: { Authorization: "Bearer {token}" }
Body: { productVariantId, quantity }

// Update cart item quantity
PATCH /api/cart/:itemId
Headers: { Authorization: "Bearer {token}" }
Body: { quantity }

// Remove item from cart
DELETE /api/cart/:itemId
Headers: { Authorization: "Bearer {token}" }
```

## Checkout Process

```typescript
// Create order from cart
POST /api/orders
Headers: { Authorization: "Bearer {token}" }
Body: {
  addressId,
  couponCode?,
  paymentMethod: "RAZORPAY" | "COD"
}

// Process payment with Razorpay
POST /api/payment/razorpay/process
Headers: { Authorization: "Bearer {token}" }
Body: { orderId, paymentId, signature }

// Verify payment status
GET /api/payment/status/:orderId
Headers: { Authorization: "Bearer {token}" }
```

## Order Management

```typescript
// Get user orders
GET /api/orders
Headers: { Authorization: "Bearer {token}" }
Query params: { page?, limit?, status? }

// Get order details
GET /api/orders/:orderId
Headers: { Authorization: "Bearer {token}" }

// Track order
GET /api/orders/:orderId/tracking
Headers: { Authorization: "Bearer {token}" }
```

## Categories

```typescript
// Get all categories
GET /api/categories

// Get category by slug
GET /api/categories/:slug
```

## Coupons

```typescript
// Validate coupon
POST / api / coupons / validate;
Headers: {
  Authorization: "Bearer {token}";
}
Body: {
  code, cartTotal;
}
```

## User Addresses

```typescript
// Get user addresses
GET /api/users/addresses
Headers: { Authorization: "Bearer {token}" }

// Add new address
POST /api/users/addresses
Headers: { Authorization: "Bearer {token}" }
Body: { name, street, city, state, postalCode, country, isDefault? }

// Update address
PATCH /api/users/addresses/:addressId
Headers: { Authorization: "Bearer {token}" }
Body: { name?, street?, city?, state?, postalCode?, country?, isDefault? }

// Delete address
DELETE /api/users/addresses/:addressId
Headers: { Authorization: "Bearer {token}" }
```

## Wishlist

```typescript
// Get wishlist items
GET /api/wishlist
Headers: { Authorization: "Bearer {token}" }

// Add item to wishlist
POST /api/wishlist
Headers: { Authorization: "Bearer {token}" }
Body: { productId }

// Remove from wishlist
DELETE /api/wishlist/:itemId
Headers: { Authorization: "Bearer {token}" }
```

## Reviews

```typescript
// Get product reviews
GET /api/products/:productId/reviews

// Add product review
POST /api/products/:productId/reviews
Headers: { Authorization: "Bearer {token}" }
Body: { rating, title?, comment? }
```

## Error Handling

All API responses follow this structure:

```typescript
// Success response
{
  success: true,
  data: { ... },
  message: "Success message"
}

// Error response
{
  success: false,
  message: "Error description"
}
```

Common HTTP status codes:

- 200: Success
- 400: Bad request
- 401: Unauthorized
- 403: Forbidden
- 404: Not found
- 500: Server error

## Frontend Integration Example

### Product Listing Integration

```tsx
import { useState, useEffect } from "react";
import api from "@/api/api";

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get("/api/products", {
          params: {
            page: 1,
            limit: 10,
            sortBy: "createdAt",
            order: "desc",
          },
        });

        if (response.data.success) {
          setProducts(response.data.data.products);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div>
      {loading ? (
        <p>Loading products...</p>
      ) : (
        products.map((product) => (
          <div key={product.id}>
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            {/* Render product variants and prices */}
          </div>
        ))
      )}
    </div>
  );
};
```

### Cart Integration

```tsx
import { useState } from "react";
import api from "@/api/api";

const AddToCart = ({ productVariantId }) => {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleAddToCart = async () => {
    try {
      setLoading(true);

      const response = await api.post("/api/cart", {
        productVariantId,
        quantity,
      });

      if (response.data.success) {
        // Show success message
        toast.success("Added to cart!");
        // Update cart context/state
      }
    } catch (error) {
      // Handle error
      toast.error("Failed to add item to cart");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="number"
        min="1"
        value={quantity}
        onChange={(e) => setQuantity(parseInt(e.target.value))}
      />
      <button onClick={handleAddToCart} disabled={loading}>
        {loading ? "Adding..." : "Add to Cart"}
      </button>
    </div>
  );
};
```

## Data Models

Key entities and their relationships:

- **User**: Customer accounts with authentication
- **Product**: Main product entity with variants
- **ProductVariant**: Specific combination of product, flavor, and weight
- **CartItem**: Links users to product variants in their cart
- **Order**: Records of completed purchases
- **OrderItem**: Individual items within an order
- **Category**: Product categorization
- **Address**: User shipping/billing addresses
- **Coupon**: Discount codes for orders
- **Review**: User reviews of products

## Best Practices

1. **Authentication**: Always store tokens securely and include them in API requests
2. **Error Handling**: Implement comprehensive error handling for all API calls
3. **Loading States**: Show loading indicators during API operations
4. **Data Fetching**: Use React Query or similar libraries for efficient data fetching
5. **Form Validation**: Validate user input before sending to API
6. **Responsive Design**: Ensure UI works across all device sizes
7. **Accessibility**: Follow WCAG guidelines for accessible e-commerce
8. **Performance**: Optimize component rendering and minimize API calls
