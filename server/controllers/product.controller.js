import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../config/db.js";
import { getFileUrl } from "../utils/deleteFromS3.js";

// Get all products with filtering, pagination and sorting
export const getAllProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    category = "",
    color = "",
    size = "",
    sort = "createdAt",
    order = "desc",
    minPrice,
    maxPrice,
    featured,
    productType,
  } = req.query;

  // Normalize search: treat + as space (when querystrings use + for spaces)
  const normalizedSearch =
    typeof search === "string" ? search.replace(/\+/g, " ") : "";

  // Build filter conditions
  const whereConditions = {
    isActive: true,
    // Search in name or description
    ...(normalizedSearch && {
      OR: [
        { name: { contains: normalizedSearch, mode: "insensitive" } },
        { description: { contains: normalizedSearch, mode: "insensitive" } },
        // Also allow searching by category name or slug
        {
          categories: {
            some: {
              category: {
                OR: [
                  { name: { contains: normalizedSearch, mode: "insensitive" } },
                  { slug: { contains: normalizedSearch, mode: "insensitive" } },
                ],
              },
            },
          },
        },
        // Also allow searching by brand name
        {
          brand: {
            name: { contains: normalizedSearch, mode: "insensitive" },
          },
        },
      ],
    }),
    // Filter by category
    ...(category && {
      categories: {
        some: {
          category: {
            OR: [{ id: category }, { slug: category }],
          },
        },
      },
    }),
    // Filter by featured
    ...(featured === "true" && { featured: true }),
    // Filter by product type
    ...(productType && {
      productType: {
        array_contains: [productType],
      },
    }),
    // Filter by price range via variants
    ...((minPrice || maxPrice) && {
      variants: {
        some: {
          AND: [
            { isActive: true },
            // Min price
            ...(minPrice
              ? [
                  {
                    OR: [
                      { price: { gte: parseFloat(minPrice) } },
                      {
                        AND: [
                          { salePrice: { not: null } },
                          { salePrice: { gte: parseFloat(minPrice) } },
                        ],
                      },
                    ],
                  },
                ]
              : []),
            // Max price
            ...(maxPrice
              ? [
                  {
                    OR: [
                      {
                        AND: [
                          { salePrice: { not: null } },
                          { salePrice: { lte: parseFloat(maxPrice) } },
                        ],
                      },
                      {
                        AND: [
                          { salePrice: null },
                          { price: { lte: parseFloat(maxPrice) } },
                        ],
                      },
                    ],
                  },
                ]
              : []),
          ],
        },
      },
    }),
    // Filter by color
    ...(color && {
      variants: {
        some: {
          color: {
            OR: [
              { id: color },
              { name: { contains: color, mode: "insensitive" } },
            ],
          },
        },
      },
    }),
    // Filter by size
    ...(size && {
      variants: {
        some: {
          size: {
            OR: [
              { id: size },
              { name: { contains: size, mode: "insensitive" } },
            ],
          },
        },
      },
    }),
  };

  // Get total count for pagination
  const totalProducts = await prisma.product.count({
    where: whereConditions,
  });

  // Get products with pagination, sorting
  const products = await prisma.product.findMany({
    where: whereConditions,
    include: {
      categories: {
        include: {
          category: true,
        },
      },
      images: {
        where: { isPrimary: true },
        take: 1,
      },
      variants: {
        where: { isActive: true },
        include: {
          color: true,
          size: true,
          images: {
            orderBy: { order: "asc" }, // Sort images by order (0, 1, 2, 3...)
          },
        },
        orderBy: { price: "asc" },
      },
      _count: {
        select: {
          reviews: {
            where: {
              status: "APPROVED",
            },
          },
          variants: true,
        },
      },
    },
    orderBy: [{ [sort]: order }],
    skip: (parseInt(page) - 1) * parseInt(limit),
    take: parseInt(limit),
  });

  // Format products for response
  const formattedProducts = products.map((product) => {
    // Get primary category (first in the list)
    const primaryCategory =
      product.categories.length > 0 ? product.categories[0].category : null;

    // Get image with fallback logic
    let imageUrl = null;

    // Priority 1: Product images
    if (product.images && product.images.length > 0) {
      const primaryImage = product.images.find((img) => img.isPrimary);
      imageUrl = primaryImage ? primaryImage.url : product.images[0].url;
    }
    // Priority 2: Any variant images
    else if (product.variants && product.variants.length > 0) {
      const variantWithImages = product.variants.find(
        (variant) => variant.images && variant.images.length > 0
      );
      if (variantWithImages) {
        const primaryImage = variantWithImages.images.find(
          (img) => img.isPrimary
        );
        imageUrl = primaryImage
          ? primaryImage.url
          : variantWithImages.images[0].url;
      }
    }

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      featured: product.featured,
      description: product.description,
      category: primaryCategory
        ? {
            id: primaryCategory.id,
            name: primaryCategory.name,
            slug: primaryCategory.slug,
          }
        : null,
      image: imageUrl ? getFileUrl(imageUrl) : null,
      // Add variants for frontend fallback
      variants: product.variants.map((variant) => ({
        ...variant,
        images: variant.images
          ? variant.images.map((image) => ({
              ...image,
              url: getFileUrl(image.url),
            }))
          : [],
      })),
      basePrice:
        product.variants.length > 0
          ? parseFloat(
              product.variants[0].salePrice || product.variants[0].price
            )
          : null,
      hasSale:
        product.variants.length > 0 && product.variants[0].salePrice !== null,
      regularPrice:
        product.variants.length > 0
          ? parseFloat(product.variants[0].price)
          : null,
      variantCount: product._count.variants,
      reviewCount: product._count.reviews,
    };
  });

  res.status(200).json(
    new ApiResponsive(
      200,
      {
        products: formattedProducts,
        pagination: {
          total: totalProducts,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(totalProducts / parseInt(limit)),
        },
      },
      "Products fetched successfully"
    )
  );
});

