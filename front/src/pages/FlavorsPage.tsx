import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import { flavors } from "@/api/adminService";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Coffee,
  Plus,
  ArrowLeft,
  Loader2,
  Trash2,
  Edit,
  ImageIcon,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { ErrorDialog } from "@/components/ErrorDialog";
import { useDebounce } from "@/utils/debounce";

export default function FlavorsPage() {
  const { id } = useParams();
  const location = useLocation();
  const isNewFlavor = location.pathname.includes("/new");
  const isEditFlavor = !!id;

  // Show appropriate content based on route
  if (isNewFlavor) {
    return <FlavorForm mode="create" />;
  }

  if (isEditFlavor) {
    return <FlavorForm mode="edit" flavorId={id} />;
  }

  return <FlavorsList />;
}

function FlavorsList() {
  const navigate = useNavigate();
  const [flavorsList, setFlavorsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flavorToDelete, setFlavorToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Error dialog state
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [errorDialogContent, setErrorDialogContent] = useState({
    title: "",
    description: "",
  });

  // Search state
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  // Fetch flavors
  useEffect(() => {
    const fetchFlavors = async () => {
      try {
        setIsLoading(true);
        const params = debouncedSearch ? { search: debouncedSearch } : {};
        const response = await flavors.getFlavors(params);

        if (response.data.success) {
          setFlavorsList(response.data.data?.flavors || []);
        } else {
          setError(response.data.message || "Failed to fetch flavors");
        }
      } catch (error: any) {
        console.error("Error fetching flavors:", error);
        setError("Failed to load flavors. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFlavors();
  }, [debouncedSearch]);

  // Handle flavor deletion
  const handleDeleteFlavor = async (
    flavorId: string,
    force: boolean = false
  ) => {
    try {
      const response = await flavors.deleteFlavor(flavorId, force);

      if (response.data.success) {
        toast.success("Flavor deleted successfully");
        // Update the flavors list
        setFlavorsList(flavorsList.filter((flavor) => flavor.id !== flavorId));
        // Close the error dialog if it's open
        setIsErrorDialogOpen(false);
      } else {
        toast.error(response.data.message || "Failed to delete flavor");
      }
    } catch (error: any) {
      console.error("Error deleting flavor:", error);

      // Check if there's a specific error message from the API
      const errorMessage =
        error.response?.data?.message ||
        "An error occurred while deleting the flavor";

      // Check if this is a "flavor in use" error and backend allows force delete
      if (
        error.response?.status === 400 &&
        (error.response?.data?.canForceDelete ||
          error.response?.data?.data?.canForceDelete) &&
        !force
      ) {
        const errorData = error.response.data.data || error.response.data;
        setErrorDialogContent({
          title: "Flavor In Use",
          description: `This flavor is being used by ${errorData.variantCount || "some"} product variants. You can force delete this flavor, which will remove it from all product variants that use it.`,
        });
        setIsErrorDialogOpen(true);
      } else {
        toast.error(errorMessage);
      }
    }
  };

  // Handle flavor deletion confirmation dialog
  const confirmDeleteFlavor = (flavorId: string) => {
    setFlavorToDelete({ id: flavorId, name: "" });
    handleDeleteFlavor(flavorId);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center py-10">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-lg text-muted-foreground">
            Loading flavors...
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
        secondaryAction={{
          label: "View Products",
          onClick: () => navigate("/products"),
        }}
        tertiaryAction={{
          label: "Force Delete",
          onClick: () => {
            if (flavorToDelete) {
              handleDeleteFlavor(flavorToDelete.id, true);
            }
          },
          isDestructive: true,
        }}
      />

      {/* Header and Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Flavors</h1>
        <Button asChild>
          <Link to="/flavors/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Flavor
          </Link>
        </Button>
      </div>

      {/* Search Input */}
      <div className="max-w-xs mb-2">
        <Input
          type="text"
          placeholder="Search flavors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Flavors List */}
      {flavorsList.length === 0 ? (
        <Card className="p-6 flex items-center justify-center flex-col text-center">
          <Coffee className="h-12 w-12 mb-4 text-primary/40" />
          <h3 className="text-lg font-medium">No Flavors Found</h3>
          <p className="text-muted-foreground mt-2">
            Create your first flavor to start adding product variants
          </p>
          <Button className="mt-4" asChild>
            <Link to="/flavors/new">Add Your First Flavor</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {flavorsList.map((flavor) => (
            <Card key={flavor.id} className="overflow-hidden">
              <div className="h-40 bg-muted flex items-center justify-center">
                {flavor.image ? (
                  <img
                    src={flavor.image}
                    alt={flavor.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Coffee className="h-16 w-16 text-muted-foreground/40" />
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg">{flavor.name}</h3>
                {flavor.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {flavor.description}
                  </p>
                )}
                <div className="flex justify-end gap-2 mt-3">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/flavors/${flavor.id}`}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Link>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => confirmDeleteFlavor(flavor.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function FlavorForm({
  mode,
  flavorId,
}: {
  mode: "create" | "edit";
  flavorId?: string;
}) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(mode === "edit");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch flavor details if in edit mode
  useEffect(() => {
    if (mode === "edit" && flavorId) {
      const fetchFlavorDetails = async () => {
        try {
          setIsFetching(true);
          const response = await flavors.getFlavorById(flavorId);
          console.log("Flavor details response:", response); // Debug logging

          if (response.data.success) {
            const flavorData = response.data.data?.flavor;
            setFormData({
              name: flavorData?.name || "",
              description: flavorData?.description || "",
            });
            if (flavorData?.image) {
              setImagePreview(flavorData.image);
            }
          } else {
            setError(response.data.message || "Failed to fetch flavor details");
          }
        } catch (error: any) {
          console.error("Error fetching flavor:", error);
          setError("An error occurred while fetching the flavor");
        } finally {
          setIsFetching(false);
        }
      };

      fetchFlavorDetails();
    }
  }, [mode, flavorId]);

  // Handle form input changes
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle image selection
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const data = {
        ...formData,
        image: imageFile,
      };

      let response;
      if (mode === "create") {
        response = await flavors.createFlavor(data);
      } else {
        response = await flavors.updateFlavor(flavorId!, data);
      }

      if (response.data.success) {
        toast.success(
          mode === "create"
            ? "Flavor created successfully"
            : "Flavor updated successfully"
        );
        navigate("/flavors");
      } else {
        setError(
          response.data.message ||
            `Failed to ${mode === "create" ? "create" : "update"} flavor`
        );
      }
    } catch (error: any) {
      console.error(`Error ${mode}ing flavor:`, error);
      setError(`An error occurred while ${mode}ing the flavor`);
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
          <p className="mt-4 text-lg text-muted-foreground">
            Loading flavor...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/flavors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Flavors
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">
            {mode === "create" ? "Create Flavor" : "Edit Flavor"}
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
              <Label htmlFor="name">Flavor Name *</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Chocolate, Vanilla, Strawberry"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Enter a short description of this flavor"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="image">Flavor Image</Label>
              <div className="flex flex-col gap-4">
                {imagePreview ? (
                  <div className="relative h-48 w-48 rounded-md overflow-hidden border">
                    <img
                      src={imagePreview}
                      alt="Flavor preview"
                      className="h-full w-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex h-48 w-48 items-center justify-center rounded-md border border-dashed bg-muted">
                    <ImageIcon className="h-12 w-12 text-muted-foreground/40" />
                  </div>
                )}
                <div>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("image")?.click()}
                  >
                    {imagePreview ? "Change Image" : "Upload Image"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/flavors")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "create" ? "Create Flavor" : "Update Flavor"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
