import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  Star,
  X,
  Plus,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { products } from "@/api/adminService";

interface ImageData {
  url: string;
  id?: string;
  isPrimary?: boolean;
  order?: number;
  file?: File;
  tempId?: string;
  isNew?: boolean;
}

interface VariantData {
  id?: string;
  name: string;
  sku: string;
  price: string;
  stock: string;
  salePrice?: string;
  images?: ImageData[];
  flavorId?: string;
  weightId?: string;
  flavor?: any;
  weight?: any;
  quantity?: number;
  isActive?: boolean;
  removedImageIds?: string[]; // Track removed image IDs
}

interface VariantCardProps {
  variant: VariantData;
  index: number;
  onUpdate: (index: number, field: string, value: any) => void;
  onRemove: (index: number) => void;
  onImagesChange: (index: number, images: ImageData[]) => void;
  isEditMode?: boolean;
}

export default function VariantCard({
  variant,
  index,
  onUpdate,
  onRemove,
  onImagesChange,
  isEditMode = false,
}: VariantCardProps) {
  const [isExpanded, setIsExpanded] = useState(true); // Default expanded so user can see images
  const [isUploading, setIsUploading] = useState(false);
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(
    null
  );
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleInputChange = (field: string, value: string) => {
    onUpdate(index, field, value);
  };

  // Get current images safely
  const currentImages = Array.isArray(variant.images) ? variant.images : [];
  const hasImages = currentImages.length > 0;
  const maxImages = 5;
  const remainingSlots = maxImages - currentImages.length;

  // Handle image upload via dropzone
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) {
        toast.error("No valid files selected");
        return;
      }

      if (remainingSlots <= 0) {
        toast.error(`Maximum ${maxImages} images allowed per variant`);
        return;
      }

      setIsUploading(true);

      try {
        // Validate files
        const validFiles = acceptedFiles
          .slice(0, remainingSlots)
          .filter((file) => {
            const isValidType = file.type.startsWith("image/");
            const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB

            if (!isValidType) {
              toast.error(`${file.name} is not a valid image file`);
              return false;
            }
            if (!isValidSize) {
              toast.error(`${file.name} is too large. Maximum size is 10MB`);
              return false;
            }
            return true;
          });

        if (validFiles.length === 0) {
          setIsUploading(false);
          return;
        }

        const newImages: ImageData[] = [];

        // If we're in edit mode and have a REAL variant ID (not UUID), upload directly to server
        // Check if variant.id exists and is not a temporary UUID (UUIDs are 36 characters with hyphens)
        const isRealVariantId =
          variant.id &&
          typeof variant.id === "string" &&
          !variant.id.includes("-") &&
          variant.id.length > 10;
        if (isEditMode && isRealVariantId) {
          for (let i = 0; i < validFiles.length; i++) {
            const file = validFiles[i];
            // Only set as primary if there are NO existing images AND it's the first file
            const isPrimary = currentImages.length === 0 && i === 0;
            const order = currentImages.length + i; // Append to end

            console.log(`📸 Uploading image ${i + 1}/${validFiles.length}:`, {
              fileName: file.name,
              isPrimary,
              existingImagesCount: currentImages.length,
              targetOrder: order,
              variantId: variant.id,
            });

            try {
              const response = await products.uploadVariantImage(
                variant.id!,
                file,
                isPrimary
              );

              console.log(`📸 Upload response for ${file.name}:`, {
                success: response.data.success,
                uploadedImage: response.data.data?.image,
                sentIsPrimary: isPrimary,
                receivedIsPrimary: response.data.data?.image?.isPrimary,
              });

              if (response.data.success) {
                const uploadedImage = response.data.data?.image;
                if (uploadedImage) {
                  // FIXED: Don't override with frontend isPrimary, trust backend response
                  newImages.push({
                    url: uploadedImage.url,
                    id: uploadedImage.id,
                    isPrimary: uploadedImage.isPrimary, // Use only server response
                    order: uploadedImage.order || order,
                    isNew: false,
                  });
                }
              }
            } catch (error) {
              console.error(`Failed to upload ${file.name}:`, error);
              toast.error(`Failed to upload ${file.name}`);
            }
          }
        } else {
          // Create mode or new variant in edit mode - store files locally
          const mode = isEditMode ? "new variant in edit mode" : "create mode";
          console.log(
            `📸 Storing images locally (${mode}) for variant ${index} (ID: ${variant.id})`
          );

          validFiles.forEach((file, i) => {
            const tempId = `temp-${Date.now()}-${index}-${i}-${Math.random()}`;
            const isPrimary = currentImages.length === 0 && i === 0;
            const order = currentImages.length + i; // Append to end
            const blobUrl = URL.createObjectURL(file);

            newImages.push({
              url: blobUrl,
              file,
              tempId,
              isPrimary,
              order,
              isNew: true,
            });
          });
        }

        // Update images array and fix ordering
        const allImages = [...currentImages, ...newImages];

        // Ensure proper order and primary image logic
        const orderedImages = allImages.map((img, i) => ({
          ...img,
          order: i,
          isPrimary:
            img.isPrimary || (i === 0 && allImages.length === newImages.length), // First image is primary if this is the first upload
        }));

        // Ensure only one primary image
        let hasPrimary = false;
        const finalImages = orderedImages.map((img) => {
          if (img.isPrimary && !hasPrimary) {
            hasPrimary = true;
            return { ...img, isPrimary: true };
          } else {
            return { ...img, isPrimary: false };
          }
        });

        // If no primary image was found, set the first one as primary
        if (!hasPrimary && finalImages.length > 0) {
          finalImages[0].isPrimary = true;
        }

        console.log(`📸 Updated images for variant ${index}:`, {
          totalImages: finalImages.length,
          newImagesCount: newImages.length,
          images: finalImages.map((img) => ({
            url: img.url,
            isPrimary: img.isPrimary,
            order: img.order,
            isNew: img.isNew,
            id: img.id || img.tempId,
          })),
        });

        onImagesChange(index, finalImages);

        if (isEditMode && !isRealVariantId) {
          toast.success(
            `${newImages.length} image(s) added. Images will be uploaded when you save the product.`
          );
        } else {
          toast.success(`${newImages.length} image(s) uploaded successfully`);
        }
      } catch (error) {
        console.error("Error uploading images:", error);
        toast.error("Failed to upload images");
      } finally {
        setIsUploading(false);
      }
    },
    [
      variant,
      index,
      onImagesChange,
      isEditMode,
      currentImages.length,
      remainingSlots,
    ]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: {
        "image/jpeg": [],
        "image/png": [],
        "image/webp": [],
        "image/gif": [],
      },
      maxSize: 10 * 1024 * 1024, // 10MB
      multiple: true,
      disabled: remainingSlots <= 0,
      onDropRejected: (rejectedFiles) => {
        rejectedFiles.forEach((file) => {
          const errors = file.errors.map((e) => e.message).join(", ");
          toast.error(`${file.file.name}: ${errors}`);
        });
      },
    });

  // Handle primary image setting
  const handleSetPrimary = async (imageIndex: number) => {
    const imageToSetPrimary = currentImages[imageIndex];

    if (!imageToSetPrimary) return;

    try {
      // Check if it's a real variant (not a temporary UUID) and existing image with ID
      const isRealVariantId =
        variant.id &&
        typeof variant.id === "string" &&
        variant.id.length >= 30 && // Real UUIDs are longer
        !variant.id.startsWith("new-") &&
        !variant.id.startsWith("temp-") &&
        !variant.id.startsWith("field");

      // If it's an existing image with ID and real variant, update on server
      if (imageToSetPrimary.id && isEditMode && isRealVariantId) {
        const response = await products.setVariantImageAsPrimary(
          imageToSetPrimary.id
        );

        if (response.data.success) {
          // Update local state with proper ordering
          const selectedImage = currentImages[imageIndex];

          // Move the selected image to the front and update orders
          const updatedImages = [
            selectedImage,
            ...currentImages.filter((_, i) => i !== imageIndex),
          ];

          // Update isPrimary flags and order values
          const reorderedImages = updatedImages.map((img, i) => ({
            ...img,
            isPrimary: i === 0, // Only first image is primary
            order: i, // Sequential ordering 0, 1, 2, 3...
          }));

          onImagesChange(index, reorderedImages);
          toast.success("Primary image updated successfully");

          console.log(`✅ Primary image set for variant ${variant.sku}:`, {
            newPrimaryId: selectedImage.id,
            newOrder: reorderedImages.map((img) => ({
              id: img.id,
              order: img.order,
              isPrimary: img.isPrimary,
            })),
          });
        } else {
          toast.error("Failed to set primary image");
        }
      } else {
        // Local update for new images - same logic as server update
        const selectedImage = currentImages[imageIndex];

        // Move the selected image to the front and update orders
        const updatedImages = [
          selectedImage,
          ...currentImages.filter((_, i) => i !== imageIndex),
        ];

        // Update isPrimary flags and order values
        const reorderedImages = updatedImages.map((img, i) => ({
          ...img,
          isPrimary: i === 0, // Only first image is primary
          order: i, // Sequential ordering 0, 1, 2, 3...
        }));

        onImagesChange(index, reorderedImages);
        toast.success("Primary image set");

        console.log(
          `✅ Primary image set locally for variant ${variant.sku}:`,
          {
            newPrimaryTempId: selectedImage.tempId || selectedImage.id,
            newOrder: reorderedImages.map((img) => ({
              id: img.id || img.tempId,
              order: img.order,
              isPrimary: img.isPrimary,
            })),
          }
        );
      }
    } catch (error) {
      console.error("Error setting primary image:", error);
      toast.error("Failed to set primary image");
    }
  };

  // Handle image removal
  const handleRemoveImage = async (imageIndex: number) => {
    const imageToRemove = currentImages[imageIndex];

    if (!imageToRemove) return;

    // Prevent removing the only image
    if (currentImages.length === 1) {
      toast.error(
        "Cannot remove the only image. Variants must have at least one image."
      );
      return;
    }

    try {
      // Check if it's a real variant (not a temporary UUID)
      const isRealVariantId =
        variant.id &&
        typeof variant.id === "string" &&
        variant.id.length >= 30 && // Real UUIDs are longer
        !variant.id.startsWith("new-") &&
        !variant.id.startsWith("temp-") &&
        !variant.id.startsWith("field");

      // If it's an existing image with ID and real variant, delete from server immediately
      if (imageToRemove.id && isEditMode && isRealVariantId) {
        const response = await products.deleteVariantImage(imageToRemove.id);

        if (response.data.success) {
          // Remove from local state
          const updatedImages = currentImages.filter(
            (_, i) => i !== imageIndex
          );

          // Reorder remaining images
          const reorderedImages = updatedImages.map((img, i) => ({
            ...img,
            order: i,
          }));

          // If we removed the primary image, set the first remaining as primary
          if (imageToRemove.isPrimary && reorderedImages.length > 0) {
            reorderedImages[0].isPrimary = true;

            // Update primary on server if there's an ID
            if (reorderedImages[0].id) {
              try {
                await products.setVariantImageAsPrimary(reorderedImages[0].id);
              } catch (error) {
                console.error("Error setting new primary image:", error);
              }
            }
          }

          onImagesChange(index, reorderedImages);
          toast.success("Image deleted successfully");
        } else {
          toast.error("Failed to delete image");
        }
      } else {
        // For local images (new ones) or when we want to defer deletion until save
        // Clean up blob URL if it's a local file
        if (imageToRemove.url && imageToRemove.url.startsWith("blob:")) {
          URL.revokeObjectURL(imageToRemove.url);
        }

        // Track removal of database images for batch processing during update
        if (imageToRemove.id && !imageToRemove.isNew) {
          // Get current removedImageIds array or initialize empty
          const currentRemovedIds = variant.removedImageIds || [];
          const updatedRemovedIds = [...currentRemovedIds, imageToRemove.id];

          // Update variant data with removedImageIds
          onUpdate(index, "removedImageIds", updatedRemovedIds);
          console.log(
            `📝 Marked image ${imageToRemove.id} for removal on next save`
          );
        }

        const updatedImages = currentImages.filter((_, i) => i !== imageIndex);

        // Reorder remaining images
        const reorderedImages = updatedImages.map((img, i) => ({
          ...img,
          order: i,
        }));

        // If we removed the primary image, set the first remaining as primary
        if (imageToRemove.isPrimary && reorderedImages.length > 0) {
          reorderedImages[0].isPrimary = true;
        }

        onImagesChange(index, reorderedImages);

        if (imageToRemove.id && !imageToRemove.isNew) {
          toast.success(
            "Image marked for removal. Will be deleted when you save the product."
          );
        } else {
          toast.success("Image removed");
        }
      }
    } catch (error) {
      console.error("Error removing image:", error);
      toast.error("Failed to remove image");
    }
  };

  // Handle drag and drop for reordering images
  const handleDragStart = (e: React.DragEvent, imageIndex: number) => {
    setDraggedImageIndex(imageIndex);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, imageIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(imageIndex);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (draggedImageIndex === null || draggedImageIndex === dropIndex) {
      setDraggedImageIndex(null);
      return;
    }

    const newImages = [...currentImages];
    const draggedImage = newImages[draggedImageIndex];

    // Remove the dragged image
    newImages.splice(draggedImageIndex, 1);

    // Insert at new position
    newImages.splice(dropIndex, 0, draggedImage);

    // Update order values
    const reorderedImages = newImages.map((img, i) => ({
      ...img,
      order: i,
    }));

    // Handle primary image logic
    if (dropIndex === 0) {
      // If we dropped an image at position 0, make it primary
      reorderedImages[0].isPrimary = true;
      reorderedImages.forEach((img, i) => {
        if (i !== 0) img.isPrimary = false;
      });
    } else if (draggedImage.isPrimary && dropIndex !== 0) {
      // If primary image was moved away from position 0, make the image at position 0 primary
      reorderedImages[0].isPrimary = true;
      reorderedImages.forEach((img, i) => {
        if (i !== 0) img.isPrimary = false;
      });
    }

    onImagesChange(index, reorderedImages);
    setDraggedImageIndex(null);

    // If it's a real variant, update the server
    const isRealVariantId =
      variant.id &&
      typeof variant.id === "string" &&
      variant.id.length >= 30 && // Real UUIDs are longer
      !variant.id.startsWith("new-") &&
      !variant.id.startsWith("temp-") &&
      !variant.id.startsWith("field");

    if (isEditMode && isRealVariantId) {
      try {
        const imageOrders = reorderedImages
          .filter((img) => img.id) // Only include images with IDs (existing images)
          .map((img, i) => ({
            imageId: img.id!,
            order: i,
          }));

        if (imageOrders.length > 0) {
          const response = await products.reorderVariantImages(
            variant.id!,
            imageOrders
          );
          console.log(`✅ Reorder response:`, response.data);
          toast.success("Images reordered successfully");
        } else {
          console.log(`⚠️ No images with IDs to reorder`);
        }
      } catch (error) {
        console.error("Error reordering images:", error);
        toast.error("Failed to reorder images");
      }
    } else {
      console.log(
        `📝 Local reorder only (variant ID: ${variant.id}, isEditMode: ${isEditMode})`
      );
      toast.success("Images reordered");
    }
  };

  // Generate variant display name
  const getVariantDisplayName = () => {
    const parts = [];
    if (variant.flavor?.name) parts.push(variant.flavor.name);
    if (variant.weight?.value && variant.weight?.unit) {
      parts.push(`${variant.weight.value}${variant.weight.unit}`);
    }
    return parts.length > 0 ? parts.join(" - ") : `Variant ${index + 1}`;
  };

  return (
    <Card className="p-4 border-l-4 border-l-blue-500 bg-white flex flex-col gap-4">
      {/* Variant Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              #{index + 1}
            </Badge>
            <h4 className="font-semibold text-lg">{getVariantDisplayName()}</h4>
            {hasImages && (
              <Badge variant="secondary" className="text-xs">
                {currentImages.length} image
                {currentImages.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            SKU: {variant.sku || "Auto-generated"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="cursor-pointer bg-gray-100 p-2 rounded-md hover:bg-gray-200"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(index)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Collapsed Preview */}
      {!isExpanded && hasImages && (
        <div className="flex gap-2 overflow-x-auto pb-2 flex-shrink-0">
          {currentImages.slice(0, 4).map((image, imageIndex) => (
            <div
              key={image.id || image.tempId || imageIndex}
              className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${image.isPrimary
                  ? "border-green-500 ring-1 ring-green-200"
                  : "border-gray-200"
                }`}
            >
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                {image.url ? (
                  <img
                    src={image.url}
                    alt={`Preview ${imageIndex + 1}`}
                    className="w-full h-full object-cover"
                    onLoad={() => {
                      console.log(`✅ Preview image loaded: ${image.url}`);
                    }}
                    onError={(e) => {
                      console.error(`❌ Preview image failed: ${image.url}`);
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `
                          <div class="flex items-center justify-center h-full bg-gray-100 text-gray-400">
                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                            </svg>
                          </div>
                        `;
                      }
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <ImageIcon className="h-4 w-4" />
                  </div>
                )}
              </div>
              {image.isPrimary && (
                <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-1 rounded-bl">
                  P
                </div>
              )}
            </div>
          ))}
          {currentImages.length > 4 && (
            <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-500">
              +{currentImages.length - 4}
            </div>
          )}
        </div>
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <div className="space-y-4 flex-1">
          {/* Variant Details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor={`sku-${index}`} className="text-xs">
                SKU
              </Label>
              <Input
                id={`sku-${index}`}
                value={variant.sku}
                onChange={(e) => handleInputChange("sku", e.target.value)}
                className="h-8"
                readOnly
                placeholder="Auto-generated"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor={`quantity-${index}`} className="text-xs">
                Stock
              </Label>
              <Input
                id={`quantity-${index}`}
                type="number"
                min="0"
                value={variant.quantity || ""}
                onChange={(e) => handleInputChange("quantity", e.target.value)}
                className="h-8"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor={`price-${index}`} className="text-xs">
                Price (₹)
              </Label>
              <Input
                id={`price-${index}`}
                type="number"
                min="0"

                value={variant.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
                className="h-8"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor={`salePrice-${index}`} className="text-xs">
                Sale Price (₹)
              </Label>
              <Input
                id={`salePrice-${index}`}
                type="number"
                min="0"

                value={variant.salePrice || ""}
                onChange={(e) => handleInputChange("salePrice", e.target.value)}
                className="h-8"
                placeholder="Optional"
              />
            </div>
          </div>

          {/* Image Management Section */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Add variant images</Label>
              <Badge variant="outline" className="text-xs">
                {currentImages.length}/{maxImages}
              </Badge>
            </div>

            {/* Upload Area */}
            {remainingSlots > 0 && (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${isDragActive
                    ? isDragReject
                      ? "border-red-400 bg-red-50"
                      : "border-blue-400 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                  } ${isUploading ? "opacity-50 pointer-events-none" : ""} ${remainingSlots <= 0 ? "opacity-50 pointer-events-none" : ""}`}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center space-y-2">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100">
                    {isUploading ? (
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Plus className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {isUploading
                        ? "Uploading..."
                        : isDragActive
                          ? isDragReject
                            ? "Some files are not supported"
                            : "Drop images here"
                          : "Add variant images"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      JPG, PNG, WebP, GIF (max 10MB each) • {remainingSlots}{" "}
                      slots remaining
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Images Grid */}
            {hasImages && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                {currentImages.map((image, imageIndex) => (
                  <div
                    key={
                      image.id || image.tempId || `img-${index}-${imageIndex}`
                    }
                    draggable
                    onDragStart={(e) => handleDragStart(e, imageIndex)}
                    onDragOver={(e) => handleDragOver(e, imageIndex)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, imageIndex)}
                    className={`relative rounded-lg overflow-hidden border-2 transition-all cursor-move ${image.isPrimary
                        ? "border-green-500 ring-2 ring-green-200 shadow-lg"
                        : "border-gray-200"
                      } ${draggedImageIndex === imageIndex
                        ? "opacity-50 scale-95"
                        : ""
                      } ${dragOverIndex === imageIndex &&
                        draggedImageIndex !== imageIndex
                        ? "border-blue-400 bg-blue-50"
                        : ""
                      }`}
                  >
                    {/* Image Container */}
                    <div className="aspect-square bg-gray-100 flex items-center justify-center">
                      {image.url ? (
                        <img
                          src={image.url}
                          alt={`Variant image ${imageIndex + 1}`}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            console.error(
                              `❌ Failed to load image: ${image.url}`
                            );
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <div class="flex flex-col items-center justify-center h-full text-gray-400 p-4">
                                  <svg class="h-8 w-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                  </svg>
                                  <span class="text-xs text-center">Failed to load</span>
                                </div>
                              `;
                            }
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
                          <ImageIcon className="h-8 w-8 mb-2" />
                          <span className="text-xs text-center">No image</span>
                        </div>
                      )}
                    </div>

                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex gap-1">
                      {image.isPrimary && (
                        <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                          PRIMARY
                        </div>
                      )}
                      {image.isNew && (
                        <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                          NEW
                        </div>
                      )}
                    </div>

                    {/* Action Buttons - Below Image */}
                    <div className="absolute bottom-0 left-0 right-0 bg-white bg-opacity-90 backdrop-blur-sm p-2">
                      <div className="flex justify-center space-x-2">
                        {!image.isPrimary && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => handleSetPrimary(imageIndex)}
                            className="h-7 text-xs"
                            title="Set as primary"
                          >
                            <Star className="h-3 w-3 mr-1" />
                            Primary
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveImage(imageIndex)}
                          className="h-7 text-xs"
                          title="Remove image"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No Images State */}
            {!hasImages && (
              <div className="text-center py-6 text-gray-500 border border-gray-200 rounded-lg bg-gray-50">
                <ImageIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p className="font-medium">No images uploaded yet</p>
                <p className="text-sm mt-1">
                  Upload images using the area above
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
