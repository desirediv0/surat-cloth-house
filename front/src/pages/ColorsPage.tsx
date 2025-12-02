import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import { colors } from "@/api/adminService";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Palette,
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

export default function ColorsPage() {
  const { id } = useParams();
  const location = useLocation();
  const isNewColor = location.pathname.includes("/new");
  const isEditColor = !!id;

  // Show appropriate content based on route
  if (isNewColor) {
    return <ColorForm mode="create" />;
  }

  if (isEditColor) {
    return <ColorForm mode="edit" colorId={id} />;
  }

  return <ColorsList />;
}

function ColorsList() {
  const navigate = useNavigate();
  const [colorsList, setColorsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [colorToDelete, setColorToDelete] = useState<{
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

  // Fetch colors
  useEffect(() => {
    const fetchColors = async () => {
      try {
        setIsLoading(true);
        const params = debouncedSearch ? { search: debouncedSearch } : {};
        const response = await colors.getColors(params);

        if (response.data.success) {
          setColorsList(response.data.data?.colors || []);
        } else {
          setError(response.data.message || "Failed to fetch colors");
        }
      } catch (error: any) {
        console.error("Error fetching colors:", error);
        setError("Failed to load colors. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchColors();
  }, [debouncedSearch]);

  // Handle color deletion
  const handleDeleteColor = async (colorId: string, force: boolean = false) => {
    try {
      const response = await colors.deleteColor(colorId, force);

      if (response.data.success) {
        toast.success("Color deleted successfully");
        setColorsList(colorsList.filter((color) => color.id !== colorId));
        setIsErrorDialogOpen(false);
      } else {
        toast.error(response.data.message || "Failed to delete color");
      }
    } catch (error: any) {
      console.error("Error deleting color:", error);

      const errorMessage =
        error.response?.data?.message ||
        "An error occurred while deleting the color";

      if (
        error.response?.status === 400 &&
        (error.response?.data?.canForceDelete ||
          error.response?.data?.data?.canForceDelete) &&
        !force
      ) {
        const errorData = error.response.data.data || error.response.data;
        setErrorDialogContent({
          title: "Color In Use",
          description: `This color is being used by ${errorData.variantCount || "some"} product variants. You can force delete this color, which will remove it from all product variants that use it.`,
        });
        setIsErrorDialogOpen(true);
      } else {
        toast.error(errorMessage);
      }
    }
  };

  // Handle color deletion confirmation dialog
  const confirmDeleteColor = (colorId: string) => {
    setColorToDelete({ id: colorId, name: "" });
    handleDeleteColor(colorId);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center py-10">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-lg text-muted-foreground">
            Loading colors...
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
            if (colorToDelete) {
              handleDeleteColor(colorToDelete.id, true);
            }
          },
          isDestructive: true,
        }}
      />

      {/* Header and Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Colors</h1>
        <Button asChild>
          <Link to="/colors/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Color
          </Link>
        </Button>
      </div>

      {/* Search Input */}
      <div className="max-w-xs mb-2">
        <Input
          type="text"
          placeholder="Search colors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Colors List */}
      {colorsList.length === 0 ? (
        <Card className="p-6 flex items-center justify-center flex-col text-center">
          <Palette className="h-12 w-12 mb-4 text-primary/40" />
          <h3 className="text-lg font-medium">No Colors Found</h3>
          <p className="text-muted-foreground mt-2">
            Create your first color to start adding product variants
          </p>
          <Button className="mt-4" asChild>
            <Link to="/colors/new">Add Your First Color</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {colorsList.map((color) => (
            <Card key={color.id} className="overflow-hidden">
              <div className="h-40 bg-muted flex items-center justify-center relative">
                {color.image ? (
                  <img
                    src={color.image}
                    alt={color.name}
                    className="h-full w-full object-cover"
                  />
                ) : color.hexCode ? (
                  <div
                    className="h-full w-full"
                    style={{ backgroundColor: color.hexCode }}
                  />
                ) : (
                  <Palette className="h-16 w-16 text-muted-foreground/40" />
                )}
                {color.hexCode && (
                  <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs font-mono">
                    {color.hexCode}
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg">{color.name}</h3>
                {color.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {color.description}
                  </p>
                )}
                <div className="flex justify-end gap-2 mt-3">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/colors/${color.id}`}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Link>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => confirmDeleteColor(color.id)}
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

function ColorForm({
  mode,
  colorId,
}: {
  mode: "create" | "edit";
  colorId?: string;
}) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(mode === "edit");
  const [formData, setFormData] = useState({
    name: "",
    hexCode: "",
    description: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch color details if in edit mode
  useEffect(() => {
    if (mode === "edit" && colorId) {
      const fetchColorDetails = async () => {
        try {
          setIsFetching(true);
          const response = await colors.getColorById(colorId);

          if (response.data.success) {
            const colorData = response.data.data?.color;
            setFormData({
              name: colorData?.name || "",
              hexCode: colorData?.hexCode || "",
              description: colorData?.description || "",
            });
            if (colorData?.image) {
              setImagePreview(colorData.image);
            }
          } else {
            setError(response.data.message || "Failed to fetch color details");
          }
        } catch (error: any) {
          console.error("Error fetching color:", error);
          setError("An error occurred while fetching the color");
        } finally {
          setIsFetching(false);
        }
      };

      fetchColorDetails();
    }
  }, [mode, colorId]);

  // Comprehensive color name to hex code mapping for auto-fill
  const colorNameToHex: Record<string, string> = {
    // Basic Colors
    red: "#FF0000",
    blue: "#0000FF",
    green: "#008000",
    yellow: "#FFFF00",
    orange: "#FFA500",
    purple: "#800080",
    pink: "#FFC0CB",
    black: "#000000",
    white: "#FFFFFF",
    gray: "#808080",
    grey: "#808080",
    brown: "#A52A2A",

    // Blues
    navy: "#000080",
    "navy blue": "#000080",
    "royal blue": "#4169E1",
    "sky blue": "#87CEEB",
    "baby blue": "#89CFF0",
    "powder blue": "#B0E0E6",
    "steel blue": "#4682B4",
    "midnight blue": "#191970",
    "cornflower blue": "#6495ED",
    "slate blue": "#6A5ACD",
    "dodger blue": "#1E90FF",
    "light blue": "#ADD8E6",
    "dark blue": "#00008B",
    "bright blue": "#0096FF",
    "ocean blue": "#006994",
    "azure": "#007FFF",

    // Greens
    "lime green": "#32CD32",
    "forest green": "#228B22",
    "emerald": "#50C878",
    "mint green": "#98FB98",
    "olive green": "#556B2F",
    "sage green": "#87AE73",
    "sea green": "#2E8B57",
    "lime": "#00FF00",
    "light green": "#90EE90",
    "dark green": "#006400",
    "hunter green": "#355E3B",
    "jade": "#00A86B",
    "teal": "#008080",
    "turquoise": "#40E0D0",
    "aqua": "#00FFFF",
    "cyan": "#00FFFF",

    // Reds & Pinks
    "crimson": "#DC143C",
    "scarlet": "#FF2400",
    "burgundy": "#800020",
    "maroon": "#800000",
    "rose": "#FF007F",
    "hot pink": "#FF69B4",
    "fuchsia": "#FF00FF",
    "magenta": "#FF00FF",
    "coral": "#FF7F50",
    "salmon": "#FA8072",
    "tomato": "#FF6347",
    "cherry": "#DE3163",
    "raspberry": "#E30B5D",
    "wine": "#722F37",

    // Yellows & Oranges
    "gold": "#FFD700",
    "amber": "#FFBF00",
    "mustard": "#FFDB58",
    "lemon": "#FFF700",
    "canary": "#FFEF00",
    "honey": "#FFC30B",
    "tangerine": "#FF7F00",
    "apricot": "#FBCEB1",
    "peach": "#FFE5B4",
    "cantaloupe": "#FFA07A",
    "papaya": "#FFEFD5",

    // Purples & Violets
    "lavender": "#E6E6FA",
    "lilac": "#C8A2C8",
    "plum": "#DDA0DD",
    "violet": "#EE82EE",
    "indigo": "#4B0082",
    "amethyst": "#9966CC",
    "orchid": "#DA70D6",
    "mauve": "#E0B0FF",
    "periwinkle": "#CCCCFF",

    // Browns & Tans
    "tan": "#D2B48C",
    "beige": "#F5F5DC",
    "khaki": "#F0E68C",
    "camel": "#C19A6B",
    "coffee": "#6F4E37",
    "chocolate": "#7B3F00",
    "cocoa": "#D2691E",
    "caramel": "#AF6E4D",
    "hazel": "#8E7618",
    "walnut": "#773F1A",

    // Grays & Neutrals
    "silver": "#C0C0C0",
    "charcoal": "#36454F",
    "slate": "#708090",
    "ash": "#B2BEB5",
    "pearl": "#F8F6F0",
    "ivory": "#FFFFF0",
    "cream": "#FFFDD0",
    "off white": "#FAF9F6",
    "light gray": "#D3D3D3",
    "dark gray": "#A9A9A9",
    "light grey": "#D3D3D3",
    "dark grey": "#A9A9A9",

    // Fashion Colors
    "nude": "#E3BC9A",
    "blush": "#DE5D83",
    "dusty rose": "#B76E79",
    "sage": "#87AE73",
    "terracotta": "#E2725B",
    "rust": "#B7410E",
    "mint": "#98FB98",

    // Indian Fashion Colors
    "saffron": "#F4C430",
    "turmeric": "#F0C420",
    "henna": "#6B4423",
    "marigold": "#FFB347",
    "jasmine": "#F8DE7E",
    "lotus": "#E6E6FA",
    "rosewood": "#65000B",
    "mango": "#FFC324",
    "pomegranate": "#660000",

    // Additional Common Colors
    "sapphire": "#0F52BA",
    "ruby": "#E0115F",
    "topaz": "#FFC87C",
    "cerulean": "#007BA7",
    "cobalt": "#0047AB",
    "ultramarine": "#120A8F",
  };

  // Auto-fill hex code based on color name
  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const name = inputValue.trim().toLowerCase();

    setFormData((prev) => {
      // Check if user has manually edited hex code (by checking if it matches a known color)
      const wasAutoFilled = Object.values(colorNameToHex).includes(prev.hexCode);
      const shouldAutoFill = !prev.hexCode || prev.hexCode === "" || wasAutoFilled;

      let hexCode = prev.hexCode;

      // Try exact match first
      if (shouldAutoFill && colorNameToHex[name]) {
        hexCode = colorNameToHex[name];
      }
      // Try partial match (for multi-word colors like "navy blue")
      else if (shouldAutoFill && name.length > 2) {
        // Find the best matching color name
        const matchingKey = Object.keys(colorNameToHex).find((key) => {
          const keyLower = key.toLowerCase();
          return keyLower === name ||
            keyLower.startsWith(name) ||
            name.startsWith(keyLower) ||
            keyLower.includes(name) ||
            name.includes(keyLower);
        });

        if (matchingKey) {
          hexCode = colorNameToHex[matchingKey];
        }
      }

      return { ...prev, name: inputValue, hexCode };
    });
  };

  // Handle form input changes
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle hex code change with validation
  const handleHexCodeChange = (e: ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.trim();
    // Add # if not present
    if (value && !value.startsWith("#")) {
      value = "#" + value;
    }
    // Validate hex color format
    if (!value || /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value)) {
      setFormData((prev) => ({ ...prev, hexCode: value }));
    }
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
        hexCode: formData.hexCode || undefined,
        image: imageFile,
      };

      let response;
      if (mode === "create") {
        response = await colors.createColor(data);
      } else {
        response = await colors.updateColor(colorId!, data);
      }

      if (response.data.success) {
        toast.success(
          mode === "create"
            ? "Color created successfully"
            : "Color updated successfully"
        );
        navigate("/colors");
      } else {
        setError(
          response.data.message ||
          `Failed to ${mode === "create" ? "create" : "update"} color`
        );
      }
    } catch (error: any) {
      console.error(`Error ${mode}ing color:`, error);
      setError(`An error occurred while ${mode}ing the color`);
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
          <p className="mt-4 text-lg text-muted-foreground">Loading color...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Colors
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">
            {mode === "create" ? "Create Color" : "Edit Color"}
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
              <Label htmlFor="name">Color Name *</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Red, Blue, Black, Navy Blue"
                value={formData.name}
                onChange={handleNameChange}
                required
              />
              <p className="text-xs text-muted-foreground">
                Hex code will auto-fill based on color name, or you can set it
                manually below
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="hexCode">Hex Color Code</Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="hexCode"
                  name="hexCode"
                  type="text"
                  placeholder="#FF5733 or FF5733"
                  value={formData.hexCode}
                  onChange={handleHexCodeChange}
                  maxLength={7}
                  className="flex-1"
                />
                <Input
                  type="color"
                  value={formData.hexCode || "#000000"}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      hexCode: e.target.value,
                    }));
                  }}
                  className="w-16 h-10 cursor-pointer"
                  title="Pick a color"
                />
                {formData.hexCode && (
                  <div
                    className="w-12 h-10 rounded border"
                    style={{ backgroundColor: formData.hexCode }}
                    title={formData.hexCode}
                  />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Optional: Use the color picker or enter hex code manually (e.g.,
                #FF5733). Auto-fills based on color name.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Enter a short description of this color"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="image">Color Swatch Image (Optional)</Label>
              <div className="flex flex-col gap-4">
                {imagePreview ? (
                  <div className="relative h-48 w-48 rounded-md overflow-hidden border">
                    <img
                      src={imagePreview}
                      alt="Color preview"
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
              onClick={() => navigate("/colors")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "create" ? "Create Color" : "Update Color"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
