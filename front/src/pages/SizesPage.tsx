import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import { sizes } from "@/api/adminService";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import {
  Ruler,
  Plus,
  ArrowLeft,
  Loader2,
  Trash2,
  Edit,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { toast } from "sonner";
import { ErrorDialog } from "@/components/ErrorDialog";
import { useDebounce } from "@/utils/debounce";

export default function SizesPage() {
  const { id } = useParams();
  const location = useLocation();
  const isNewSize = location.pathname.includes("/new");
  const isEditSize = !!id;

  // Show appropriate content based on route
  if (isNewSize) {
    return <SizeForm mode="create" />;
  }

  if (isEditSize) {
    return <SizeForm mode="edit" sizeId={id} />;
  }

  return <SizesList />;
}

function SizesList() {
  const navigate = useNavigate();
  const [sizesList, setSizesList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Error dialog state
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [errorDialogContent, setErrorDialogContent] = useState<{
    title: string;
    description: string;
    showForceDelete?: boolean;
    onForceDelete?: () => void;
  }>({
    title: "",
    description: "",
  });

  // Search state
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  // Fetch sizes
  useEffect(() => {
    const fetchSizes = async () => {
      try {
        setIsLoading(true);
        const params = debouncedSearch ? { search: debouncedSearch } : {};
        const response = await sizes.getSizes(params);

        if (response.data.success) {
          const fetchedSizes = response.data.data?.sizes || [];
          // Sort by order, then by name if order is same
          const sortedSizes = [...fetchedSizes].sort((a, b) => {
            const orderA = a.order ?? 999;
            const orderB = b.order ?? 999;
            if (orderA !== orderB) {
              return orderA - orderB;
            }
            return (a.name || "").localeCompare(b.name || "");
          });
          setSizesList(sortedSizes);
        } else {
          setError(response.data.message || "Failed to fetch sizes");
        }
      } catch (error: any) {
        console.error("Error fetching sizes:", error);
        setError("Failed to load sizes. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSizes();
  }, [debouncedSearch]);

  // Handle size deletion confirmation
  const confirmDeleteSize = (sizeId: string, sizeName: string) => {
    handleDeleteSize(sizeId, sizeName);
  };

  // Handle size deletion
  const handleDeleteSize = async (
    sizeId: string,
    sizeName: string,
    force: boolean = false
  ) => {
    try {
      const response = await sizes.deleteSize(sizeId, force);

      if (response.data.success || response.status === 200) {
        toast.success("Size deleted successfully");
        setSizesList(sizesList.filter((size) => size.id !== sizeId));
      } else {
        toast.error(response.data.message || "Failed to delete size");
      }
    } catch (error: any) {
      console.error("Error deleting size:", error);

      // Handle error with force delete option
      if (
        error.response?.status === 400 &&
        error.response?.data?.data?.canForceDelete
      ) {
        setErrorDialogContent({
          title: "Size in Use",
          description: `${error.response.data.message}\n\nForce delete available - this will remove the size from all product variants and then delete it. This action cannot be undone.`,
        });
        setIsErrorDialogOpen(true);
      } else if (
        error.response?.data?.message?.includes("in use by product variants") ||
        error.response?.data?.message?.includes("Cannot delete size")
      ) {
        setErrorDialogContent({
          title: "Cannot Delete Size",
          description: `This size (${sizeName}) cannot be deleted because it is currently in use by one or more product variants.\n\nTo delete this size, you must first remove it from all product variants that use it.`,
        });
        setIsErrorDialogOpen(true);
      } else {
        toast.error(
          error.response?.data?.message ||
            "An error occurred while deleting the size"
        );
      }
    }
  };

  // Handle order update
  const handleOrderUpdate = async (
    sizeId: string,
    direction: "up" | "down"
  ) => {
    const sizeIndex = sizesList.findIndex((s) => s.id === sizeId);
    if (sizeIndex === -1) return;

    const currentSize = sizesList[sizeIndex];
    const targetIndex = direction === "up" ? sizeIndex - 1 : sizeIndex + 1;

    if (targetIndex < 0 || targetIndex >= sizesList.length) return;

    const targetSize = sizesList[targetIndex];
    const currentOrder = currentSize.order ?? sizeIndex;
    const targetOrder = targetSize.order ?? targetIndex;

    try {
      // Swap orders
      await sizes.updateSize(sizeId, { order: targetOrder });
      await sizes.updateSize(targetSize.id, { order: currentOrder });

      // Update local state and re-sort
      const newSizes = sizesList.map((s) => {
        if (s.id === sizeId) return { ...s, order: targetOrder };
        if (s.id === targetSize.id) return { ...s, order: currentOrder };
        return s;
      });
      
      // Re-sort by order
      const sortedSizes = [...newSizes].sort((a, b) => {
        const orderA = a.order ?? 999;
        const orderB = b.order ?? 999;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return (a.name || "").localeCompare(b.name || "");
      });
      
      setSizesList(sortedSizes);
      toast.success("Size order updated");
    } catch (error: any) {
      console.error("Error updating size order:", error);
      toast.error("Failed to update size order");
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center py-10">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-lg text-muted-foreground">Loading sizes...</p>
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
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Dialog */}
      <ErrorDialog
        open={isErrorDialogOpen}
        setOpen={setIsErrorDialogOpen}
        title={errorDialogContent.title}
        description={errorDialogContent.description}
        secondaryAction={
          errorDialogContent.title === "Size in Use"
            ? {
                label: "Force Delete",
                onClick: () => {
                  setIsErrorDialogOpen(false);
                  const sizeToDelete = sizesList.find((s) =>
                    errorDialogContent.description.includes(s.name)
                  );
                  if (sizeToDelete) {
                    handleDeleteSize(sizeToDelete.id, sizeToDelete.name, true);
                  }
                },
              }
            : {
                label: "View Products",
                onClick: () => navigate("/products"),
              }
        }
      />

      {/* Header and Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Sizes</h1>
        <Button asChild>
          <Link to="/sizes/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Size
          </Link>
        </Button>
      </div>

      {/* Search Input */}
      <div className="max-w-xs mb-2">
        <Input
          type="text"
          placeholder="Search sizes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Sizes List */}
      {sizesList.length === 0 ? (
        <Card className="p-6 flex items-center justify-center flex-col text-center">
          <Ruler className="h-12 w-12 mb-4 text-primary/40" />
          <h3 className="text-lg font-medium">No Sizes Found</h3>
          <p className="text-muted-foreground mt-2">
            Create your first size to start adding product variants
          </p>
          <Button className="mt-4" asChild>
            <Link to="/sizes/new">Add Your First Size</Link>
          </Button>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Order
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Size Name
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Description
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {sizesList.map((size, index) => (
                  <tr key={size.id} className="border-b">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground min-w-[3rem]">
                          {size.order ?? index}
                        </span>
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleOrderUpdate(size.id, "up")}
                            disabled={index === 0}
                            title="Move up"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleOrderUpdate(size.id, "down")}
                            disabled={index === sizesList.length - 1}
                            title="Move down"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Ruler className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">{size.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {size.description || "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/sizes/${size.id}`}>
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => confirmDeleteSize(size.id, size.name)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function SizeForm({
  mode,
  sizeId,
}: {
  mode: "create" | "edit";
  sizeId?: string;
}) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(mode === "edit");
  const [formData, setFormData] = useState({
    name: "",
    order: 0,
    description: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [availableSizes, setAvailableSizes] = useState<any[]>([]);
  const [useCustomSize, setUseCustomSize] = useState(false);

  // Predefined common sizes
  const commonSizes = [
    { value: "XS", label: "XS (Extra Small)", order: 0 },
    { value: "S", label: "S (Small)", order: 1 },
    { value: "M", label: "M (Medium)", order: 2 },
    { value: "L", label: "L (Large)", order: 3 },
    { value: "XL", label: "XL (Extra Large)", order: 4 },
    { value: "XXL", label: "XXL (2X Large)", order: 5 },
    { value: "XXXL", label: "XXXL (3X Large)", order: 6 },
    { value: "28", label: "28", order: 7 },
    { value: "30", label: "30", order: 8 },
    { value: "32", label: "32", order: 9 },
    { value: "34", label: "34", order: 10 },
    { value: "36", label: "36", order: 11 },
    { value: "38", label: "38", order: 12 },
    { value: "40", label: "40", order: 13 },
    { value: "42", label: "42", order: 14 },
    { value: "44", label: "44", order: 15 },
    { value: "46", label: "46", order: 16 },
    { value: "48", label: "48", order: 17 },
    { value: "50", label: "50", order: 18 },
    { value: "52", label: "52", order: 19 },
  ];

  // Fetch size details if in edit mode
  useEffect(() => {
    if (mode === "edit" && sizeId) {
      const fetchSizeDetails = async () => {
        try {
          setIsFetching(true);
          const response = await sizes.getSizeById(sizeId);

          if (response.data.success) {
            const sizeData = response.data.data?.size;
            setFormData({
              name: sizeData?.name || "",
              order: sizeData?.order || 0,
              description: sizeData?.description || "",
            });
          } else {
            setError(response.data.message || "Failed to fetch size details");
          }
        } catch (error: any) {
          console.error("Error fetching size:", error);
          setError("An error occurred while fetching the size");
        } finally {
          setIsFetching(false);
        }
      };

      fetchSizeDetails();
    } else if (mode === "create") {
      // Get sizes for order dropdown
      const fetchSizes = async () => {
        try {
          const response = await sizes.getSizes();
          if (response.data.success) {
            const sizesList = response.data.data?.sizes || [];
            setAvailableSizes(sizesList);
            const maxOrder = Math.max(
              ...sizesList.map((s: any) => s.order || 0),
              -1
            );
            setFormData((prev) => ({ ...prev, order: maxOrder + 1 }));
          }
        } catch (error) {
          console.error("Error fetching sizes for order:", error);
        }
      };
      fetchSizes();
    } else if (mode === "edit" && sizeId) {
      // Fetch all sizes for order dropdown in edit mode
      const fetchSizes = async () => {
        try {
          const response = await sizes.getSizes();
          if (response.data.success) {
            const sizesList = response.data.data?.sizes || [];
            setAvailableSizes(sizesList.filter((s: any) => s.id !== sizeId));
          }
        } catch (error) {
          console.error("Error fetching sizes:", error);
        }
      };
      fetchSizes();
    }
  }, [mode, sizeId]);

  // Handle predefined size selection
  const handlePredefinedSizeSelect = (sizeValue: string) => {
    const selectedSize = commonSizes.find((s) => s.value === sizeValue);
    if (selectedSize) {
      setFormData((prev) => ({
        ...prev,
        name: selectedSize.value,
        order: selectedSize.order,
      }));
      setUseCustomSize(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "order" ? parseInt(value) || 0 : value,
    }));
    // If user types in name field, switch to custom mode
    if (name === "name" && value) {
      setUseCustomSize(true);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const data = {
        name: formData.name.trim(),
        order: formData.order,
        description: formData.description.trim() || undefined,
      };

      let response;
      if (mode === "create") {
        response = await sizes.createSize(data);
      } else {
        response = await sizes.updateSize(sizeId!, data);
      }

      if (response.data.success) {
        toast.success(
          mode === "create"
            ? "Size created successfully"
            : "Size updated successfully"
        );
        navigate("/sizes");
      } else {
        setError(
          response.data.message ||
            `Failed to ${mode === "create" ? "create" : "update"} size`
        );
      }
    } catch (error: any) {
      console.error(`Error ${mode}ing size:`, error);
      setError(
        error.response?.data?.message ||
          `An error occurred while ${mode}ing the size`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state during fetch
  if (isFetching) {
    return (
      <div className="flex h-full w-full items-center justify-center py-10">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-lg text-muted-foreground">Loading size...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/sizes">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sizes
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">
            {mode === "create" ? "Create Size" : "Edit Size"}
          </h1>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      )}

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="size-select">Size Name *</Label>
              <div className="space-y-2">
                {!useCustomSize ? (
                  <>
                    <Select
                      value={formData.name || ""}
                      onValueChange={handlePredefinedSizeSelect}
                    >
                      <SelectTrigger id="size-select">
                        <SelectValue placeholder="Select a common size or enter custom" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">
                          Custom Size (Enter manually)
                        </SelectItem>
                        {commonSizes.map((size) => (
                          <SelectItem key={size.value} value={size.value}>
                            {size.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formData.name && (
                      <div className="flex items-center gap-2">
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Or enter custom size"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, name: "" }));
                            setUseCustomSize(false);
                          }}
                        >
                          Clear
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-2">
                    <Input
                      id="name"
                      name="name"
                      placeholder="e.g., S, M, L, XL, XXL, 28, 30, 32, or custom size"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setUseCustomSize(false);
                        setFormData((prev) => ({ ...prev, name: "" }));
                      }}
                    >
                      Use Predefined Sizes Instead
                    </Button>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Select from common sizes (S, M, L, XL, XXL, etc.) or enter a
                custom size name
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="order">Display Order</Label>
              <Select
                value={formData.order.toString()}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, order: parseInt(value) }))
                }
              >
                <SelectTrigger id="order">
                  <SelectValue placeholder="Select order position" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {/* Show "First" option */}
                  <SelectItem value="0">
                    Position 0 (First - Before all sizes)
                  </SelectItem>
                  {/* Show options between existing sizes */}
                  {availableSizes.length > 0 && availableSizes
                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                    .map((size, idx) => {
                      const sortedSizes = [...availableSizes].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
                      const nextOrder = idx < sortedSizes.length - 1
                        ? (sortedSizes[idx + 1]?.order ?? (size.order ?? 0) + 1)
                        : (size.order ?? 0) + 1;
                      return (
                        <SelectItem key={`after-${size.id}`} value={nextOrder.toString()}>
                          Position {nextOrder} (After {size.name})
                        </SelectItem>
                      );
                    })}
                  {/* Show "Last" option */}
                  {availableSizes.length > 0 && (
                    <SelectItem value={(Math.max(...availableSizes.map(s => s.order ?? 0)) + 1).toString()}>
                      Position {Math.max(...availableSizes.map(s => s.order ?? 0)) + 1} (Last - After all sizes)
                    </SelectItem>
                  )}
                  {/* If no sizes exist, show default options */}
                  {availableSizes.length === 0 && (
                    <>
                      <SelectItem value="0">Position 0 (First)</SelectItem>
                      <SelectItem value="1">Position 1</SelectItem>
                      <SelectItem value="2">Position 2</SelectItem>
                      <SelectItem value="3">Position 3</SelectItem>
                      <SelectItem value="4">Position 4</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Lower numbers appear first. Sizes are sorted by this order. Current order: <strong>{formData.order}</strong>
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Enter a short description for this size (optional)"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/sizes")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "create" ? "Create Size" : "Update Size"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