// Get product details by slug
export const getProductBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const product = await prisma.product.findUnique({
    where: {
      slug,
      isActive: true,
    },
    include: {
      categories: {
        include: {
          category: true,
        },
      },
      brand: true,
      images: {
        orderBy: { isPrimary: "desc" },
      },
      variants: {
        where: { isActive: true },
        include: {
          color: true,
          size: true,
          images: {
            orderBy: { order: "asc" }, // Sort images by order (0, 1, 2, 3...)
          },
        },
        orderBy: [{ color: { name: "asc" } }, { size: { order: "asc" } }],
      },
      reviews: {
        where: { status: "APPROVED" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      _count: {
        select: {
          reviews: {
            where: {
              status: "APPROVED",
            },
          },
        },
      },
    },
  });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  // Get the category ID from the product's categories
  const categoryId =
    product.categories.length > 0 ? product.categories[0].category.id : null;

  // Format the response
  const formattedProduct = {
    ...product,
    // Add primary category
    category:
      product.categories.length > 0 ? product.categories[0].category : null,
    // Include brand (only select basic fields)
    brand: product.brand
      ? {
          id: product.brand.id,
          name: product.brand.name,
          slug: product.brand.slug,
        }
      : null,
    images: product.images.map((image) => ({
      ...image,
      url: getFileUrl(image.url),
    })),
    // Format variants with proper image URLs
    variants: product.variants.map((variant) => ({
      ...variant,
      color: variant.color
        ? {
            ...variant.color,
            image: variant.color.image ? getFileUrl(variant.color.image) : null,
          }
        : null,
      size: variant.size ? variant.size : null,
      images: variant.images
        ? variant.images.map((image) => ({
            ...image,
            url: getFileUrl(image.url),
          }))
        : [],
    })),
    // Group variants by color
    colorOptions: Array.from(
      new Set(product.variants.filter((v) => v.color).map((v) => v.color.id))
    ).map((colorId) => {
      const color = product.variants.find(
        (v) => v.color && v.color.id === colorId
      ).color;
      return {
        id: color.id,
        name: color.name,
        hexCode: color.hexCode,
        image: color.image ? getFileUrl(color.image) : null,
      };
    }),
    // Group variants by size
    sizeOptions: Array.from(
      new Set(product.variants.filter((v) => v.size).map((v) => v.size.id))
    )
      .map((sizeId) => {
        const size = product.variants.find(
          (v) => v.size && v.size.id === sizeId
        ).size;
        return {
          id: size.id,
          name: size.name,
          display: size.name,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name)),
    // Average rating
    avgRating:
      product.reviews.length > 0
        ? (
            product.reviews.reduce((sum, review) => sum + review.rating, 0) /
            product.reviews.length
          ).toFixed(1)
        : null,
    reviewCount: product._count.reviews,
    // Include SEO fields
    metaTitle: product.metaTitle || product.name,
    metaDescription: product.metaDescription || product.description,
    keywords: product.keywords || "",
  };

  // Add related products
  const relatedProducts = categoryId
    ? await prisma.product.findMany({
        where: {
          categories: {
            some: {
              category: {
                id: categoryId,
              },
            },
          },
          isActive: true,
          id: { not: product.id },
        },
        include: {
          images: {
            where: { isPrimary: true },
            take: 1,
          },
          variants: {
            where: { isActive: true },
            orderBy: { price: "asc" },
            take: 1,
            include: {
              color: true,
              size: true,
              images: true,
            },
          },
          _count: {
            select: {
              reviews: {
                where: {
                  status: "APPROVED",
                },
              },
            },
          },
        },
        take: 4,
      })
    : [];

  const formattedRelated = relatedProducts.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    image: p.images[0] ? getFileUrl(p.images[0].url) : null,
    basePrice:
      p.variants.length > 0
        ? parseFloat(p.variants[0].salePrice || p.variants[0].price)
        : null,
    hasSale: p.variants.length > 0 && p.variants[0].salePrice !== null,
    regularPrice:
      p.variants.length > 0 ? parseFloat(p.variants[0].price) : null,
    reviewCount: p._count.reviews,
    variants: p.variants.map((variant) => ({
      ...variant,
      color: variant.color
        ? {
            ...variant.color,
            image: variant.color.image ? getFileUrl(variant.color.image) : null,
          }
        : null,
      size: variant.size ? variant.size : null,
      images: variant.images
        ? variant.images.map((image) => ({
            ...image,
            url: getFileUrl(image.url),
          }))
        : [],
    })),
  }));

  res.status(200).json(
    new ApiResponsive(
      200,
      {
        product: formattedProduct,
        relatedProducts: formattedRelated,
      },
      "Product fetched successfully"
    )
  );
});

