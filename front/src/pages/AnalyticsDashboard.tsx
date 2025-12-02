import { useState, useEffect } from "react";
import api from "@/api/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Package,
  ShoppingCart,
  Eye,
  Tag,
  Layers,
  Weight,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [mostViewedProducts, setMostViewedProducts] = useState([]);
  const [usersWithCarts, setUsersWithCarts] = useState([]);
  const [activeTab, setActiveTab] = useState("products");

  // Fetch the active tab data on first load and when tab changes
  useEffect(() => {
    if (activeTab === "products") {
      fetchMostViewedProducts();
    } else if (activeTab === "carts") {
      fetchUsersWithCarts();
    }
  }, [activeTab]);

  const fetchMostViewedProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/analytics/products");
      setMostViewedProducts(response.data?.data?.productViews || response.data?.productViews || []);
    } catch (error) {
      console.error("Error fetching most viewed products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersWithCarts = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/analytics/carts");
      setUsersWithCarts(response.data?.data?.users || response.data?.users || []);
    } catch (error) {
      console.error("Error fetching users with carts:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <div className="flex items-center gap-2">
          <BarChart className="h-5 w-5 text-primary" />
          <span className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Tabs for Analytics Content */}
      <Tabs
        defaultValue="products"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid grid-cols-2 mb-8">
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Popular Products
          </TabsTrigger>
          <TabsTrigger value="carts" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            User Carts
          </TabsTrigger>
        </TabsList>

        {/* Popular Products Tab */}
        <TabsContent value="products">
          <Card>
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20">
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Most Viewed Products
              </CardTitle>
              <CardDescription>
                Track which products are receiving the most attention from users
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center p-4 bg-gray-50 rounded-md"
                    >
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-12 w-12 rounded" />
                        <div>
                          <Skeleton className="h-5 w-32 mb-1" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </div>
                      <div className="text-right">
                        <Skeleton className="h-5 w-16 mb-1" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {mostViewedProducts.length > 0 ? (
                    <div className="space-y-4">
                      {mostViewedProducts.map((item: any) => (
                        <div
                          key={item.productId}
                          className="flex justify-between items-center p-4 rounded-md border hover:bg-gray-50 transition"
                        >
                          <div className="flex items-center gap-4">
                            {item.product.image ? (
                              <img
                                src={item.product.image}
                                alt={item.product.name}
                                className="h-12 w-12 rounded-md object-cover border"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-md bg-gray-100 flex items-center justify-center">
                                <Package className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-lg">
                                {item.product.name}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge
                                  variant="outline"
                                  className="flex items-center gap-1 text-xs"
                                >
                                  <Tag className="h-3 w-3" />
                                  {formatCurrency(item.product.basePrice)}
                                </Badge>
                                {item.product.variants > 0 && (
                                  <Badge
                                    variant="secondary"
                                    className="flex items-center gap-1 text-xs"
                                  >
                                    <Layers className="h-3 w-3" />
                                    {item.product.variants} variants
                                  </Badge>
                                )}
                                {item.product.variantInfo && (
                                  <>
                                    {item.product.variantInfo.flavors > 0 && (
                                      <Badge
                                        variant="secondary"
                                        className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700"
                                      >
                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                        {item.product.variantInfo.flavors}{" "}
                                        flavors
                                      </Badge>
                                    )}
                                    {item.product.variantInfo.weights > 0 && (
                                      <Badge
                                        variant="secondary"
                                        className="flex items-center gap-1 text-xs bg-green-50 text-green-700"
                                      >
                                        <Weight className="h-3 w-3" />
                                        {item.product.variantInfo.weights}{" "}
                                        weights
                                      </Badge>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-semibold text-primary">
                              {item.views}
                            </div>
                            <div className="text-xs text-gray-500">views</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 border rounded-md bg-gray-50">
                      <Eye className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-600 mb-1">
                        No product views yet
                      </h3>
                      <p className="text-sm text-gray-500">
                        This data will populate as users view products on your
                        site
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Carts Tab */}
        <TabsContent value="carts">
          <Card>
            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                Users with Products in Cart
              </CardTitle>
              <CardDescription>
                See which users have items in their cart and identify popular
                products
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? (
                <div className="space-y-8">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="border rounded-lg overflow-hidden">
                      <div className="bg-muted p-4 flex justify-between items-center">
                        <div>
                          <Skeleton className="h-5 w-32 mb-1" />
                          <Skeleton className="h-4 w-48" />
                        </div>
                        <Skeleton className="h-6 w-20" />
                      </div>
                      <div className="p-4">
                        <Skeleton className="h-32 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : usersWithCarts.length > 0 ? (
                <div className="space-y-8">
                  {usersWithCarts.map((user: any) => (
                    <div
                      key={user.id}
                      className="border rounded-lg overflow-hidden shadow-sm"
                    >
                      <div className="bg-amber-50 dark:bg-amber-900/10 p-4 flex justify-between items-center">
                        <div>
                          <h3 className="font-medium text-lg">
                            {user.name || "Anonymous User"}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-semibold text-primary">
                            {formatCurrency(user.totalValue)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {user.totalItems} items in cart
                          </div>
                        </div>
                      </div>
                      <div className="divide-y">
                        {user.cartItems.map((item: any) => (
                          <div
                            key={item.id}
                            className="p-4 hover:bg-gray-50 transition"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                {item.product.image ? (
                                  <img
                                    src={item.product.image}
                                    alt={item.product.name}
                                    className="h-16 w-16 rounded-md object-cover border"
                                  />
                                ) : (
                                  <div className="h-16 w-16 rounded-md bg-gray-100 flex items-center justify-center">
                                    <Package className="h-8 w-8 text-gray-400" />
                                  </div>
                                )}
                                <div>
                                  <div className="font-medium text-lg">
                                    {item.product.name}
                                  </div>

                                  {item.product.category && (
                                    <div className="text-sm text-gray-500 mt-1">
                                      Category: {item.product.category.name}
                                    </div>
                                  )}

                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {item.product.variant.flavor && (
                                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200 flex items-center">
                                        {item.product.variant.flavorImage ? (
                                          <img
                                            src={
                                              item.product.variant.flavorImage
                                            }
                                            alt={item.product.variant.flavor}
                                            className="w-4 h-4 rounded-full mr-1"
                                          />
                                        ) : (
                                          <div className="w-2 h-2 mr-1 rounded-full bg-blue-500"></div>
                                        )}
                                        Flavor: {item.product.variant.flavor}
                                      </Badge>
                                    )}
                                    {item.product.variant.weight && (
                                      <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">
                                        <Weight className="h-3 w-3 mr-1" />
                                        Weight: {item.product.variant.weight}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-medium">
                                  {item.product.variant.salePrice ? (
                                    <div className="flex flex-col items-end">
                                      <div className="flex items-center gap-2">
                                        <span className="text-primary font-semibold">
                                          {formatCurrency(
                                            item.product.variant.salePrice
                                          )}
                                        </span>
                                        <span className="text-xs line-through text-muted-foreground">
                                          {formatCurrency(
                                            item.product.variant.price
                                          )}
                                        </span>
                                      </div>
                                      {item.product.variant.discount > 0 && (
                                        <span className="text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded-sm font-medium">
                                          -{item.product.variant.discount}% OFF
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    formatCurrency(item.product.variant.price)
                                  )}
                                </div>
                                <div className="mt-2 text-sm font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full inline-block">
                                  Quantity: {item.quantity}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border rounded-md bg-gray-50">
                  <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-600 mb-1">
                    No active carts
                  </h3>
                  <p className="text-sm text-gray-500">
                    No users currently have items in their cart
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
