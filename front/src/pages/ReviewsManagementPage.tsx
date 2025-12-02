import { useState, useEffect } from "react";
import { reviews } from "@/api/adminService";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTablePagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Star,
  MoreHorizontal,
  Search,
  Trash,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  RefreshCw,
  Loader2,
  AlertTriangle,
} from "lucide-react";

export default function ReviewsManagementPage() {
  // State for reviews data
  const [reviewsData, setReviewsData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Filtering state
  const [filters, setFilters] = useState({
    search: "",
    rating: "all",
    status: "all",
    productId: "",
    sortBy: "createdAt",
    order: "desc" as "asc" | "desc",
  });

  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [adminComment, setAdminComment] = useState("");

  // Fetch reviews data
  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Prepare query parameters
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy: filters.sortBy,
        order: filters.order,
      };

      // Add optional filters if they exist and are not 'all'
      if (filters.search) params.search = filters.search;
      if (filters.rating && filters.rating !== "all")
        params.rating = filters.rating;
      if (filters.status && filters.status !== "all")
        params.status = filters.status;
      if (filters.productId) params.productId = filters.productId;

      const response = await reviews.getReviews(params);

      if (response?.data?.success) {
        setReviewsData(response.data.data.reviews);
        setPagination({
          ...pagination,
          total: response.data.data.total,
          totalPages: response.data.data.totalPages,
        });
      } else {
        setError(response?.data?.message || "Failed to fetch reviews");
      }
    } catch (error: any) {
      console.error("Error fetching reviews:", error);
      setError(error.message || "An error occurred while fetching reviews");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch review statistics
  const fetchStats = async () => {
    try {
      const response = await reviews.getReviewStats();
      if (response?.data?.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching review stats:", error);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchReviews();
    fetchStats();
  }, [pagination.page, pagination.limit]);

  // Apply filters
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page
    fetchReviews();
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      rating: "all",
      status: "all",
      productId: "",
      sortBy: "createdAt",
      order: "desc",
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchReviews();
  };

  // Handle review actions
  const handleViewReview = (review: any) => {
    setSelectedReview(review);
    setAdminComment(review.adminComment || "");
    setViewDialogOpen(true);
  };

  const handleReplyToReview = (review: any) => {
    setSelectedReview(review);
    setReplyText(review.adminReply || "");
    setReplyDialogOpen(true);
  };

  const handleDeleteReview = (review: any) => {
    setSelectedReview(review);
    setDeleteDialogOpen(true);
  };

  const submitReply = async () => {
    if (!selectedReview || !replyText.trim()) return;

    try {
      const response = await reviews.replyToReview(
        selectedReview.id,
        replyText
      );
      if (response?.data?.success) {
        toast.success("Reply added successfully");
        setReplyDialogOpen(false);
        fetchReviews(); // Refresh the list
      } else {
        toast.error(response?.data?.message || "Failed to add reply");
      }
    } catch (error: any) {
      console.error("Error adding reply:", error);
      toast.error(error.message || "An error occurred");
    }
  };

  const updateReviewStatus = async (reviewId: string, status: string) => {
    try {
      const response = await reviews.updateReview(reviewId, {
        status: status as any,
      });
      if (response?.data?.success) {
        toast.success(`Review status updated to ${status}`);
        fetchReviews(); // Refresh the list
        fetchStats(); // Update stats
        setViewDialogOpen(false);
      } else {
        toast.error(
          response?.data?.message || "Failed to update review status"
        );
      }
    } catch (error: any) {
      console.error("Error updating review status:", error);
      toast.error(error.message || "An error occurred");
    }
  };

  const updateAdminComment = async () => {
    if (!selectedReview) return;

    try {
      const response = await reviews.updateReview(selectedReview.id, {
        adminComment,
      });
      if (response?.data?.success) {
        toast.success("Admin comment updated");
        setViewDialogOpen(false);
        fetchReviews(); // Refresh the list
      } else {
        toast.error(
          response?.data?.message || "Failed to update admin comment"
        );
      }
    } catch (error: any) {
      console.error("Error updating admin comment:", error);
      toast.error(error.message || "An error occurred");
    }
  };

  const confirmDeleteReview = async () => {
    if (!selectedReview) return;

    try {
      const response = await reviews.deleteReview(selectedReview.id);
      if (response?.data?.success) {
        toast.success("Review deleted successfully");
        setDeleteDialogOpen(false);
        fetchReviews(); // Refresh the list
        fetchStats(); // Update stats
      } else {
        toast.error(response?.data?.message || "Failed to delete review");
      }
    } catch (error: any) {
      console.error("Error deleting review:", error);
      toast.error(error.message || "An error occurred");
    }
  };

  // Render star rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className="h-4 w-4"
            fill={i < rating ? "#FFD700" : "none"}
            stroke={i < rating ? "#FFD700" : "currentColor"}
          />
        ))}
      </div>
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 border-green-200"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge
            variant="outline"
            className="bg-red-100 text-red-800 border-red-200"
          >
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      case "PENDING":
      default:
        return (
          <Badge
            variant="outline"
            className="bg-yellow-100 text-yellow-800 border-yellow-200"
          >
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  // Loading state
  if (isLoading && !reviewsData.length) {
    return (
      <div className="flex h-full w-full items-center justify-center py-10">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-lg text-muted-foreground">
            Loading reviews...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !reviewsData.length) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center py-10">
        <AlertTriangle className="h-16 w-16 text-destructive" />
        <h2 className="mt-4 text-xl font-semibold">Something went wrong</h2>
        <p className="text-center text-muted-foreground">{error}</p>
        <Button variant="outline" className="mt-4" onClick={fetchReviews}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Reviews Management
          </h1>
          <p className="text-muted-foreground">
            Manage and respond to customer product reviews
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalReviews || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Average Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <span className="text-2xl font-bold mr-2">
                  {stats.averageRating ? stats.averageRating.toFixed(1) : "0.0"}
                </span>
                {renderStars(Math.round(stats.averageRating || 0))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.pendingReviews || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Recent Reviews (7 days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.recentReviews || 0}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filter Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative mt-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  name="search"
                  placeholder="Search by user or content"
                  className="pl-8"
                  value={filters.search}
                  onChange={handleFilterChange}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="rating">Rating</Label>
              <Select
                value={filters.rating}
                onValueChange={(value) => handleSelectChange("rating", value)}
              >
                <SelectTrigger id="rating" className="mt-1">
                  <SelectValue placeholder="All Ratings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="1">1 Star</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => handleSelectChange("status", value)}
              >
                <SelectTrigger id="status" className="mt-1">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sortBy">Sort By</Label>
              <div className="flex gap-2 mt-1">
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) => handleSelectChange("sortBy", value)}
                >
                  <SelectTrigger id="sortBy">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">Date</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filters.order}
                  onValueChange={(value) =>
                    handleSelectChange("order", value as "asc" | "desc")
                  }
                >
                  <SelectTrigger id="order">
                    <SelectValue placeholder="Order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Descending</SelectItem>
                    <SelectItem value="asc">Ascending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={resetFilters}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Reset
            </Button>
            <Button onClick={applyFilters}>Apply Filters</Button>
          </div>
        </CardContent>
      </Card>

      {/* Reviews Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reviews</CardTitle>
          <CardDescription>
            {pagination.total} total reviews found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {!isLoading && reviewsData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium">No reviews found</h3>
              <p className="text-muted-foreground mt-1">
                Try adjusting your filters or check back later
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Review</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviewsData.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell className="font-medium max-w-[150px] truncate">
                        {review.product?.name || "Unknown Product"}
                      </TableCell>
                      <TableCell>{renderStars(review.rating)}</TableCell>
                      <TableCell className="max-w-[200px]">
                        <div>
                          <p className="font-medium truncate">{review.title}</p>
                          <p className="text-muted-foreground text-sm truncate">
                            {review.comment}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{review.user?.name || "Anonymous"}</TableCell>
                      <TableCell>{formatDate(review.createdAt)}</TableCell>
                      <TableCell>{getStatusBadge(review.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleViewReview(review)}
                            >
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleReplyToReview(review)}
                            >
                              Reply
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                updateReviewStatus(review.id, "APPROVED")
                              }
                              disabled={review.status === "APPROVED"}
                            >
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                updateReviewStatus(review.id, "REJECTED")
                              }
                              disabled={review.status === "REJECTED"}
                            >
                              Reject
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteReview(review)}
                              className="text-red-600"
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center mt-4">
              <DataTablePagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={(page) => {
                  setPagination((prev) => ({ ...prev, page }));
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* View/Edit Review Dialog */}
      {selectedReview && (
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Details</DialogTitle>
              <DialogDescription>
                View and manage this customer review
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">
                    {selectedReview.product?.name}
                  </h3>
                  <div className="flex items-center mt-1">
                    {renderStars(selectedReview.rating)}
                    <span className="ml-2 text-sm text-muted-foreground">
                      {selectedReview.rating}/5
                    </span>
                  </div>
                </div>
                {getStatusBadge(selectedReview.status)}
              </div>

              <div>
                <h4 className="text-sm font-medium mb-1">Review Title</h4>
                <p>{selectedReview.title}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-1">Review Content</h4>
                <p className="whitespace-pre-line">{selectedReview.comment}</p>
              </div>

              <div className="flex justify-between text-sm text-muted-foreground">
                <span>
                  By: {selectedReview.user?.name || "Anonymous"} (
                  {selectedReview.user?.email || "No email"})
                </span>
                <span>Posted: {formatDate(selectedReview.createdAt)}</span>
              </div>

              {selectedReview.adminReply && (
                <div className="bg-muted p-3 rounded-md mt-4">
                  <h4 className="text-sm font-medium mb-1">Admin Reply</h4>
                  <p className="text-sm">{selectedReview.adminReply}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Replied on: {formatDate(selectedReview.adminReplyDate)}
                  </p>
                </div>
              )}

              <div className="border-t pt-4 mt-4">
                <Label htmlFor="adminComment">
                  Admin Comment (Internal Only)
                </Label>
                <Textarea
                  id="adminComment"
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  placeholder="Add internal notes about this review"
                  className="mt-1"
                />
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-medium mb-3">Review Status</h4>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={
                      selectedReview.status === "APPROVED"
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      updateReviewStatus(selectedReview.id, "APPROVED")
                    }
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    variant={
                      selectedReview.status === "PENDING"
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      updateReviewStatus(selectedReview.id, "PENDING")
                    }
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    Mark as Pending
                  </Button>
                  <Button
                    variant={
                      selectedReview.status === "REJECTED"
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      updateReviewStatus(selectedReview.id, "REJECTED")
                    }
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setViewDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={updateAdminComment}>Save Comment</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Reply to Review Dialog */}
      {selectedReview && (
        <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Reply to Review</DialogTitle>
              <DialogDescription>
                Your reply will be visible to the customer and other shoppers
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="bg-muted p-3 rounded-md">
                <div className="flex items-center mb-2">
                  {renderStars(selectedReview.rating)}
                  <span className="ml-2 font-medium">
                    {selectedReview.title}
                  </span>
                </div>
                <p className="text-sm">{selectedReview.comment}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  By {selectedReview.user?.name || "Anonymous"} on{" "}
                  {formatDate(selectedReview.createdAt)}
                </p>
              </div>

              <div>
                <Label htmlFor="replyText">Your Reply</Label>
                <Textarea
                  id="replyText"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply to the customer here..."
                  className="mt-1"
                  rows={5}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setReplyDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={submitReply} disabled={!replyText.trim()}>
                Post Reply
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Review Dialog */}
      {selectedReview && (
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>Delete Review</DialogTitle>
              <DialogDescription>
                This action cannot be undone. The review will be permanently
                deleted.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <p>
                Are you sure you want to delete this review from{" "}
                <span className="font-medium">
                  {selectedReview.user?.name || "Anonymous"}
                </span>
                ?
              </p>
              <div className="bg-muted p-3 rounded-md mt-3">
                <div className="flex items-center">
                  {renderStars(selectedReview.rating)}
                  <span className="ml-2 text-sm">{selectedReview.title}</span>
                </div>
                <p className="text-sm mt-1 line-clamp-2">
                  {selectedReview.comment}
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDeleteReview}>
                <Trash className="h-4 w-4 mr-1" />
                Delete Review
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