// Get product variant details
export const getProductVariant = asyncHandler(async (req, res) => {
  const { productId, colorId, sizeId } = req.query;

  if (!productId || (!colorId && !sizeId)) {
    throw new ApiError(
      400,
      "Product ID and at least color ID or size ID are required"
    );
  }

  const variantQuery = {
    productId,
    isActive: true,
    ...(colorId && { colorId }),
    ...(sizeId && { sizeId }),
  };

  const variant = await prisma.productVariant.findFirst({
    where: variantQuery,
    include: {
      color: true,
      size: true,
      images: true,
    },
  });

  if (!variant) {
    throw new ApiError(404, "Product variant not found");
  }

  // Format the variant response with proper image URL
  const formattedVariant = {
    ...variant,
    color: variant.color
      ? {
          ...variant.color,
          image: variant.color.image ? getFileUrl(variant.color.image) : null,
        }
      : null,
    size: variant.size ? variant.size : null,
    images: variant.images
      ? variant.images.map((image) => ({
          ...image,
          url: getFileUrl(image.url),
        }))
      : [],
  };

  res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        { variant: formattedVariant },
        "Product variant fetched successfully"
      )
    );
});

// Get product variant by ID
export const getProductVariantById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "Variant ID is required");
  }

  const variant = await prisma.productVariant.findFirst({
    where: {
      id: id,
      isActive: true,
    },
    include: {
      color: true,
      size: true,
      images: true,
      product: {
        include: {
          images: {
            where: { isPrimary: true },
            take: 1,
          },
        },
      },
    },
  });

  if (!variant) {
    throw new ApiError(404, "Product variant not found");
  }

  // Format the variant response with proper image URL
  const formattedVariant = {
    ...variant,
    color: variant.color
      ? {
          ...variant.color,
          image: variant.color.image ? getFileUrl(variant.color.image) : null,
        }
      : null,
    size: variant.size ? variant.size : null,
    images: variant.images
      ? variant.images.map((image) => ({
          ...image,
          url: getFileUrl(image.url),
        }))
      : [],
    product: {
      ...variant.product,
      image: variant.product.images?.[0]?.url
        ? getFileUrl(variant.product.images[0].url)
        : null,
    },
  };

  res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        { variant: formattedVariant },
        "Product variant fetched successfully"
      )
    );
});

// Get all colors
export const getAllColors = asyncHandler(async (req, res) => {
  const colors = await prisma.color.findMany({
    orderBy: { name: "asc" },
  });

  // Format response with image URLs
  const formattedColors = colors.map((color) => ({
    ...color,
    image: color.image ? getFileUrl(color.image) : null,
  }));

  res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        { colors: formattedColors },
        "Colors fetched successfully"
      )
    );
});

