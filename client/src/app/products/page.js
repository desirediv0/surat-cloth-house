"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchApi } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  AlertCircle,
  Search,
} from "lucide-react";
import { ClientOnly } from "@/components/client-only";
import { toast } from "sonner";
import CategoriesCarousel from "@/components/catgry";
import ProductCard from "@/components/ProducCard";

// ProductCardSkeleton component
function ProductCardSkeleton() {
  return (
    <div className="bg-white overflow-hidden shadow-md rounded-sm animate-pulse">
      <div className="h-64 w-full bg-gray-200"></div>
      <div className="p-4">
        <div className="flex justify-center mb-2">
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
        </div>
        <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
        <div className="h-4 w-3/4 mx-auto bg-gray-200 rounded mb-4"></div>
        <div className="flex justify-center">
          <div className="h-6 w-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Helper to decode "+" back to space from querystring
  const decodePlus = (str) => (str ? str.replace(/\+/g, " ") : "");
  const searchQuery = decodePlus(searchParams.get("search") || "");
  const categorySlug = searchParams.get("category") || "";
  const productType = searchParams.get("productType") || "";
  const colorId = searchParams.get("color") || "";
  const sizeId = searchParams.get("size") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const sortParam = searchParams.get("sort") || "createdAt";
  const orderParam = searchParams.get("order") || "desc";

  // Determine which section should be open based on URL params
  const getInitialActiveSection = () => {
    if (searchQuery) return "search";
    if (categorySlug) return "categories";
    if (colorId) return "colors";
    if (sizeId) return "sizes";
    return "search";
  };

  const [activeFilterSection, setActiveFilterSection] = useState(
    getInitialActiveSection()
  );
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Initialize selected filters from URL params
  const [selectedColors, setSelectedColors] = useState(
    colorId ? [colorId] : []
  );
  const [selectedSizes, setSelectedSizes] = useState(sizeId ? [sizeId] : []);
  const [maxPossiblePrice, setMaxPossiblePrice] = useState(1000);

  const [filters, setFilters] = useState({
    search: searchQuery,
    category: categorySlug,
    productType: productType,
    color: colorId,
    size: sizeId,
    minPrice: minPrice,
    maxPrice: maxPrice,
    sort: sortParam,
    order: orderParam,
  });

  // Local controlled input state for the Search field
  const [searchInput, setSearchInput] = useState(searchQuery);

  useEffect(() => {
    setSearchInput(filters.search || "");
  }, [filters.search]);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  // Sync filters from URL
  useEffect(() => {
    const newFiltersFromURL = {
      search: searchQuery,
      category: categorySlug,
      productType: productType,
      color: colorId,
      size: sizeId,
      minPrice: minPrice,
      maxPrice: maxPrice,
      sort: sortParam,
      order: orderParam,
    };

    const isSame =
      filters.search === newFiltersFromURL.search &&
      filters.category === newFiltersFromURL.category &&
      filters.productType === newFiltersFromURL.productType &&
      filters.color === newFiltersFromURL.color &&
      filters.size === newFiltersFromURL.size &&
      String(filters.minPrice || "") ===
        String(newFiltersFromURL.minPrice || "") &&
      String(filters.maxPrice || "") ===
        String(newFiltersFromURL.maxPrice || "") &&
      filters.sort === newFiltersFromURL.sort &&
      filters.order === newFiltersFromURL.order;

    if (!isSame) {
      setFilters(newFiltersFromURL);
      setSelectedColors(colorId ? [colorId] : []);
      setSelectedSizes(sizeId ? [sizeId] : []);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }
  }, [
    searchQuery,
    categorySlug,
    productType,
    colorId,
    sizeId,
    minPrice,
    maxPrice,
    sortParam,
    orderParam,
  ]);

  const toggleFilterSection = (section) => {
    setActiveFilterSection(activeFilterSection === section ? "" : section);
  };

  // Function to update URL with current filters
  const updateURL = (newFilters) => {
    const pairs = [];
    const add = (k, v) => {
      if (v !== undefined && v !== null && v !== "") {
        const key = encodeURIComponent(k);
        const val = encodeURIComponent(String(v)).replace(/%20/g, "+");
        pairs.push(`${key}=${val}`);
      }
    };

    add("search", newFilters.search);
    add("category", newFilters.category);
    add("productType", newFilters.productType);
    add("color", newFilters.color);
    add("size", newFilters.size);
    add("minPrice", newFilters.minPrice);
    add("maxPrice", newFilters.maxPrice);
    if (newFilters.sort !== "createdAt" || newFilters.order !== "desc") {
      add("sort", newFilters.sort);
      add("order", newFilters.order);
    }

    const qs = pairs.join("&");
    const newURL = qs ? `?${qs}` : window.location.pathname;
    router.push(newURL, { scroll: false });
  };

  // Fetch products based on filters
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let response;

        if (filters.productType) {
          const queryParams = new URLSearchParams();
          queryParams.append(
            "limit",
            String(pagination.limit * pagination.page)
          );

          response = await fetchApi(
            `/public/products/type/${
              filters.productType
            }?${queryParams.toString()}`
          );

          const allProducts = response.data?.products || [];
          const startIndex = (pagination.page - 1) * pagination.limit;
          const endIndex = startIndex + pagination.limit;
          const paginatedProducts = allProducts.slice(startIndex, endIndex);

          setProducts(paginatedProducts);
          setPagination({
            page: pagination.page,
            limit: pagination.limit,
            total: allProducts.length,
            pages: Math.ceil(allProducts.length / pagination.limit),
          });
        } else {
          const queryParams = new URLSearchParams();
          queryParams.append("page", String(pagination.page));
          queryParams.append("limit", String(pagination.limit));

          const validSortFields = [
            "createdAt",
            "updatedAt",
            "name",
            "featured",
          ];
          let sortField = filters.sort;
          if (!validSortFields.includes(sortField)) {
            sortField = "createdAt";
          }

          queryParams.append("sort", sortField);
          queryParams.append("order", filters.order);

          if (filters.search) queryParams.append("search", filters.search);
          if (filters.category)
            queryParams.append("category", filters.category);
          if (filters.minPrice)
            queryParams.append("minPrice", filters.minPrice);
          if (filters.maxPrice)
            queryParams.append("maxPrice", filters.maxPrice);
          if (selectedColors.length > 0)
            queryParams.append("color", selectedColors[0]);
          if (selectedSizes.length > 0)
            queryParams.append("size", selectedSizes[0]);

          response = await fetchApi(
            `/public/products?${queryParams.toString()}`
          );

          let filteredProducts = response.data.products || [];

          if (
            selectedColors.length > 0 &&
            selectedSizes.length > 0 &&
            filteredProducts.length > 0
          ) {
            const productsWithExactMatch = [];
            for (const product of filteredProducts) {
              try {
                const detailResponse = await fetchApi(
                  `/public/products/${product.slug}`
                );
                const detailedProduct = detailResponse.data.product;
                const hasMatchingVariant = detailedProduct.variants.some(
                  (variant) =>
                    variant.color?.id === selectedColors[0] &&
                    variant.size?.id === selectedSizes[0]
                );
                if (hasMatchingVariant) {
                  productsWithExactMatch.push(product);
                }
              } catch (err) {
                console.error(
                  `Error fetching details for product ${product.slug}:`,
                  err
                );
              }
            }
            filteredProducts = productsWithExactMatch;
            setPagination({
              ...response.data.pagination,
              total: productsWithExactMatch.length,
            });
          } else {
            setPagination(response.data.pagination || {});
          }

          setProducts(filteredProducts);
        }
      } catch (err) {
        console.error("Error fetching products:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [
    filters,
    pagination.page,
    pagination.limit,
    selectedColors,
    selectedSizes,
  ]);

  // Fetch filter options
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [categoriesRes, colorsRes, sizesRes] = await Promise.all([
          fetchApi("/public/categories"),
          fetchApi("/public/colors"),
          fetchApi("/public/sizes"),
        ]);

        setCategories(categoriesRes.data.categories || []);
        setColors(colorsRes.data.colors || []);
        setSizes(sizesRes.data.sizes || []);
      } catch (err) {
        console.error("Error fetching filter options:", err);
      }
    };

    fetchFilterOptions();
  }, []);

  // Fetch max price
  useEffect(() => {
    const fetchMaxPrice = async () => {
      try {
        const response = await fetchApi("/public/products/max-price");
        const maxPrice = response.data.maxPrice || 1000;
        setMaxPossiblePrice(Math.ceil(maxPrice / 100) * 100);
      } catch (err) {
        console.error("Error fetching max price:", err);
        setMaxPossiblePrice(1000);
      }
    };

    fetchMaxPrice();
  }, []);

  // Error notification
  useEffect(() => {
    if (error) {
      toast.error(`Error loading products. Please try again.`);
    }
  }, [error]);

  // Scroll on page change
  useEffect(() => {
    let raf1 = 0;
    let raf2 = 0;
    let timeoutId = 0;

    const doScroll = () => {
      const mainContent = document.getElementById("products-main");
      if (mainContent) {
        mainContent.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };

    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        timeoutId = window.setTimeout(doScroll, 80);
      });
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      clearTimeout(timeoutId);
    };
  }, [pagination.page]);

  const handleFilterChange = (name, value) => {
    if ((name === "minPrice" || name === "maxPrice") && value !== "") {
      const numValue = Number.parseFloat(value);
      if (isNaN(numValue)) return;
      value = numValue.toString();
    }

    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    updateURL(newFilters);

    if (pagination.page !== 1) {
      setPagination((prev) => ({ ...prev, page: 1 }));
    }

    if (
      mobileFiltersOpen &&
      window.innerWidth < 768 &&
      name !== "minPrice" &&
      name !== "maxPrice" &&
      name !== "search"
    ) {
      setMobileFiltersOpen(false);
    }

    switch (name) {
      case "search":
        if (value) setActiveFilterSection("search");
        break;
      case "category":
        if (value) setActiveFilterSection("categories");
        break;
      case "color":
        if (value) setActiveFilterSection("colors");
        break;
      case "size":
        if (value) setActiveFilterSection("sizes");
        break;
    }
  };

  const handleColorChange = (colorId) => {
    const isAlreadySelected = selectedColors.includes(colorId);
    let updatedColors = [];

    if (isAlreadySelected) {
      updatedColors = selectedColors.filter((id) => id !== colorId);
      setSelectedColors(updatedColors);
    } else {
      updatedColors = [colorId];
      setSelectedColors(updatedColors);
    }

    const newColorValue = updatedColors.length > 0 ? updatedColors[0] : "";
    handleFilterChange("color", newColorValue);
  };

  const handleSizeChange = (sizeId) => {
    const isAlreadySelected = selectedSizes.includes(sizeId);
    let updatedSizes = [];

    if (isAlreadySelected) {
      updatedSizes = selectedSizes.filter((id) => id !== sizeId);
      setSelectedSizes(updatedSizes);
    } else {
      updatedSizes = [sizeId];
      setSelectedSizes(updatedSizes);
    }

    const newSizeValue = updatedSizes.length > 0 ? updatedSizes[0] : "";
    handleFilterChange("size", newSizeValue);
  };

  const clearFilters = () => {
    const clearedFilters = {
      search: "",
      category: "",
      productType: "",
      color: "",
      size: "",
      minPrice: "",
      maxPrice: "",
      sort: "createdAt",
      order: "desc",
    };
    setFilters(clearedFilters);
    setSelectedColors([]);
    setSelectedSizes([]);
    updateURL(clearedFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
    setActiveFilterSection("search");
  };

  const handleSortChange = (e) => {
    const value = e.target.value;
    let newSort = filters.sort;
    let newOrder = filters.order;

    switch (value) {
      case "newest":
        newSort = "createdAt";
        newOrder = "desc";
        break;
      case "oldest":
        newSort = "createdAt";
        newOrder = "asc";
        break;
      case "price-low":
        newSort = "createdAt";
        newOrder = "asc";
        break;
      case "price-high":
        newSort = "createdAt";
        newOrder = "desc";
        break;
      case "name-asc":
        newSort = "name";
        newOrder = "asc";
        break;
      case "name-desc":
        newSort = "name";
        newOrder = "desc";
        break;
    }

    const newFilters = { ...filters, sort: newSort, order: newOrder };
    setFilters(newFilters);
    updateURL(newFilters);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.pages) return;
    setPagination((prev) => ({ ...prev, page: newPage }));
    scrollToTop();
  };

  // Loading state
  if (loading && products.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-[#136C5B] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div id="products-main">
      <div>
        {/* Categories Carousel - Desktop */}
        <div className="hidden md:flex mx-auto max-w-7xl">
          <CategoriesCarousel />
        </div>

        {/* Hero Banner */}
        <div className="relative w-full h-[200px] md:h-[300px] mb-6 md:mb-10 rounded-lg overflow-hidden">
          <Image
            src="/banner-background.jpg"
            alt="Women's Fashion"
            fill
            className="object-cover object-top"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex flex-col justify-center px-6 md:pl-12">
            <h1 className="text-xl md:text-5xl font-bold text-white mb-2 md:mb-4">
              WOMEN'S FASHION
            </h1>
            <p className="text-sm md:text-xl text-white max-w-xl">
              Discover elegant women's clothing - Kurtis, Suits, Sarees & more
            </p>
          </div>
        </div>

        {/* Mobile filter toggle */}
        <div className="md:hidden flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Products</h2>
          <Button
            variant="outline"
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="flex items-center gap-2"
          >
            <Filter className="h-5 w-5" />
            Filters
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          {/* Filters Sidebar */}
          <div
            className={`md:w-1/4 lg:w-1/5 ${
              mobileFiltersOpen
                ? "block fixed inset-0 z-50 bg-white p-4 overflow-auto"
                : "hidden"
            } md:block md:static md:z-auto md:bg-transparent md:p-0`}
          >
            <div className="bg-white rounded-lg shadow-sm border sticky top-28">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold uppercase">Filters</h2>
                <div className="flex gap-2">
                  <button
                    onClick={clearFilters}
                    className="text-sm text-[#136C5B] hover:underline flex items-center"
                  >
                    Clear all
                  </button>
                  <button
                    className="md:hidden text-gray-500"
                    onClick={() => setMobileFiltersOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Search Filter */}
              <div className="p-4 border-b">
                <div
                  className="flex items-center justify-between mb-2 cursor-pointer"
                  onClick={() => toggleFilterSection("search")}
                >
                  <h3 className="text-sm font-medium uppercase">Search</h3>
                  {activeFilterSection === "search" ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    activeFilterSection === "search"
                      ? "max-h-[500px] opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleFilterChange("search", searchInput);
                    }}
                    className="relative"
                  >
                    <Input
                      name="search"
                      placeholder="Search products..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="w-full pr-10 border-gray-300"
                    />
                    <button
                      type="submit"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      <Search className="h-4 w-4 text-gray-400" />
                    </button>
                  </form>
                </div>
              </div>

              {/* Categories Filter */}
              <div className="p-4 border-b">
                <div
                  className="flex items-center justify-between mb-2 cursor-pointer"
                  onClick={() => toggleFilterSection("categories")}
                >
                  <h3 className="text-sm font-medium uppercase">Categories</h3>
                  {activeFilterSection === "categories" ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    activeFilterSection === "categories"
                      ? "max-h-[500px] opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {categories.map((category) => (
                      <div key={category.id} className="ml-2">
                        <div
                          className={`cursor-pointer hover:text-[#136C5B] flex items-center ${
                            filters.category === category.slug
                              ? "font-medium text-[#136C5B]"
                              : ""
                          }`}
                          onClick={() =>
                            handleFilterChange("category", category.slug)
                          }
                        >
                          <ChevronRight className="h-4 w-4 mr-1" />
                          {category.name}
                        </div>
                        {category.children && category.children.length > 0 && (
                          <div className="ml-4 mt-1 space-y-1">
                            {category.children.map((child) => (
                              <div
                                key={child.id}
                                className={`cursor-pointer hover:text-[#136C5B] text-sm ${
                                  filters.category === child.slug
                                    ? "font-medium text-[#136C5B]"
                                    : ""
                                }`}
                                onClick={() =>
                                  handleFilterChange("category", child.slug)
                                }
                              >
                                {child.name}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Colors Filter */}
              <div className="p-4 border-b">
                <div
                  className="flex items-center justify-between mb-2 cursor-pointer"
                  onClick={() => toggleFilterSection("colors")}
                >
                  <h3 className="text-sm font-medium uppercase">Color</h3>
                  {activeFilterSection === "colors" ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    activeFilterSection === "colors"
                      ? "max-h-[500px] opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {colors.map((color) => (
                      <div
                        key={color.id}
                        className={`cursor-pointer hover:text-[#136C5B] ml-2 flex items-center ${
                          selectedColors.includes(color.id)
                            ? "font-medium text-[#136C5B]"
                            : ""
                        }`}
                        onClick={() => handleColorChange(color.id)}
                      >
                        <div className="w-4 h-4 border border-gray-300 rounded mr-2 flex items-center justify-center">
                          {selectedColors.includes(color.id) && (
                            <div className="w-2 h-2 rounded-sm bg-[#136C5B]"></div>
                          )}
                        </div>
                        {color.hexCode && (
                          <div
                            className="w-4 h-4 rounded-full border mr-2"
                            style={{ backgroundColor: color.hexCode }}
                          />
                        )}
                        {color.image && (
                          <div className="w-4 h-4 rounded-full overflow-hidden mr-2">
                            <Image
                              src={color.image || "/placeholder.svg"}
                              alt={color.name}
                              width={16}
                              height={16}
                            />
                          </div>
                        )}
                        {color.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sizes Filter */}
              <div className="p-4">
                <div
                  className="flex items-center justify-between mb-2 cursor-pointer"
                  onClick={() => toggleFilterSection("sizes")}
                >
                  <h3 className="text-sm font-medium uppercase">Size</h3>
                  {activeFilterSection === "sizes" ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    activeFilterSection === "sizes"
                      ? "max-h-[500px] opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {sizes.map((size) => (
                      <div
                        key={size.id}
                        className={`cursor-pointer hover:text-[#136C5B] ml-2 flex items-center ${
                          selectedSizes.includes(size.id)
                            ? "font-medium text-[#136C5B]"
                            : ""
                        }`}
                        onClick={() => handleSizeChange(size.id)}
                      >
                        <div className="w-4 h-4 border border-gray-300 rounded mr-2 flex items-center justify-center">
                          {selectedSizes.includes(size.id) && (
                            <div className="w-2 h-2 rounded-sm bg-[#136C5B]"></div>
                          )}
                        </div>
                        {size.display || size.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="md:w-3/4 lg:w-4/5">
            {/* Product count and sort */}
            <div className="flex justify-between md:justify-end mb-6 items-center flex-col md:flex-row gap-4">
              <div className="text-sm text-gray-600">
                {loading && !products.length ? (
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  <>
                    Showing{" "}
                    <span className="font-semibold">{products.length}</span> of{" "}
                    <span className="font-semibold">
                      {pagination.total || 0}
                    </span>{" "}
                    products
                  </>
                )}
              </div>

              {loading && (
                <div className="text-sm text-gray-500 flex items-center">
                  <div className="w-4 h-4 border-2 border-[#136C5B] border-t-transparent rounded-full animate-spin mr-2"></div>
                  Updating...
                </div>
              )}

              <div className="inline-flex items-center border rounded-md overflow-hidden bg-white w-full md:w-auto">
                <span className="px-3 py-2 text-sm bg-gray-50">SORT BY</span>
                <select
                  id="sort"
                  name="sort"
                  className="border-l px-3 py-2 focus:outline-none w-full md:w-auto"
                  onChange={handleSortChange}
                  disabled={loading}
                  value={
                    filters.sort === "createdAt" && filters.order === "desc"
                      ? "newest"
                      : filters.sort === "createdAt" && filters.order === "asc"
                      ? "oldest"
                      : filters.sort === "name" && filters.order === "asc"
                      ? "name-asc"
                      : filters.sort === "name" && filters.order === "desc"
                      ? "name-desc"
                      : "newest"
                  }
                >
                  <option value="newest">Featured</option>
                  <option value="price-low">Price, low to high</option>
                  <option value="price-high">Price, high to low</option>
                  <option value="name-asc">Alphabetically, A-Z</option>
                  <option value="name-desc">Alphabetically, Z-A</option>
                  <option value="oldest">Date, old to new</option>
                </select>
              </div>
            </div>

            {/* Active Filters */}
            {(filters.search ||
              filters.category ||
              selectedColors.length > 0 ||
              selectedSizes.length > 0 ||
              filters.minPrice ||
              filters.maxPrice) && (
              <div className="flex flex-wrap items-center gap-2 mb-6 p-3 bg-gray-50 rounded-md border">
                <span className="text-sm font-medium">Active Filters:</span>

                {filters.search && (
                  <div className="bg-[#136C5B] text-white text-xs px-2 py-1 rounded-md flex items-center">
                    <span>Search: {filters.search}</span>
                    <button
                      onClick={() => handleFilterChange("search", "")}
                      className="ml-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}

                {filters.category && (
                  <div className="bg-[#136C5B] text-white text-xs px-2 py-1 rounded-md flex items-center">
                    <span>
                      Category:{" "}
                      {categories.find((c) => c.slug === filters.category)
                        ?.name || filters.category}
                    </span>
                    <button
                      onClick={() => handleFilterChange("category", "")}
                      className="ml-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}

                {selectedColors.length > 0 && (
                  <div className="bg-[#136C5B] text-white text-xs px-2 py-1 rounded-md flex items-center">
                    <span>
                      Color:{" "}
                      {colors.find((c) => c.id === selectedColors[0])?.name ||
                        selectedColors[0]}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedColors([]);
                        handleFilterChange("color", "");
                      }}
                      className="ml-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}

                {selectedSizes.length > 0 && (
                  <div className="bg-[#136C5B] text-white text-xs px-2 py-1 rounded-md flex items-center">
                    <span>
                      Size:{" "}
                      {sizes.find((s) => s.id === selectedSizes[0])?.display ||
                        sizes.find((s) => s.id === selectedSizes[0])?.name ||
                        selectedSizes[0]}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedSizes([]);
                        handleFilterChange("size", "");
                      }}
                      className="ml-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}

                {(filters.minPrice || filters.maxPrice) && (
                  <div className="bg-[#136C5B] text-white text-xs px-2 py-1 rounded-md flex items-center">
                    <span>
                      Price: {filters.minPrice || "0"} -{" "}
                      {filters.maxPrice || "∞"}
                    </span>
                    <button
                      onClick={() => {
                        handleFilterChange("minPrice", "");
                        handleFilterChange("maxPrice", "");
                      }}
                      className="ml-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}

                <button
                  onClick={clearFilters}
                  className="text-xs text-[#136C5B] underline ml-2"
                >
                  Clear All
                </button>
              </div>
            )}

            {/* Products Grid */}
            {loading && products.length === 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-4">
                {[...Array(pagination.limit || 12)].map((_, index) => (
                  <ProductCardSkeleton key={index} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow-sm text-center border">
                <div className="text-gray-400 mb-4">
                  <AlertCircle className="h-12 w-12 mx-auto" />
                </div>
                <h2 className="text-xl font-semibold mb-3">
                  No products found
                </h2>

                {selectedColors.length > 0 && selectedSizes.length > 0 ? (
                  <p className="text-gray-600 mb-6">
                    No products match both the selected color and size. Try a
                    different combination.
                  </p>
                ) : selectedColors.length > 0 ? (
                  <p className="text-gray-600 mb-6">
                    No products available with this color. Try selecting a
                    different color.
                  </p>
                ) : selectedSizes.length > 0 ? (
                  <p className="text-gray-600 mb-6">
                    No products available with this size. Try selecting a
                    different size.
                  </p>
                ) : filters.minPrice || filters.maxPrice ? (
                  <p className="text-gray-600 mb-6">
                    No products match the selected price range. Try adjusting
                    your price filter.
                  </p>
                ) : (
                  <p className="text-gray-600 mb-6">
                    Try adjusting your filters or search term.
                  </p>
                )}

                <div className="flex flex-wrap justify-center gap-2">
                  <Button
                    onClick={clearFilters}
                    className="bg-[#136C5B] hover:bg-[#0f5a4a] text-white"
                  >
                    Clear All Filters
                  </Button>

                  {selectedColors.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedColors([]);
                        handleFilterChange("color", "");
                      }}
                    >
                      Clear Color Filter
                    </Button>
                  )}

                  {selectedSizes.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedSizes([]);
                        handleFilterChange("size", "");
                      }}
                    >
                      Clear Size Filter
                    </Button>
                  )}

                  {(filters.minPrice || filters.maxPrice) && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleFilterChange("minPrice", "");
                        handleFilterChange("maxPrice", "");
                      }}
                    >
                      Clear Price Filter
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-4">
                {loading
                  ? [...Array(pagination.limit || 12)].map((_, index) => (
                      <ProductCardSkeleton key={index} />
                    ))
                  : products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center items-center mt-10 mb-4">
                <div className="inline-flex items-center rounded-md overflow-hidden border divide-x">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1 || loading}
                    className="rounded-none border-0 hover:bg-gray-100 hover:text-black"
                  >
                    <ChevronDown className="h-4 w-4 rotate-90" />
                  </Button>

                  {[...Array(pagination.pages)].map((_, i) => {
                    const page = i + 1;
                    if (
                      page === 1 ||
                      page === pagination.pages ||
                      (page >= pagination.page - 1 &&
                        page <= pagination.page + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          disabled={loading}
                          className={`px-3 py-2 text-sm ${
                            pagination.page === page
                              ? "bg-[#136C5B] text-white"
                              : "hover:bg-gray-100"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    }

                    if (
                      (page === 2 && pagination.page > 3) ||
                      (page === pagination.pages - 1 &&
                        pagination.page < pagination.pages - 2)
                    ) {
                      return (
                        <span key={page} className="px-3 py-2">
                          ...
                        </span>
                      );
                    }

                    return null;
                  })}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages || loading}
                    className="rounded-none border-0 hover:bg-gray-100 hover:text-black"
                  >
                    <ChevronUp className="h-4 w-4 rotate-90" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <div className="container mx-auto px-4 py-6 pt-5 pb-6 md:pb-8">
      <ClientOnly
        fallback={
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-[#136C5B] border-t-transparent rounded-full animate-spin"></div>
          </div>
        }
      >
        <Suspense
          fallback={
            <div className="flex justify-center items-center h-64">
              <div className="w-12 h-12 border-4 border-[#136C5B] border-t-transparent rounded-full animate-spin"></div>
            </div>
          }
        >
          <ProductsContent />
        </Suspense>
      </ClientOnly>
    </div>
  );
}
