import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { orders } from "@/api/adminService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { SafeRender } from "@/components/SafeRender";
import {
  ShoppingCart,
  Search,
  Eye,
  CheckCircle,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

export default function OrdersPage() {
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdownId(null);
    };

    if (openDropdownId) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openDropdownId]);

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        const params = {
          page: currentPage,
          limit: 10,
          ...(searchQuery && { search: searchQuery }),
          ...(selectedStatus && { status: selectedStatus }),
        };

        const response = await orders.getOrders(params);

        if (response && response.data && response.data.success) {
          setOrdersList(response.data.data?.orders || []);
          setTotalPages(response.data.data?.pagination?.pages || 1);
        } else {
          setError(response.data?.message || "Failed to fetch orders");
        }
      } catch (error: any) {
        console.error("Error fetching orders:", error);
        setError("Failed to load orders. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [currentPage, searchQuery, selectedStatus]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500";
      case "PROCESSING":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500";
      case "SHIPPED":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-500";
      case "DELIVERED":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500";
      case "CANCELLED":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500";
      case "REFUNDED":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-500";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-500";
    }
  };

  // Handle order status update
  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const response = await orders.updateOrderStatus(orderId, {
        status: newStatus,
      });

      if (response && response.data && response.data.success) {
        toast.success(`Order status updated to ${newStatus}`);

        // Update the order in the list
        setOrdersList((prevOrders) =>
          prevOrders.map((order) =>
            order.id === orderId ? { ...order, status: newStatus } : order
          )
        );
      } else {
        toast.error(response.data?.message || "Failed to update order status");
      }
    } catch (error: any) {
      console.error("Error updating order status:", error);
      toast.error(
        error.message || "An error occurred while updating the order status"
      );
    }
  };

  // Loading state
  if (isLoading && ordersList.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center py-10">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-lg text-muted-foreground">
            Loading orders...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && ordersList.length === 0) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center py-10">
        <AlertTriangle className="h-16 w-16 text-destructive" />
        <h2 className="mt-4 text-xl font-semibold">Something went wrong</h2>
        <p className="text-center text-muted-foreground">{error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => {
            setError(null);
            setCurrentPage(1);
            setIsLoading(true);
          }}
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Orders Management</h1>

        {/* Summary Stats */}
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-lg">
            <ShoppingCart className="h-4 w-4 text-primary" />
            <span className="font-medium">{ordersList.length}</span>
            <span className="text-muted-foreground">Total Orders</span>
          </div>
          <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="font-medium text-green-700">
              {ordersList.filter(o => o.status === 'DELIVERED').length}
            </span>
            <span className="text-green-600">Delivered</span>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col gap-4 md:flex-row">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by order number or customer..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button type="submit">Search</Button>
        </form>

        <div className="flex gap-4">
          <select
            className="h-10 rounded-md border bg-background px-3 py-2 text-sm min-w-[150px]"
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">📝 Pending</option>
            <option value="PROCESSING">⚙️ Processing</option>
            <option value="SHIPPED">🚚 Shipped</option>
            <option value="DELIVERED">✅ Delivered</option>
            <option value="CANCELLED">❌ Cancelled</option>
            <option value="REFUNDED">💰 Refunded</option>
          </select>

          {/* Quick Status Count Cards */}
          <div className="hidden md:flex gap-2">
            {["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"].map((status) => {
              const count = ordersList.filter(order => order.status === status).length;
              const icons = {
                PENDING: "📝",
                PROCESSING: "⚙️",
                SHIPPED: "🚚",
                DELIVERED: "✅"
              };
              return (
                <Button
                  key={status}
                  variant={selectedStatus === status ? "default" : "outline"}
                  size="sm"
                  className="h-10 min-w-[70px] text-xs"
                  onClick={() => setSelectedStatus(selectedStatus === status ? "" : status)}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-lg">{icons[status as keyof typeof icons]}</span>
                    <span className="font-bold">{count}</span>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Orders List */}
      <Card className="overflow-hidden rounded-lg border">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        <div className="overflow-x-auto">
          <SafeRender>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Order
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Total
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {ordersList.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <ShoppingCart className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-medium text-muted-foreground mb-2">
                          No orders found
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedStatus
                            ? `No ${selectedStatus.toLowerCase()} orders found.`
                            : searchQuery
                              ? "Try adjusting your search terms."
                              : "Orders will appear here when customers place them."
                          }
                        </p>
                        {(selectedStatus || searchQuery) && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-4"
                            onClick={() => {
                              setSelectedStatus("");
                              setSearchQuery("");
                              setCurrentPage(1);
                            }}
                          >
                            Clear filters
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  ordersList.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                            <ShoppingCart className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">#{order.orderNumber}</p>
                            <p className="text-xs text-muted-foreground">
                              {order.items?.length || 0} items
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div>
                          <p className="font-medium">
                            {order.user?.name || "Guest"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {order.user?.email || "No email"}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{formatDate(order.createdAt)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(
                            order.status
                          )}`}
                        >
                          {order.status === "PENDING" && "📝"}
                          {order.status === "PROCESSING" && "⚙️"}
                          {order.status === "SHIPPED" && "🚚"}
                          {order.status === "DELIVERED" && "✅"}
                          {order.status === "CANCELLED" && "❌"}
                          {order.status === "REFUNDED" && "💰"}
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {formatCurrency(
                          order.totalAmount ||
                          (parseFloat(order.subTotal || 0) - parseFloat(order.discount || 0))
                        )}
                        {order.discount && parseFloat(order.discount) > 0 && (
                          <div className="text-xs text-green-600">
                            -{formatCurrency(parseFloat(order.discount))} discount
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            title="View Order Details"
                          >
                            <Link to={`/orders/${order.id}`}>
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Link>
                          </Button>

                          {/* Status update dropdown - improved visibility */}
                          {order.status !== "DELIVERED" &&
                            order.status !== "CANCELLED" &&
                            order.status !== "REFUNDED" && (
                              <div className="relative">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Update Order Status"
                                  className="bg-primary/5 hover:bg-primary/10"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenDropdownId(
                                      openDropdownId === order.id ? null : order.id
                                    );
                                  }}
                                >
                                  <CheckCircle className="h-4 w-4 text-primary" />
                                  <span className="sr-only">Update Status</span>
                                </Button>

                                {openDropdownId === order.id && (
                                  <div
                                    className="absolute right-0 top-full z-10 mt-1 w-40 overflow-hidden rounded-md border bg-popover p-1 shadow-md"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {order.status !== "PROCESSING" && (
                                      <button
                                        className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                                        onClick={() => {
                                          handleStatusUpdate(order.id, "PROCESSING");
                                          setOpenDropdownId(null);
                                        }}
                                      >
                                        Mark as Processing
                                      </button>
                                    )}

                                    {order.status !== "SHIPPED" &&
                                      order.status !== "PENDING" && (
                                        <button
                                          className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                                          onClick={() => {
                                            handleStatusUpdate(order.id, "SHIPPED");
                                            setOpenDropdownId(null);
                                          }}
                                        >
                                          Mark as Shipped
                                        </button>
                                      )}

                                    {order.status !== "DELIVERED" && (
                                      <button
                                        className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                                        onClick={() => {
                                          handleStatusUpdate(order.id, "DELIVERED");
                                          setOpenDropdownId(null);
                                        }}
                                      >
                                        Mark as Delivered
                                      </button>
                                    )}

                                    {order.status !== "CANCELLED" && (
                                      <button
                                        className="w-full rounded-sm px-2 py-1.5 text-left text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                                        onClick={() => {
                                          handleStatusUpdate(order.id, "CANCELLED");
                                          setOpenDropdownId(null);
                                        }}
                                      >
                                        Cancel Order
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </SafeRender>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
