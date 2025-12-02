import { useState, useEffect } from "react";
import { customerUsers } from "@/api/adminService";
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
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { SafeRender } from "@/components/SafeRender";
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
import {
  Users,
  Search,
  MoreVertical,
  CheckCircle,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

// User type definition
interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  emailVerified: boolean;
  role: string;
  createdAt: string;
  updatedAt: string;
}

// User details dialog component
const UserDetailsDialog = ({
  user,
  open,
  onClose,
}: {
  user: User | null;
  open: boolean;
  onClose: () => void;
}) => {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>
            Detailed information about this user
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="font-medium text-gray-500">Name</div>
            <div className="col-span-2">{user.name || "Not provided"}</div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="font-medium text-gray-500">Email</div>
            <div className="col-span-2">{user.email}</div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="font-medium text-gray-500">Phone</div>
            <div className="col-span-2">{user.phone || "Not provided"}</div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="font-medium text-gray-500">Email Verified</div>
            <div className="col-span-2">
              {user.emailVerified ? (
                <Badge variant="success">Verified</Badge>
              ) : (
                <Badge variant="destructive">Not Verified</Badge>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="font-medium text-gray-500">Role</div>
            <div className="col-span-2">
              <Badge>{user.role}</Badge>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="font-medium text-gray-500">Created At</div>
            <div className="col-span-2">{formatDate(user.createdAt)}</div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="font-medium text-gray-500">Last Updated</div>
            <div className="col-span-2">{formatDate(user.updatedAt)}</div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Edit user dialog component
const EditUserDialog = ({
  user,
  open,
  onClose,
  onSave,
  isSaving,
}: {
  user: User | null;
  open: boolean;
  onClose: () => void;
  onSave: (
    userId: string,
    data: { name?: string; phone?: string; email?: string }
  ) => void;
  isSaving: boolean;
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      onSave(user.id, formData);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>Update user information</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium">
                Name
              </label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="User's name"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="user@example.com"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="phone" className="block text-sm font-medium">
                Phone
              </label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone number"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Delete confirmation dialog
const DeleteConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  isDeleting,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this user? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Main user management page component
export default function UserManagementPage() {
  // States
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const perPage = 15; // 15 users per page

  // Dialog states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch users on mount and when page changes
  useEffect(() => {
    fetchUsers();
  }, [page]);

  // Fetch users function
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await customerUsers.getUsers({
        page,
        limit: perPage,
        search: searchQuery,
      });

      if (response.data.success) {
        // Normalize user objects: backend may return `otpVerified` field
        const normalizedUsers: User[] = (response.data.data.users || []).map(
          (u: any) => ({
            // keep existing fields, but ensure `emailVerified` is present
            id: u.id,
            name: u.name,
            email: u.email,
            phone: u.phone,
            isActive: u.isActive,
            // prefer explicit emailVerified, fallback to otpVerified
            emailVerified: u.emailVerified ?? u.otpVerified ?? false,
            role: u.role,
            createdAt: u.createdAt,
            updatedAt: u.updatedAt,
          })
        );

        setUsers(normalizedUsers);
        setTotalUsers(response.data.data.pagination.total);
        setTotalPages(response.data.data.pagination.pages);
      } else {
        setError(response.data.message || "Failed to fetch users");
      }
    } catch (error: any) {
      console.error("Error fetching users:", error);
      setError(error.message || "An error occurred while fetching users");
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page
    setSearching(true);
    fetchUsers();
  };

  // Handle user verification
  const handleVerifyUser = async (userId: string) => {
    try {
      setIsUpdating(true);
      const response = await customerUsers.verifyUserEmail(userId);

      if (response.data.success) {
        toast.success("User email verified successfully");

        // Update the user in the list
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === userId ? { ...user, emailVerified: true } : user
          )
        );
      } else {
        toast.error(response.data.message || "Failed to verify user email");
      }
    } catch (error: any) {
      console.error("Error verifying user email:", error);
      toast.error(
        error.message || "An error occurred while verifying user email"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle edit user
  const handleEditUser = async (
    userId: string,
    data: { name?: string; phone?: string; email?: string }
  ) => {
    try {
      setIsUpdating(true);
      const response = await customerUsers.updateUserDetails(userId, data);

      if (response.data.success) {
        toast.success("User details updated successfully");

        // Update the user in the list
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === userId
              ? {
                ...user,
                name: data.name || user.name,
                email: data.email || user.email,
                phone: data.phone || user.phone,
              }
              : user
          )
        );

        // Close dialog
        setEditDialogOpen(false);
      } else {
        toast.error(response.data.message || "Failed to update user details");
      }
    } catch (error: any) {
      console.error("Error updating user details:", error);
      toast.error(
        error.message || "An error occurred while updating user details"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle delete user
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      setIsDeleting(true);
      const response = await customerUsers.deleteUser(selectedUser.id);

      if (response.data.success) {
        toast.success("User deleted successfully");

        // Remove user from list
        setUsers((prevUsers) =>
          prevUsers.filter((user) => user.id !== selectedUser.id)
        );

        // Close dialog
        setDeleteDialogOpen(false);

        // Refresh users if the list becomes empty
        if (users.length === 1) {
          // Go to previous page if not on first page
          if (page > 1) {
            setPage(page - 1);
          } else {
            fetchUsers();
          }
        }
      } else {
        toast.error(response.data.message || "Failed to delete user");
      }
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error(error.message || "An error occurred while deleting user");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                Manage customer accounts and access
              </CardDescription>
            </div>
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by name or email..."
                  className="pl-8 w-full md:w-[300px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit" size="sm" disabled={searching}>
                {searching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  "Search"
                )}
              </Button>
            </form>
          </div>
        </CardHeader>
        <CardContent>
          {loading && !users.length ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading users...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="h-8 w-8 text-destructive mb-4" />
              <p className="text-destructive font-semibold mb-2">Error</p>
              <p className="text-muted-foreground">{error}</p>
              <Button className="mt-4" onClick={fetchUsers}>
                Try Again
              </Button>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">No users found</p>
              {searchQuery && (
                <p className="text-sm text-center mb-4">
                  Try adjusting your search query or check back later
                </p>
              )}
              {searchQuery && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setPage(1);
                    fetchUsers();
                  }}
                >
                  Clear Search
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <SafeRender>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>

                      <TableHead>Email Verified</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.name || "—"}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>

                        <TableCell>
                          {user.emailVerified ? (
                            <Badge variant="outline" className="bg-green-50">
                              <CheckCircle className="h-3.5 w-3.5 text-green-600 mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-50">
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 mr-1" />
                              Not Verified
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                disabled={isUpdating}
                              >
                                <span className="sr-only">Open menu</span>
                                {isUpdating ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreVertical className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user);
                                  setViewDialogOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user);
                                  setEditDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              {!user.emailVerified && (
                                <DropdownMenuItem
                                  onClick={() => handleVerifyUser(user.id)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Verify Email
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </SafeRender>
            </div>
          )}

          {/* Pagination controls */}
          {!loading && !error && users.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing <span className="font-medium">{users.length}</span> of{" "}
                <span className="font-medium">{totalUsers}</span> users
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (page > 1) setPage(page - 1);
                      }}
                      aria-disabled={page === 1}
                      className={
                        page === 1 ? "pointer-events-none opacity-50" : ""
                      }
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <span className="px-4 py-2">
                      Page {page} of {totalPages}
                    </span>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (page < totalPages) setPage(page + 1);
                      }}
                      aria-disabled={page === totalPages}
                      className={
                        page === totalPages
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User details dialog */}
      <UserDetailsDialog
        user={selectedUser}
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
      />

      {/* Edit user dialog */}
      <EditUserDialog
        user={selectedUser}
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSave={handleEditUser}
        isSaving={isUpdating}
      />

      {/* Delete confirmation dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteUser}
        isDeleting={isDeleting}
      />
    </div>
  );
}