// Get all sizes
export const getAllSizes = asyncHandler(async (req, res) => {
  const sizes = await prisma.size.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });

  // Format sizes with display value
  const formattedSizes = sizes.map((size) => ({
    ...size,
    display: size.name,
  }));

  res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        { sizes: formattedSizes },
        "Sizes fetched successfully"
      )
    );
});

// Get maximum product price for price range slider
export const getMaxPrice = asyncHandler(async (req, res) => {
  // Find the highest priced active variant
  const highestPriceVariant = await prisma.productVariant.findFirst({
    where: {
      isActive: true,
      product: {
        isActive: true,
      },
    },
    orderBy: {
      price: "desc",
    },
  });

  // If no variants found, return a default max price
  const maxPrice = highestPriceVariant
    ? parseFloat(highestPriceVariant.price)
    : 1000;

  res
    .status(200)
    .json(
      new ApiResponsive(200, { maxPrice }, "Maximum price fetched successfully")
    );
});

// Get products by type (featured, bestseller, trending, new, etc.)
export const getProductsByType = asyncHandler(async (req, res) => {
  const { productType } = req.params;
  const {
    page = 1,
    limit = 10,
    sort = "createdAt",
    order = "desc",
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Build filter conditions for product type
  const filterConditions = {
    isActive: true,
    productType: {
      array_contains: [productType],
    },
  };

  // Get total count for pagination
  const totalProducts = await prisma.product.count({
    where: filterConditions,
  });

  // Get products with sorting
  const products = await prisma.product.findMany({
    where: filterConditions,
    include: {
      categories: {
        include: {
          category: true,
        },
      },
      images: {
        where: { isPrimary: true },
        take: 1,
      },
      variants: {
        where: { isActive: true },
        include: {
          color: true,
          size: true,
          images: {
            orderBy: { order: "asc" },
          },
        },
        orderBy: { price: "asc" },
      },
      _count: {
        select: {
          reviews: {
            where: {
              status: "APPROVED",
            },
          },
          variants: true,
        },
      },
    },
    orderBy: [{ [sort]: order }],
    skip,
    take: parseInt(limit),
  });

  // Format the response data
  const formattedProducts = products.map((product) => {
    // Get primary category
    const primaryCategory =
      product.categories.length > 0 ? product.categories[0].category : null;

    // Get image with fallback logic
    let imageUrl = null;

    // Priority 1: Product images
    if (product.images && product.images.length > 0) {
      const primaryImage = product.images.find((img) => img.isPrimary);
      imageUrl = primaryImage ? primaryImage.url : product.images[0].url;
    }
    // Priority 2: Any variant images
    else if (product.variants && product.variants.length > 0) {
      const variantWithImages = product.variants.find(
        (variant) => variant.images && variant.images.length > 0
      );
      if (variantWithImages) {
        const primaryImage = variantWithImages.images.find(
          (img) => img.isPrimary
        );
        imageUrl = primaryImage
          ? primaryImage.url
          : variantWithImages.images[0].url;
      }
    }

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      featured: product.featured,
      description: product.description,
      category: primaryCategory
        ? {
            id: primaryCategory.id,
            name: primaryCategory.name,
            slug: primaryCategory.slug,
          }
        : null,
      image: imageUrl ? getFileUrl(imageUrl) : null,
      // Add variants for frontend fallback
      variants: product.variants.map((variant) => ({
        ...variant,
        images: variant.images
          ? variant.images.map((image) => ({
              ...image,
              url: getFileUrl(image.url),
            }))
          : [],
      })),
      basePrice:
        product.variants.length > 0
          ? parseFloat(
              product.variants[0].salePrice || product.variants[0].price
            )
          : null,
      hasSale:
        product.variants.length > 0 && product.variants[0].salePrice !== null,
      regularPrice:
        product.variants.length > 0
          ? parseFloat(product.variants[0].price)
          : null,
      variantCount: product._count.variants,
      reviewCount: product._count.reviews,
    };
  });

  res.status(200).json(
    new ApiResponsive(
      200,
      {
        products: formattedProducts,
        pagination: {
          total: totalProducts,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(totalProducts / parseInt(limit)),
        },
      },
      `${productType} products fetched successfully`
    )
  );
});
