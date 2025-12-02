import { prisma } from "../config/db.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getBrandsByTag = asyncHandler(async (req, res) => {
  const { tag } = req.query;
  if (!tag)
    return res.status(400).json({ success: false, message: "Tag is required" });
  const brands = await prisma.brand.findMany({
    where: { tags: { has: tag } },
    include: { products: true },
  });
  const data = brands.map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    image: b.image,
    tags: b.tags,
    productCount: b.products.length,
  }));
  res
    .status(200)
    .json(new ApiResponsive(200, { brands: data }, "Brands by tag fetched"));
});

export const getBrandBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const {
    search = "",
    category = "",
    color = "",
    size = "",
    minPrice,
    maxPrice,
    sort = "createdAt",
    order = "desc",
    page = 1,
    limit = 15,
  } = req.query;

  // Find the brand
  const brand = await prisma.brand.findUnique({
    where: { slug },
  });
  if (!brand)
    return res.status(404).json({ success: false, message: "Brand not found" });

  // Build filter conditions for products of this brand
  const whereConditions = {
    isActive: true,
    brandId: brand.id,
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    }),
    ...(category && {
      categories: {
        some: {
          category: {
            OR: [{ id: category }, { slug: category }],
          },
        },
      },
    }),
    ...((minPrice || maxPrice) && {
      variants: {
        some: {
          AND: [
            { isActive: true },
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
        include: { category: true },
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
          images: { orderBy: { order: "asc" } },
        },
        orderBy: { price: "asc" },
      },
      _count: {
        select: {
          reviews: { where: { status: "APPROVED" } },
          variants: true,
        },
      },
    },
    orderBy: [{ [sort]: order }],
    skip: (parseInt(page) - 1) * parseInt(limit),
    take: parseInt(limit),
  });

  // Format products like in product.controller.js
  const formattedProducts = products.map((product) => {
    const primaryCategory =
      product.categories.length > 0 ? product.categories[0].category : null;
    let imageUrl = null;
    if (product.images && product.images.length > 0) {
      const primaryImage = product.images.find((img) => img.isPrimary);
      imageUrl = primaryImage ? primaryImage.url : product.images[0].url;
    } else if (product.variants && product.variants.length > 0) {
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
      image: imageUrl ? imageUrl : null,
      variants: product.variants.map((variant) => ({
        ...variant,
        images: variant.images
          ? variant.images.map((image) => ({
              ...image,
              url: image.url,
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

  const formattedBrand = {
    ...brand,
    products: formattedProducts,
  };

  res.status(200).json(
    new ApiResponsive(
      200,
      {
        brand: formattedBrand,
        pagination: {
          total: totalProducts,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(totalProducts / parseInt(limit)),
        },
      },
      "Brand by slug fetched"
    )
  );
});
