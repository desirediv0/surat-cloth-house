import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { products } from "@/api/adminService";
import {
  Star,
  TrendingUp,
  Clock,
  Sparkles,
  Package,
  Flame,
  Shield,
  Activity,
  Loader2,
  Shirt,
  Layers,
  Crown,
  ShoppingBag,
  Scissors,
  Tag,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

interface Product {
  id: string;
  name: string;
  description?: string;
  image?: string;
  images?: Array<{
    id: string;
    url: string;
    isPrimary?: boolean;
  }>;
  basePrice?: number;
  regularPrice?: number;
  price?: number;
  salePrice?: number;
  slug?: string;
  isActive?: boolean;
  featured?: boolean;
  productType?: string[];
  categories?: any[];
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  variants?: any[];
  hasVariants?: boolean;
  flavors?: number;
  hasSale?: boolean;
}

const PRODUCT_SECTIONS = [
  // Main Sections
  {
    key: "featured",
    label: "Featured Products",
    icon: Star,
    color: "bg-yellow-500",
  },
  {
    key: "bestseller",
    label: "Best Sellers",
    icon: TrendingUp,
    color: "bg-green-500",
  },
  {
    key: "trending",
    label: "Trending Now",
    icon: Flame,
    color: "bg-orange-600",
  },
  { key: "new", label: "New Arrivals", icon: Clock, color: "bg-blue-500" },

  // Women's Clothing Categories
  { key: "kurtis", label: "Kurtis", icon: Shirt, color: "bg-pink-600" },
  { key: "suits", label: "Suits", icon: Shirt, color: "bg-purple-600" },
  { key: "sarees", label: "Sarees", icon: Layers, color: "bg-indigo-600" },
  {
    key: "western",
    label: "Western",
    icon: ShoppingBag,
    color: "bg-amber-600",
  },

  // Special Collections
  { key: "sale", label: "Sale & Offers", icon: Tag, color: "bg-red-600" },
  {
    key: "premium",
    label: "Premium Collection",
    icon: Crown,
    color: "bg-rose-600",
  },

  // Seasonal & Occasions
  {
    key: "summer",
    label: "Summer Collection",
    icon: Sparkles,
    color: "bg-cyan-600",
  },
  {
    key: "winter",
    label: "Winter Collection",
    icon: Shield,
    color: "bg-slate-600",
  },
  {
    key: "party",
    label: "Party Wear",
    icon: Sparkles,
    color: "bg-fuchsia-600",
  },
  { key: "casual", label: "Casual Wear", icon: Activity, color: "bg-lime-600" },
  { key: "formal", label: "Formal Wear", icon: Scissors, color: "bg-gray-700" },
];

export default function ProductSectionsPage() {
  const [productsBySection, setProductsBySection] = useState<
    Record<string, Product[]>
  >({});
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updateLoading, setUpdateLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("featured");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    // Filter products based on search query
    if (searchQuery.trim() === "") {
      setFilteredProducts(allProducts);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = allProducts.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query) ||
          product.category?.name.toLowerCase().includes(query)
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, allProducts]);

  const fetchProducts = async () => {
    try {
      setLoading(true);

      // Fetch products for each section
      const sectionPromises = PRODUCT_SECTIONS.map(async (section) => {
        try {
          const response = await products.getProductsByType(section.key, 50);
          return {
            section: section.key,
            products:
              response.data?.data?.products || response.data?.products || [],
          };
        } catch (error) {
          console.error(`Error fetching ${section.key} products:`, error);
          return { section: section.key, products: [] };
        }
      });

      const sectionResults = await Promise.all(sectionPromises);
      const productsBySectionMap: Record<string, Product[]> = {};
      sectionResults.forEach(({ section, products: sectionProducts }) => {
        // Map products with proper data structure
        productsBySectionMap[section] = sectionProducts.map((p: any) => ({
          ...p,
          category:
            p.primaryCategory ||
            (p.categories && p.categories.length > 0 ? p.categories[0] : null),
        }));
      });

      // Fetch all products
      const allResponse = await products.getProducts({
        limit: 200,
        sortBy: "createdAt",
        order: "desc",
      });

      if (allResponse.data?.success || allResponse.data?.data?.products) {
        const productsList =
          allResponse.data?.data?.products || allResponse.data?.products || [];
        const mappedProducts = productsList.map((p: any) => ({
          ...p,
          category:
            p.primaryCategory ||
            (p.categories && p.categories.length > 0 ? p.categories[0] : null),
        }));

        setProductsBySection(productsBySectionMap);
        setAllProducts(mappedProducts);
        setFilteredProducts(mappedProducts);
      } else {
        setError("Failed to fetch products");
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setError("An error occurred while fetching products");
    } finally {
      setLoading(false);
    }
  };

  const toggleProductSection = async (
    productId: string,
    sectionKey: string,
    isAdding: boolean
  ) => {
    try {
      setUpdateLoading(productId);

      const product = allProducts.find((p) => p.id === productId);
      if (!product) return toast.error("Product not found");

      const currentTypes = product.productType || [];

      const newTypes: string[] = isAdding
        ? [...new Set([...currentTypes, sectionKey])]
        : currentTypes.filter((t: string) => t !== sectionKey);

      // Send API request
      const formData = new FormData();
      formData.append("productType", JSON.stringify(newTypes));

      const response = await products.updateProduct(productId, formData as any);
      if (!response.data.success) {
        toast.error("Failed to update product");
        return;
      }

      toast.success(`Updated successfully`);

      // ************** LOCAL STATE UPDATE — NO FULL FETCH **************

      // 1) Update allProducts
      const updatedAll = allProducts.map((p) =>
        p.id === productId ? { ...p, productType: newTypes } : p
      );
      setAllProducts(updatedAll);

      // 2) Update productsBySection
      setProductsBySection((prev) => {
        const updated = { ...prev };

        // REMOVE
        if (!isAdding) {
          updated[sectionKey] = updated[sectionKey].filter(
            (p) => p.id !== productId
          );
        }

        // ADD
        if (isAdding) {
          const productData = updatedAll.find((p) => p.id === productId);
          updated[sectionKey] = [...updated[sectionKey], productData!];
        }

        return updated;
      });

      // 3) Update filtered list also
      setFilteredProducts(updatedAll);

      // ************** END **************
    } catch (error) {
      console.log(error);
      toast.error("Error updating product");
    } finally {
      setUpdateLoading(null);
    }
  };

  const getProductImage = (product: Product) => {
    // Priority 1: Direct image field
    if (product.image) return product.image;

    // Priority 2: Product images array
    if (product.images && product.images.length > 0) {
      const primaryImage = product.images.find((img) => img.isPrimary);
      if (primaryImage) return primaryImage.url;
      return product.images[0].url;
    }

    // Priority 3: Any variant images from any variant
    if (product.variants && product.variants.length > 0) {
      const variantWithImages = product.variants.find(
        (variant) => variant.images && variant.images.length > 0
      );
      if (variantWithImages && variantWithImages.images) {
        const primaryImage = variantWithImages.images.find(
          (img: any) => img.isPrimary
        );
        if (primaryImage) return primaryImage.url;
        if (variantWithImages.images[0]) return variantWithImages.images[0].url;
      }
    }

    return null;
  };

  const getProductPrice = (product: Product) => {
    // Check if product has basePrice (from API response)
    if (product.basePrice) return product.basePrice;

    // Check variants for price
    if (product.variants && product.variants.length > 0) {
      const activeVariant = product.variants.find((v: any) => v.isActive);
      if (activeVariant) {
        return activeVariant.salePrice || activeVariant.price;
      }
      // Return first variant price if no active variant
      return product.variants[0].salePrice || product.variants[0].price;
    }

    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={fetchProducts}>Retry</Button>
      </div>
    );
  }

  const currentSection = PRODUCT_SECTIONS.find((s) => s.key === activeTab);
  const currentSectionProducts = productsBySection[activeTab] || [];
  const Icon = currentSection?.icon || Star;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Women's Product Sections
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage women's clothing products across different sections on the
            homepage (Max 15 products per section)
          </p>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="flex flex-wrap h-auto p-1 bg-muted gap-1">
          {PRODUCT_SECTIONS.map((section) => {
            const SectionIcon = section.icon;
            const count = productsBySection[section.key]?.length || 0;
            return (
              <TabsTrigger
                key={section.key}
                value={section.key}
                className="flex items-center gap-2 data-[state=active]:bg-background"
              >
                <SectionIcon className="h-4 w-4" />
                {section.label}
                <Badge
                  variant={count > 0 ? "default" : "secondary"}
                  className="ml-1"
                >
                  {count}
                </Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {PRODUCT_SECTIONS.map((section) => (
          <TabsContent
            key={section.key}
            value={section.key}
            className="space-y-6"
          >
            {/* Current Section Products */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    {section.label}
                    <Badge variant="outline" className="ml-2">
                      {currentSectionProducts.length} / 15 products
                    </Badge>
                  </CardTitle>
                  {currentSectionProducts.length >= 15 && (
                    <Badge variant="destructive">Limit Reached</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {currentSectionProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No products in this section yet. Add products from the
                      list below.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                      {currentSectionProducts.map((product) => (
                        <Card
                          key={product.id}
                          className="overflow-hidden hover:shadow-lg transition-shadow"
                        >
                          <div className="aspect-square relative bg-gradient-to-br from-gray-100 to-gray-50">
                            {getProductImage(product) ? (
                              <img
                                src={getProductImage(product)!}
                                alt={product.name}
                                className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <Package className="h-12 w-12 text-muted-foreground" />
                              </div>
                            )}
                            {!product.isActive && (
                              <div className="absolute top-2 right-2">
                                <Badge variant="secondary" className="text-xs">
                                  Inactive
                                </Badge>
                              </div>
                            )}
                          </div>
                          <CardContent className="p-3">
                            <h3 className="font-semibold text-sm mb-1 line-clamp-2 min-h-[2.5rem]">
                              {product.name}
                            </h3>
                            {product.category && (
                              <p className="text-xs text-muted-foreground mb-2">
                                {product.category.name}
                              </p>
                            )}
                            <div className="flex items-center justify-between mb-3">
                              {getProductPrice(product) ? (
                                <p className="text-sm font-bold text-primary">
                                  ₹{getProductPrice(product)}
                                </p>
                              ) : (
                                <p className="text-xs text-muted-foreground">
                                  No price
                                </p>
                              )}
                              {product.variants &&
                                product.variants.length > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    {product.variants.length} variant
                                    {product.variants.length > 1 ? "s" : ""}
                                  </Badge>
                                )}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() =>
                                toggleProductSection(
                                  product.id,
                                  section.key,
                                  false
                                )
                              }
                              disabled={updateLoading === product.id}
                            >
                              {updateLoading === product.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Remove from Section"
                              )}
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* All Products - Add to Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Add Products to {section.label}</CardTitle>
                  <div className="w-72">
                    <Input
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">Image</TableHead>
                        <TableHead>Product Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <p className="text-muted-foreground">
                              {searchQuery
                                ? "No products found"
                                : "No products available"}
                            </p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredProducts.map((product) => {
                          const isInSection = product.productType?.includes(
                            section.key
                          );
                          const imageUrl = getProductImage(product);

                          return (
                            <TableRow key={product.id}>
                              <TableCell>
                                <div className="w-12 h-12 rounded bg-muted flex items-center justify-center overflow-hidden">
                                  {imageUrl ? (
                                    <img
                                      src={imageUrl}
                                      alt={product.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <Package className="h-6 w-6 text-muted-foreground" />
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{product.name}</p>
                                  <Link
                                    to={`/products/${product.id}`}
                                    className="text-xs text-muted-foreground hover:text-primary"
                                  >
                                    View Details
                                  </Link>
                                </div>
                              </TableCell>
                              <TableCell>
                                {product.category?.name || "Uncategorized"}
                              </TableCell>
                              <TableCell>
                                {getProductPrice(product)
                                  ? `₹${getProductPrice(product)}`
                                  : "N/A"}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    product.isActive ? "default" : "secondary"
                                  }
                                >
                                  {product.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Switch
                                    checked={isInSection}
                                    disabled={
                                      updateLoading === product.id ||
                                      (!isInSection &&
                                        currentSectionProducts.length >= 15)
                                    }
                                    onCheckedChange={(checked) =>
                                      toggleProductSection(
                                        product.id,
                                        section.key,
                                        checked
                                      )
                                    }
                                  />
                                  {updateLoading === product.id && (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
