import { useState, useEffect } from "react";
import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import { banners } from "@/api/adminService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Image as ImageIcon,
  Search,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDropzone } from "react-dropzone";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Banner Form Component
function BannerForm({
  mode,
  bannerId,
}: {
  mode: "create" | "edit";
  bannerId?: string;
}) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(mode === "edit");
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    link: "/products",
    position: 0,
    isPublished: true, // Default true
    isActive: true,
  });
  const [desktopImage, setDesktopImage] = useState<File | null>(null);
  const [mobileImage, setMobileImage] = useState<File | null>(null);
  const [desktopPreview, setDesktopPreview] = useState<string | null>(null);
  const [mobilePreview, setMobilePreview] = useState<string | null>(null);
  const [nextPosition, setNextPosition] = useState<number | null>(null);

  // Fetch next available position for create mode
  useEffect(() => {
    if (mode === "create") {
      const fetchNextPosition = async () => {
        try {
          const response = await banners.getBanners({
            limit: 1,
            sort: "position",
            order: "desc",
          });
          if (response.data.success) {
            const bannersList = response.data.data?.banners || [];
            const maxPosition =
              bannersList.length > 0
                ? Math.max(...bannersList.map((b: any) => b.position || 0))
                : -1;
            const nextPos = maxPosition + 1;
            setNextPosition(nextPos);
            setFormData((prev) => ({ ...prev, position: nextPos }));
          }
        } catch (error) {
          console.error("Error fetching next position:", error);
          setNextPosition(0);
        }
      };
      fetchNextPosition();
    }
  }, [mode]);

  // Load banner data for edit mode
  useEffect(() => {
    if (mode === "edit" && bannerId) {
      const fetchBanner = async () => {
        try {
          setFormLoading(true);
          const response = await banners.getBannerById(bannerId);
          if (response.data.success) {
            const banner = response.data.data.banner;
            setFormData({
              title: banner.title || "",
              subtitle: banner.subtitle || "",
              link: banner.link || "/products",
              position: banner.position || 0,
              isPublished: banner.isPublished !== false, // Keep existing value
              isActive: banner.isActive !== false,
            });
            setDesktopPreview(banner.desktopImage);
            setMobilePreview(banner.mobileImage);
          }
        } catch (error: any) {
          toast.error("Failed to load banner");
          console.error(error);
        } finally {
          setFormLoading(false);
        }
      };
      fetchBanner();
    }
  }, [mode, bannerId]);

  // Desktop image dropzone
  const {
    getRootProps: getDesktopRootProps,
    getInputProps: getDesktopInputProps,
    isDragActive: isDesktopDragActive,
  } = useDropzone({
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
    },
    multiple: false,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles[0]) {
        setDesktopImage(acceptedFiles[0]);
        setDesktopPreview(URL.createObjectURL(acceptedFiles[0]));
      }
    },
  });

  // Mobile image dropzone
  const {
    getRootProps: getMobileRootProps,
    getInputProps: getMobileInputProps,
    isDragActive: isMobileDragActive,
  } = useDropzone({
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
    },
    multiple: false,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles[0]) {
        setMobileImage(acceptedFiles[0]);
        setMobilePreview(URL.createObjectURL(acceptedFiles[0]));
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "create" && (!desktopImage || !mobileImage)) {
      toast.error("Please upload both desktop and mobile images");
      return;
    }

    if (mode === "edit" && !bannerId) {
      toast.error("Banner ID is missing");
      return;
    }

    setIsLoading(true);

    try {
      const submitData: any = {
        title: formData.title || undefined,
        subtitle: formData.subtitle || undefined,
        link: formData.link || "/products",
        // Send position for both create and edit - server will handle reordering
        position: parseInt(formData.position.toString()) || 0,
        isPublished: formData.isPublished,
        isActive: formData.isActive,
      };

      if (mode === "create") {
        submitData.desktopImage = desktopImage!;
        submitData.mobileImage = mobileImage!;
        const response = await banners.createBanner(submitData);
        if (response.data.success) {
          toast.success("Banner created successfully");
          navigate("/banners");
        }
      } else {
        if (desktopImage) submitData.desktopImage = desktopImage;
        if (mobileImage) submitData.mobileImage = mobileImage;
        const response = await banners.updateBanner(bannerId!, submitData);
        if (response.data.success) {
          toast.success("Banner updated successfully");
          navigate("/banners");
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save banner");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (formLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          {mode === "create" ? "Create Banner" : "Edit Banner"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Banner Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Title (Optional)</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Banner title"
              />
            </div>

            <div>
              <Label htmlFor="subtitle">Subtitle (Optional)</Label>
              <Textarea
                id="subtitle"
                value={formData.subtitle}
                onChange={(e) =>
                  setFormData({ ...formData, subtitle: e.target.value })
                }
                placeholder="Banner subtitle"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="link">Link URL</Label>
              <Input
                id="link"
                value={formData.link}
                onChange={(e) =>
                  setFormData({ ...formData, link: e.target.value })
                }
                placeholder="/products"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Default: /products (where banner will navigate on click)
              </p>
            </div>

            <div>
              <Label htmlFor="position">
                Position{" "}
                {mode === "create" && nextPosition !== null && (
                  <span className="text-xs text-gray-500">
                    (Suggested: {nextPosition})
                  </span>
                )}
              </Label>
              <Input
                id="position"
                type="number"
                min="0"
                value={formData.position}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    position: parseInt(e.target.value) || 0,
                  })
                }
                placeholder={
                  mode === "create" ? nextPosition?.toString() || "0" : "0"
                }
              />
              <p className="text-sm text-gray-500 mt-1">
                {mode === "create"
                  ? "Set position (0 = first). Existing banners at this position and after will be shifted down."
                  : "Change position (0 = first). Other banners will be automatically reordered."}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isPublished"
                checked={formData.isPublished}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isPublished: checked })
                }
              />
              <Label htmlFor="isPublished">Published</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Desktop Image (Large Screen)</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              {...getDesktopRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDesktopDragActive
                  ? "border-primary bg-primary/5"
                  : "border-gray-300 hover:border-primary"
              }`}
            >
              <input {...getDesktopInputProps()} />
              {desktopPreview ? (
                <div className="space-y-4">
                  <img
                    src={desktopPreview}
                    alt="Desktop preview"
                    className="max-h-64 mx-auto rounded-lg"
                  />
                  <p className="text-sm text-gray-500">
                    Click or drag to replace
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <ImageIcon className="h-12 w-12 mx-auto text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">
                      Drag & drop desktop image here, or click to select
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Recommended: 1920x1080px or larger
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mobile Image (Small Screen)</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              {...getMobileRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isMobileDragActive
                  ? "border-primary bg-primary/5"
                  : "border-gray-300 hover:border-primary"
              }`}
            >
              <input {...getMobileInputProps()} />
              {mobilePreview ? (
                <div className="space-y-4">
                  <img
                    src={mobilePreview}
                    alt="Mobile preview"
                    className="max-h-64 mx-auto rounded-lg"
                  />
                  <p className="text-sm text-gray-500">
                    Click or drag to replace
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <ImageIcon className="h-12 w-12 mx-auto text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">
                      Drag & drop mobile image here, or click to select
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Recommended: 1080x1920px or similar portrait ratio
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>Save Banner</>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/banners")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

// Banners List Component
function BannersList() {
  const [bannersList, setBannersList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPublishedFilter, setIsPublishedFilter] = useState<string>("");

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setIsLoading(true);
        const params: any = {
          page: 1,
          limit: 100,
          ...(searchQuery && { search: searchQuery }),
          ...(isPublishedFilter && { isPublished: isPublishedFilter }),
        };

        const response = await banners.getBanners(params);

        if (response.data.success) {
          setBannersList(response.data.data?.banners || []);
        } else {
          setError(response.data.message || "Failed to fetch banners");
        }
      } catch (error: any) {
        console.error("Error fetching banners:", error);
        setError("Failed to load banners. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBanners();
  }, [searchQuery, isPublishedFilter]);

  const handleDelete = async (bannerId: string) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;

    try {
      const response = await banners.deleteBanner(bannerId);
      if (response.data.success) {
        toast.success(
          "Banner deleted successfully. Positions have been reordered."
        );
        // Refresh the list to get updated positions
        const refreshResponse = await banners.getBanners({
          page: 1,
          limit: 100,
          ...(searchQuery && { search: searchQuery }),
          ...(isPublishedFilter && { isPublished: isPublishedFilter }),
        });
        if (refreshResponse.data.success) {
          setBannersList(refreshResponse.data.data?.banners || []);
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete banner");
    }
  };

  const handleTogglePublish = async (bannerId: string) => {
    try {
      const response = await banners.togglePublishBanner(bannerId);
      if (response.data.success) {
        const newStatus = response.data.data.banner.isPublished;
        toast.success(
          `Banner ${newStatus ? "published" : "unpublished"} successfully`
        );
        setBannersList((prev) =>
          prev.map((b) =>
            b.id === bannerId ? { ...b, isPublished: newStatus } : b
          )
        );
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update banner");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Banners Management</h1>
        <Link to="/banners/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Banner
          </Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search banners..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={isPublishedFilter}
              onChange={(e) => setIsPublishedFilter(e.target.value)}
              className="px-4 py-2 border rounded-md"
            >
              <option value="">All Status</option>
              <option value="true">Published</option>
              <option value="false">Unpublished</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Link</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bannersList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No banners found
                  </TableCell>
                </TableRow>
              ) : (
                bannersList.map((banner) => (
                  <TableRow key={banner.id}>
                    <TableCell>
                      <div className="flex gap-2">
                        <img
                          src={banner.desktopImage}
                          alt={banner.title || "Desktop"}
                          className="h-16 w-24 object-cover rounded"
                        />
                        <img
                          src={banner.mobileImage}
                          alt={banner.title || "Mobile"}
                          className="h-16 w-12 object-cover rounded"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {banner.title || "No title"}
                        </div>
                        {banner.subtitle && (
                          <div className="text-sm text-gray-500">
                            {banner.subtitle}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {banner.link}
                      </code>
                    </TableCell>
                    <TableCell>{banner.position}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge
                          variant={banner.isPublished ? "default" : "secondary"}
                        >
                          {banner.isPublished ? "Published" : "Unpublished"}
                        </Badge>
                        <Badge
                          variant={banner.isActive ? "default" : "destructive"}
                        >
                          {banner.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTogglePublish(banner.id)}
                          title={banner.isPublished ? "Unpublish" : "Publish"}
                        >
                          {banner.isPublished ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Link to={`/banners/${banner.id}`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(banner.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// Main Component
export default function BannersPage() {
  const { id } = useParams();
  const location = useLocation();
  const isNewBanner = location.pathname.includes("/new");
  const isEditBanner = !!id;

  if (isNewBanner) {
    return <BannerForm mode="create" />;
  }

  if (isEditBanner) {
    return <BannerForm mode="edit" bannerId={id} />;
  }

  return <BannersList />;
}
