import { useState, useEffect } from "react";
import axios from "axios";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  MoreHorizontal,
  Eye,
  Trash2,
  MessageSquare,
  Search,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { API_URL } from "@/config/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: "NEW" | "IN_PROGRESS" | "RESOLVED" | "SPAM";
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ContactSubmissionsResponse {
  submissions: ContactSubmission[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalSubmissions: number;
  };
}

const statusColors: Record<string, string> = {
  NEW: "bg-blue-500",
  IN_PROGRESS: "bg-yellow-500",
  RESOLVED: "bg-green-500",
  SPAM: "bg-gray-500",
};

const statusLabels: Record<string, string> = {
  NEW: "New",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  SPAM: "Spam",
};

const updateStatusSchema = z.object({
  status: z.enum(["NEW", "IN_PROGRESS", "RESOLVED", "SPAM"]),
  notes: z.string().optional(),
});

const ContactManagementPage = () => {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] =
    useState<ContactSubmission | null>(null);

  const { toast } = useToast();

  const updateForm = useForm<z.infer<typeof updateStatusSchema>>({
    resolver: zodResolver(updateStatusSchema),
    defaultValues: {
      status: "NEW",
      notes: "",
    },
  });

  const fetchSubmissions = async () => {
    setIsLoading(true);
    try {
      let url = `${API_URL}/admin/contact?page=${page}&limit=10`;
      if (selectedStatus) {
        url += `&status=${selectedStatus}`;
      }

      const response = await axios.get<{ data: ContactSubmissionsResponse }>(
        url
      );

      // Add defensive checks for the response structure
      const responseData = response.data?.data;
      setSubmissions(responseData?.submissions || []);
      setTotalPages(responseData?.pagination?.totalPages || 1);
    } catch (error) {
      console.error("Error fetching contact submissions:", error);
      setSubmissions([]); // Set empty array on error
      toast({
        title: "Error",
        description: "Failed to fetch contact submissions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [page, selectedStatus]);

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value === "ALL" ? null : value);
    setPage(1);
  };

  const handleViewSubmission = (submission: ContactSubmission) => {
    setSelectedSubmission(submission);
    setViewDialogOpen(true);
  };

  const handleUpdateStatus = (submission: ContactSubmission) => {
    setSelectedSubmission(submission);
    updateForm.setValue("status", submission.status);
    updateForm.setValue("notes", submission.notes || "");
    setUpdateDialogOpen(true);
  };

  const confirmDelete = (submission: ContactSubmission) => {
    setSelectedSubmission(submission);
    setDeleteDialogOpen(true);
  };

  const handleDeleteSubmission = async () => {
    if (!selectedSubmission) return;

    try {
      await axios.delete(`${API_URL}/admin/contact/${selectedSubmission.id}`);

      toast({
        title: "Success",
        description: "Contact submission deleted successfully",
      });

      fetchSubmissions();
    } catch (error) {
      console.error("Error deleting contact submission:", error);
      toast({
        title: "Error",
        description: "Failed to delete contact submission",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedSubmission(null);
    }
  };

  const handleUpdateSubmission = async (
    values: z.infer<typeof updateStatusSchema>
  ) => {
    if (!selectedSubmission) return;

    try {
      await axios.put(
        `${API_URL}/admin/contact/${selectedSubmission.id}/status`,
        {
          status: values.status,
          notes: values.notes,
        }
      );

      toast({
        title: "Success",
        description: "Contact submission updated successfully",
      });

      fetchSubmissions();
      setUpdateDialogOpen(false);
      setSelectedSubmission(null);
    } catch (error) {
      console.error("Error updating contact submission:", error);
      toast({
        title: "Error",
        description: "Failed to update contact submission",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Contact Submissions
        </h1>
        <p className="text-muted-foreground">
          Manage customer inquiries and contact form submissions
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Contact Submissions</CardTitle>
              <CardDescription>
                View and manage customer contact form submissions
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by name or email..."
                  className="pl-8 w-full sm:w-[200px] md:w-[250px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select
                value={selectedStatus || "ALL"}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="NEW">New</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="SPAM">Spam</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            </div>
          ) : !submissions || submissions.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">
                No contact submissions found
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Subject
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        Date
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell className="font-medium">
                          {submission.name}
                          {submission.phone && (
                            <div className="text-xs text-muted-foreground md:hidden">
                              {submission.phone}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="truncate max-w-[150px]">
                          {submission.email}
                        </TableCell>
                        <TableCell className="hidden md:table-cell truncate max-w-[150px]">
                          {submission.subject || "No subject"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {formatDistanceToNow(new Date(submission.createdAt), {
                            addSuffix: true,
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[submission.status]}>
                            {statusLabels[submission.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="data-[state=open]:bg-muted"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleViewSubmission(submission)}
                              >
                                <Eye className="mr-2 h-4 w-4" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleUpdateStatus(submission)}
                              >
                                <MessageSquare className="mr-2 h-4 w-4" />{" "}
                                Update Status
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => confirmDelete(submission)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                        className={
                          page <= 1 ? "pointer-events-none opacity-50" : ""
                        }
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (pageNum) => (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => setPage(pageNum)}
                            isActive={pageNum === page}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    )}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          setPage((prev) =>
                            prev < totalPages ? prev + 1 : prev
                          )
                        }
                        className={
                          page >= totalPages
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* View Contact Submission Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Contact Submission Details</DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Name
                  </h3>
                  <p className="mt-1">{selectedSubmission.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Email
                  </h3>
                  <p className="mt-1 break-all">{selectedSubmission.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Phone
                  </h3>
                  <p className="mt-1">
                    {selectedSubmission.phone || "Not provided"}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Subject
                  </h3>
                  <p className="mt-1">
                    {selectedSubmission.subject || "No subject"}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Status
                </h3>
                <div className="mt-1">
                  <Badge className={statusColors[selectedSubmission.status]}>
                    {statusLabels[selectedSubmission.status]}
                  </Badge>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Message
                </h3>
                <div className="mt-1 p-3 bg-muted rounded-md whitespace-pre-wrap">
                  {selectedSubmission.message}
                </div>
              </div>

              {selectedSubmission.notes && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Admin Notes
                  </h3>
                  <div className="mt-1 p-3 bg-muted rounded-md whitespace-pre-wrap">
                    {selectedSubmission.notes}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Submitted
                  </h3>
                  <p className="mt-1">
                    {new Date(selectedSubmission.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Last Updated
                  </h3>
                  <p className="mt-1">
                    {new Date(selectedSubmission.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setViewDialogOpen(false);
                    setSelectedSubmission(null);
                  }}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setViewDialogOpen(false);
                    handleUpdateStatus(selectedSubmission);
                  }}
                >
                  Update Status
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Submission Status</DialogTitle>
          </DialogHeader>
          <Form {...updateForm}>
            <form
              onSubmit={updateForm.handleSubmit(handleUpdateSubmission)}
              className="space-y-4 py-2"
            >
              <FormField
                control={updateForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NEW">New</SelectItem>
                          <SelectItem value="IN_PROGRESS">
                            In Progress
                          </SelectItem>
                          <SelectItem value="RESOLVED">Resolved</SelectItem>
                          <SelectItem value="SPAM">Spam</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={updateForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add notes about this submission"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setUpdateDialogOpen(false);
                    setSelectedSubmission(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">Update</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Contact Submission</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Are you sure you want to delete this contact submission from{" "}
              <span className="font-semibold">{selectedSubmission?.name}</span>?
              This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSubmission}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContactManagementPage;
