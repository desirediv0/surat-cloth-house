import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { orders, inventory } from "@/api/adminService";
import { Card } from "@/components/ui/card";

import {
  AlertTriangle,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Loader2,
  AlertCircle,
  Package2,
  ExternalLink,
  PieChart as PieChartIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

// Helper function to get proper image URL
const getImageUrl = (image: string | string[] | undefined | null): string => {
  if (!image) return "/images/blog-placeholder.jpg";

  // Handle array of images (take first one)
  if (Array.isArray(image)) {
    if (image.length === 0) return "/images/blog-placeholder.jpg";
    const firstImage = image[0];
    if (typeof firstImage === "string") {
      return firstImage.startsWith("http")
        ? firstImage
        : `https://desirediv-storage.blr1.digitaloceanspaces.com/${firstImage}`;
    }
    return "/images/blog-placeholder.jpg";
  }

  // Handle single image string
  if (typeof image === "string") {
    return image.startsWith("http")
      ? image
      : `https://desirediv-storage.blr1.digitaloceanspaces.com/${image}`;
  }

  return "/images/blog-placeholder.jpg";
};

// Define types for API data
interface OrderStats {
  totalOrders?: number;
  totalSales?: number;
  orderGrowth?: number;
  revenueGrowth?: number;
  statusCounts?: Record<string, number>;
  topProducts?: Array<any>;
  monthlySales?: Array<{ month: string; revenue: number }>;
  [key: string]: any;
}

export default function DashboardPage() {
  const { admin } = useAuth();
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [inventoryAlerts, setInventoryAlerts] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Load order stats
        const orderStatsData = await orders.getOrderStats();

        // Handle different response structures
        let actualData: OrderStats = {};
        if (orderStatsData?.data?.success && orderStatsData?.data?.data) {
          // Structure: { data: { success: true, data: {...} } }
          actualData = orderStatsData.data.data;
        } else if (
          orderStatsData?.data?.statusCode === 200 &&
          orderStatsData?.data?.data
        ) {
          // Structure: { data: { statusCode: 200, data: {...} } }
          actualData = orderStatsData.data.data;
        } else if (orderStatsData?.data) {
          // Direct data structure: { data: {...} }
          actualData = orderStatsData.data;
        }

        // Keep the actual sales data without generating fake data
        let monthlySales = actualData.monthlySales || [];

        // Create default status counts if missing
        let statusCounts = actualData.statusCounts || {};
        if (!statusCounts || Object.keys(statusCounts).length === 0) {
          statusCounts = {};
        }

        // Keep only real product data
        let topProducts = actualData.topProducts || [];

        // Initialize missing properties to prevent rendering errors
        const processedData = {
          ...actualData,
          totalOrders: actualData.totalOrders || 0,
          totalSales: actualData.totalSales || 0,
          statusCounts: statusCounts,
          topProducts: topProducts,
          monthlySales: monthlySales,
          // Add default values for growth stats if missing
          orderGrowth: actualData.orderGrowth || 0,
          revenueGrowth: actualData.revenueGrowth || 0,
        };
        setOrderStats(processedData);

        // Load inventory alerts
        const inventoryAlertsData = await inventory.getInventoryAlerts();

        // Extract the actual inventory data from the nested structure
        let actualInventoryData = {};
        if (
          inventoryAlertsData?.data?.success &&
          inventoryAlertsData?.data?.data
        ) {
          actualInventoryData = inventoryAlertsData.data.data;
        } else if (
          inventoryAlertsData?.data?.statusCode === 200 &&
          inventoryAlertsData?.data?.data
        ) {
          actualInventoryData = inventoryAlertsData.data.data;
        } else if (inventoryAlertsData?.data) {
          actualInventoryData = inventoryAlertsData.data;
        }

        setInventoryAlerts(actualInventoryData);
      } catch (error: any) {
        console.error("Error fetching dashboard data:", error);
        setError("Failed to load dashboard data. Please try again.");
        // Set default values for orderStats to prevent rendering errors
        setOrderStats({
          totalOrders: 0,
          totalSales: 0,
          statusCounts: {},
          topProducts: [],
          monthlySales: [],
          orderGrowth: 0,
          revenueGrowth: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center py-10">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-lg text-muted-foreground">
            Loading dashboard data...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center py-10">
        <AlertTriangle className="h-16 w-16 text-destructive" />
        <h2 className="mt-4 text-xl font-semibold">Something went wrong</h2>
        <p className="text-center text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <h2 className="text-3xl font-bold tracking-tight">
          Welcome back, {admin?.firstName || "Admin"}
        </h2>
        <p className="text-muted-foreground">
          Here's an overview of your store's performance
        </p>
      </div>

      {/* Inventory Alerts Banner */}
      {inventoryAlerts && inventoryAlerts.count > 0 && (
        <Card
          className={`p-4 ${inventoryAlerts.outOfStockCount > 0 ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle
                className={`mr-2 h-5 w-5 ${inventoryAlerts.outOfStockCount > 0 ? "text-red-500" : "text-amber-500"}`}
              />
              <div>
                <h3
                  className={`font-medium ${inventoryAlerts.outOfStockCount > 0 ? "text-red-700" : "text-amber-700"}`}
                >
                  Inventory Alert
                </h3>
                <p
                  className={`text-sm ${inventoryAlerts.outOfStockCount > 0 ? "text-red-600" : "text-amber-600"}`}
                >
                  {inventoryAlerts.outOfStockCount > 0
                    ? `${inventoryAlerts.outOfStockCount} products out of stock, ${inventoryAlerts.lowStockCount} products low on stock`
                    : `${inventoryAlerts.lowStockCount} products low on stock`}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              asChild
              className={
                inventoryAlerts.outOfStockCount > 0
                  ? "border-red-200 text-red-700 hover:bg-red-100"
                  : "border-amber-200 text-amber-700 hover:bg-amber-100"
              }
            >
              <Link to="/products">
                View Inventory <ExternalLink className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
        </Card>
      )}

      {/* Low Stock Items */}
      {inventoryAlerts && inventoryAlerts.count > 0 && (
        <Card className="p-4">
          <div className="flex items-center mb-4">
            <Package2 className="mr-2 h-5 w-5 text-primary" />
            <h3 className="font-medium">Low Stock Items</h3>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
            {inventoryAlerts.alerts.map((alert: any) => (
              <div key={alert.id} className="flex items-center border-b pb-3">
                <div
                  className="h-12 w-12 rounded-md mr-3 flex-shrink-0 bg-gray-100"
                  style={{
                    backgroundImage: alert.image
                      ? `url(${getImageUrl(alert.image)})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm truncate">
                      {alert.productName}
                    </p>
                    <Badge
                      variant={
                        alert.status === "OUT_OF_STOCK"
                          ? "destructive"
                          : "outline"
                      }
                      className={
                        alert.status === "OUT_OF_STOCK"
                          ? ""
                          : "bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200"
                      }
                    >
                      {alert.status === "OUT_OF_STOCK"
                        ? "Out of Stock"
                        : `${alert.stock} left`}
                    </Badge>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <span className="truncate">
                      {[alert.flavor, alert.weight].filter(Boolean).join(" • ")}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {inventoryAlerts.count > 5 && (
            <div className="mt-3 text-center">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/products">
                  View all {inventoryAlerts.count} items
                </Link>
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1">
        {/* Total Orders */}
        <Card className="flex flex-col p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Total Orders
            </p>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold">{orderStats?.totalOrders || 0}</p>
          </div>
          <div className="mt-2 flex items-center text-xs">
            {(orderStats?.orderGrowth ?? 0) > 0 ? (
              <>
                <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                <span className="text-green-500">
                  {orderStats?.orderGrowth || 0}% increase
                </span>
              </>
            ) : (
              <>
                <TrendingDown className="mr-1 h-3 w-3 text-destructive" />
                <span className="text-destructive">
                  {Math.abs(orderStats?.orderGrowth || 0)}% decrease
                </span>
              </>
            )}
            <span className="ml-1 text-muted-foreground">vs. last month</span>
          </div>
        </Card>
      </div>

      {/* Top Products */}
      {orderStats?.topProducts && orderStats.topProducts.length > 0 && (
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium">Top Selling Products</h3>
            <p className="text-sm text-muted-foreground">
              Most popular products by sales volume
            </p>
          </div>
          <div className="space-y-4">
            {orderStats.topProducts.map((product: any) => (
              <div
                key={product.id}
                className="flex items-center space-x-4 border-b border-border pb-4 last:border-0 last:pb-0"
              >
                <div
                  className="h-16 w-16 rounded-md bg-muted/50"
                  style={{
                    backgroundImage:
                      product.images && product.images[0]
                        ? `url(${getImageUrl(product.images[0].url || product.images[0])})`
                        : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                ></div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium truncate">{product.name}</h4>
                      <div className="flex items-center mt-1 text-sm text-muted-foreground">
                        <span className="mr-3">
                          <span className="font-medium text-foreground">
                            {product.quantitySold || 0}
                          </span>{" "}
                          sold
                        </span>
                        <span>
                          <span className="font-medium text-foreground">
                            ₹
                            {typeof product.revenue === "string"
                              ? product.revenue
                              : parseFloat(
                                  product.revenue || 0
                                ).toLocaleString()}
                          </span>{" "}
                          revenue
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-8"
                        asChild
                      >
                        <Link to={`/products/${product.id}`}>Inventory</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Order Status Distribution */}
      {orderStats?.statusCounts &&
        Object.keys(orderStats.statusCounts).length > 0 && (
          <Card className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-medium">Order Status Distribution</h3>
              <p className="text-sm text-muted-foreground">
                Current status of orders
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(orderStats.statusCounts).map(
                  ([status, count]) => {
                    // Define colors for different statuses
                    const getStatusColor = (status: string) => {
                      switch (status) {
                        case "PENDING":
                          return "bg-yellow-100 text-yellow-800 border-yellow-200";
                        case "PROCESSING":
                          return "bg-blue-100 text-blue-800 border-blue-200";
                        case "PAID":
                          return "bg-emerald-100 text-emerald-800 border-emerald-200";
                        case "SHIPPED":
                          return "bg-indigo-100 text-indigo-800 border-indigo-200";
                        case "DELIVERED":
                          return "bg-green-100 text-green-800 border-green-200";
                        case "CANCELLED":
                          return "bg-red-100 text-red-800 border-red-200";
                        case "REFUNDED":
                          return "bg-purple-100 text-purple-800 border-purple-200";
                        default:
                          return "bg-gray-100 text-gray-800 border-gray-200";
                      }
                    };

                    return (
                      <div
                        key={status}
                        className={`border rounded-lg p-3 ${getStatusColor(status)}`}
                      >
                        <div className="text-sm font-medium">{status}</div>
                        <div className="text-xl font-bold mt-1">
                          {count as number}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>

              {/* Pie Chart */}
              <div className="flex flex-col items-center">
                <div className="flex items-center mb-2">
                  <PieChartIcon className="h-4 w-4 mr-2 text-primary" />
                  <span className="font-medium">Visual Distribution</span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={Object.entries(orderStats.statusCounts).map(
                          ([status, count]) => ({
                            name: status,
                            value: count as number,
                          })
                        )}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {Object.entries(orderStats.statusCounts).map(
                          ([_], index) => {
                            const COLORS = [
                              "#ffc107", // PENDING - yellow
                              "#3b82f6", // PROCESSING - blue
                              "#10b981", // PAID - emerald
                              "#6366f1", // SHIPPED - indigo
                              "#22c55e", // DELIVERED - green
                              "#ef4444", // CANCELLED - red
                              "#a855f7", // REFUNDED - purple
                              "#94a3b8", // default - gray
                            ];
                            return (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            );
                          }
                        )}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </Card>
        )}
    </div>
  );
}
