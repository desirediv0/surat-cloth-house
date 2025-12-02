import { useState, useEffect, useCallback, Fragment } from "react";
import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import { products, categories, colors, sizes } from "@/api/adminService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { SafeRender } from "@/components/SafeRender";
import {
  Package,
  Search,
  Plus,
  Edit,
  Trash2,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDropzone } from "react-dropzone";
import { Badge } from "@/components/ui/badge";
import { v4 as uuidv4 } from "uuid";
import { Checkbox } from "@/components/ui/checkbox";
import { DeleteProductDialog } from "@/components/DeleteProductDialog";
import VariantCard from "@/components/VariantCard";
import { useDebounce } from "@/utils/debounce";
// import { MultiSelect } from "@/components/ui/multiselect";

function useCategories() {
  const [categoriesData, setCategoriesData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const response = await categories.getCategories();

        if (response.data.success) {
          setCategoriesData(response.data.data?.categories || []);
        } else {
          setError(response.data.message || "Failed to fetch categories");
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        setError("An error occurred while fetching categories");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories: categoriesData, isLoading, error };
}

// Export ProductForm for reuse in other components
export function ProductForm({
  mode,
  productId,
}: {
  mode: "create" | "edit";
  productId?: string;
}) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(mode === "edit");
  const [colorsList, setColorsList] = useState<any[]>([]);
  const [sizesList, setSizesList] = useState<any[]>([]);
  const [brandsList, setBrandsList] = useState<any[]>([]);
  const [hasVariants, setHasVariants] = useState(false);
  const [product, setProduct] = useState({
    name: "",
    description: "",
    categoryId: "",
    categoryIds: [] as string[],
    primaryCategoryId: "",
    sku: "",
    price: "",
    salePrice: "",
    quantity: 0,
    featured: false,
    ourProduct: false,
    productType: [] as string[],
    isActive: true,
    // SEO fields
    metaTitle: "",
    metaDescription: "",
    keywords: "",
    tags: [] as string[],
    // single brand association
    brandId: "",
    topBrandIds: [] as string[],
    newBrandIds: [] as string[],
    hotBrandIds: [] as string[],
  });

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);

  // State for variants
  const [variants, setVariants] = useState<any[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);

  // Add state to track selected categories
  const [selectedCategories, setSelectedCategories] = useState<any[]>([]);

  // Get categories data using the useCategories hook
  const { categories, isLoading: categoriesLoading } = useCategories();

  // Define a proper interface for image previews
  interface ImagePreview {
    url: string;
    id?: string;
    isPrimary?: boolean;
  }

  // Handle image drop for upload
  const onDrop = useCallback((acceptedFiles: File[]) => {
    console.log(
      `📸 Files dropped/selected: ${acceptedFiles.length}`,
      acceptedFiles
    );

    if (acceptedFiles.length === 0) {
      toast.error("No valid files selected");
      return;
    }

    // Validate files
    const validFiles = acceptedFiles.filter((file) => {
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
      return;
    }

    // Create local previews for the UI
    const newPreviews = validFiles.map((file) => ({
      url: URL.createObjectURL(file),
      isPrimary: false,
    }));

    setImageFiles((prev) => {
      // Set first image as primary if there are no existing images
      if (prev.length === 0 && newPreviews.length > 0) {
        newPreviews[0].isPrimary = true;
      }
      console.log(
        `📸 Total files after addition: ${prev.length + validFiles.length}`
      );
      return [...prev, ...validFiles];
    });

    setImagePreviews((prev) => [...prev, ...newPreviews]);

    toast.success(`${validFiles.length} image(s) added successfully`);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [],
      "image/png": [],
      "image/webp": [],
      "image/gif": [],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
    onDropRejected: (rejectedFiles) => {
      rejectedFiles.forEach((file) => {
        const errors = file.errors.map((e) => e.message).join(", ");
        toast.error(`${file.file.name}: ${errors}`);
      });
    },
  });

  // Remove image from preview and files
  const removeImage = (index: number) => {
    // If there's an ID, it's an existing image from the server
    const imageToRemove = imagePreviews[index];

    if (imageToRemove.id) {
      // Check if this is the only image
      if (imagePreviews.length === 1) {
        toast.error(
          "Cannot delete the only image. Products must have at least one image."
        );
        return;
      }

      // This is an existing image, delete from server
      products
        .deleteImage(imageToRemove.id)
        .then(() => {
          toast.success("Image deleted successfully");
          setImagePreviews((prev) => prev.filter((_, i) => i !== index));
        })
        .catch((error) => {
          console.error("Error deleting image:", error);
          if (error.response?.data?.message) {
            toast.error(error.response.data.message);
          } else {
            toast.error("Failed to delete image");
          }
        });
    } else {
      // This is a local preview only
      // Revoke the object URL to avoid memory leaks
      URL.revokeObjectURL(imagePreviews[index].url);

      // Remove from both arrays
      setImagePreviews((prev) => prev.filter((_, i) => i !== index));
      setImageFiles((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // Set an image as primary
  const setPrimaryImage = (index: number) => {
    // Update image previews with the new primary image
    setImagePreviews((prev) => {
      const updated = prev.map((preview, i) => ({
        ...preview,
        isPrimary: i === index,
      }));
      return updated;
    });
  };

  // Fetch colors for selection
  useEffect(() => {
    const fetchColors = async () => {
      try {
        const response = await colors.getColors();
        if (response.data.success) {
          setColorsList(response.data.data?.colors || []);
        }
      } catch (error) {
        console.error("Error fetching colors:", error);
        toast.error("Failed to load colors");
      }
    };

    fetchColors();
  }, []);

  // Fetch sizes for selection
  useEffect(() => {
    const fetchSizes = async () => {
      try {
        const response = await sizes.getSizes();
        if (response.data.success) {
          setSizesList(response.data.data?.sizes || []);
        }
      } catch (error) {
        console.error("Error fetching sizes:", error);
        toast.error("Failed to load sizes");
      }
    };

    fetchSizes();
  }, []);

  // Fetch brands for selection
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await import("@/api/adminService").then((m) =>
          m.brands.getBrands()
        );
        const raw = res.data.data?.brands || res.data.data || [];
        setBrandsList(Array.isArray(raw) ? raw : []);
      } catch (err) {
        console.error("Failed to load brands for product form", err);
      }
    };

    fetchBrands();
  }, []);

  // Fetch product details if in edit mode
  useEffect(() => {
    if (mode === "edit" && productId) {
      const fetchProductDetails = async () => {
        try {
          setFormLoading(true);
          const response = await products.getProductById(productId);

          if (response.data.success) {
            const productData = response.data.data?.product || {};

            // Get categories from the product
            const productCategories = productData.categories || [];
            const primaryCategory =
              productData.primaryCategory ||
              (productCategories.length > 0 ? productCategories[0] : null);

            // Set product data
            setProduct({
              name: productData.name || "",
              description: productData.description || "",
              // Prefill brandId if available
              brandId: productData.brand?.id || productData.brandId || "",
              categoryId: primaryCategory?.id || "",
              categoryIds: productCategories.map((c: any) => c.id),
              primaryCategoryId: primaryCategory?.id || "",
              sku:
                productData.variants?.length === 1 &&
                !productData.variants[0].colorId &&
                !productData.variants[0].sizeId
                  ? productData.variants[0].sku
                  : "",
              price:
                productData.variants?.length === 1 &&
                !productData.variants[0].colorId &&
                !productData.variants[0].sizeId
                  ? productData.variants[0].price.toString()
                  : "",
              salePrice:
                productData.variants?.length === 1 &&
                !productData.variants[0].colorId &&
                !productData.variants[0].sizeId &&
                productData.variants[0].salePrice
                  ? productData.variants[0].salePrice.toString()
                  : "",
              quantity:
                productData.variants?.length === 1 &&
                !productData.variants[0].colorId &&
                !productData.variants[0].sizeId
                  ? productData.variants[0].quantity
                  : 0,
              featured: productData.featured || false,
              ourProduct: productData.ourProduct || false,
              productType: productData.productType || [],
              isActive:
                productData.isActive !== undefined
                  ? productData.isActive
                  : true,
              // SEO fields
              metaTitle: productData.metaTitle || "",
              metaDescription: productData.metaDescription || "",
              keywords: productData.keywords || "",
              tags: productData.tags || [],
              topBrandIds: productData.topBrandIds || [],
              newBrandIds: productData.newBrandIds || [],
              hotBrandIds: productData.hotBrandIds || [],
            });

            // Set selected categories (for radio buttons, not checkboxes)
            setSelectedCategories(productCategories);

            // Setup image previews
            if (productData.images && productData.images.length > 0) {
              setImagePreviews(
                productData.images.map((img: any) => ({
                  url: img.url,
                  id: img.id,
                  isPrimary: img.isPrimary || false,
                }))
              );
            }

            if (productData.variants && productData.variants.length > 0) {
              const hasRealVariants =
                productData.variants.length > 1 ||
                (productData.variants.length === 1 &&
                  (productData.variants[0].colorId ||
                    productData.variants[0].sizeId));

              setHasVariants(hasRealVariants);

              if (hasRealVariants) {
                // Map the backend variants to the format expected by the form
                const formattedVariants = productData.variants.map(
                  (variant: any) => ({
                    id: variant.id,
                    sizeId: variant.sizeId,
                    colorId: variant.colorId,
                    size: variant.size,
                    color: variant.color,
                    sku: variant.sku || "",
                    price: variant.price ? variant.price.toString() : "0.00",
                    salePrice: variant.salePrice
                      ? variant.salePrice.toString()
                      : "",
                    quantity: variant.quantity || 0,
                    isActive:
                      variant.isActive !== undefined ? variant.isActive : true,
                    images: Array.isArray(variant.images)
                      ? variant.images.map((img: any) => ({
                          url: img.url,
                          id: img.id,
                          isPrimary: img.isPrimary || false,
                          isNew: false,
                        }))
                      : [],
                  })
                );

                setVariants(formattedVariants);

                // Set selected colors and sizes based on existing variants
                const colorIds = new Set<string>();
                const sizeIds = new Set<string>();

                productData.variants.forEach((variant: any) => {
                  if (variant.colorId) colorIds.add(variant.colorId);
                  if (variant.sizeId) sizeIds.add(variant.sizeId);
                });

                setSelectedColors(Array.from(colorIds));
                setSelectedSizes(Array.from(sizeIds));
              }
            }
          } else {
            toast.error(
              response.data.message || "Failed to fetch product details"
            );
          }
        } catch (error) {
          console.error("Error fetching product:", error);
          toast.error("An error occurred while fetching product data");
        } finally {
          setFormLoading(false);
        }
      };

      fetchProductDetails();
    }
  }, [mode, productId]);

  // Handle form input changes
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;

    if (type === "checkbox") {
      const { checked } = e.target as HTMLInputElement;
      setProduct((prev) => ({ ...prev, [name]: checked }));
    } else {
      setProduct((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle color selection
  const handleColorToggle = (colorId: string) => {
    setSelectedColors([colorId]);
  };

  // Handle size selection
  const handleSizeToggle = (sizeId: string) => {
    setSelectedSizes([sizeId]);
  };

  // Generate variants based on selected colors and sizes
  const generateVariants = () => {
    if (selectedColors.length === 0 && selectedSizes.length === 0) {
      toast.error(
        "Please select at least one color or size to generate variants"
      );
      return;
    }

    // Get color and size objects for selected IDs
    const selectedColorObjects = colorsList.filter((color) =>
      selectedColors.includes(color.id)
    );
    const selectedSizeObjects = sizesList.filter((size) =>
      selectedSizes.includes(size.id)
    );

    // Generate combinations of colors and sizes
    const newVariants: any[] = [];

    // Helper to check for duplicate
    const isDuplicate = (colorId: string | null, sizeId: string | null) => {
      return variants.some(
        (v) =>
          (v.colorId || null) === (colorId || null) &&
          (v.sizeId || null) === (sizeId || null)
      );
    };

    if (selectedColorObjects.length > 0 && selectedSizeObjects.length > 0) {
      selectedColorObjects.forEach((color) => {
        selectedSizeObjects.forEach((size) => {
          if (isDuplicate(color.id, size.id)) {
            return;
          }
          const skuBase = product.sku || "";
          const variantSku = `${skuBase}-${color.name
            .substring(0, 3)
            .toUpperCase()}-${size.name.toUpperCase()}`;
          const variantName = `${color.name} - ${size.name}`;
          newVariants.push({
            id: uuidv4(),
            name: variantName,
            colorId: color.id,
            sizeId: size.id,
            color,
            size,
            sku: variantSku,
            price: product.price || "",
            salePrice: product.salePrice || "",
            quantity: product.quantity || 0,
            isActive: true,
            images: [],
          });
        });
      });
    } else if (selectedColorObjects.length > 0) {
      selectedColorObjects.forEach((color) => {
        if (isDuplicate(color.id, null)) {
          return;
        }
        const skuBase = product.sku || "";
        const variantSku = `${skuBase}-${color.name
          .substring(0, 3)
          .toUpperCase()}`;
        newVariants.push({
          id: uuidv4(),
          name: color.name,
          colorId: color.id,
          sizeId: null,
          color,
          size: null,
          sku: variantSku,
          price: product.price || "",
          salePrice: product.salePrice || "",
          quantity: product.quantity || 0,
          isActive: true,
          images: [],
        });
      });
    } else if (selectedSizeObjects.length > 0) {
      selectedSizeObjects.forEach((size) => {
        if (isDuplicate(null, size.id)) {
          return;
        }
        const skuBase = product.sku || "";
        const variantSku = `${skuBase}-${size.name.toUpperCase()}`;
        newVariants.push({
          id: uuidv4(),
          name: size.name,
          colorId: null,
          sizeId: size.id,
          color: null,
          size,
          sku: variantSku,
          price: product.price || "",
          salePrice: product.salePrice || "",
          quantity: product.quantity || 0,
          isActive: true,
          images: [],
        });
      });
    }

    if (newVariants.length === 0) {
      // If all were duplicates, show a toast
      toast.error(
        "No new variants generated. All selected combinations already exist.",
        {
          position: "top-center",
        }
      );
      return;
    }

    setVariants((prev) => [...prev, ...newVariants]);
    toast.success(`${newVariants.length} new variant(s) generated!`, {
      position: "top-center",
    });
  };

  // Handle variant images change (used by VariantCard)
  const handleVariantImagesChange = (variantIndex: number, images: any[]) => {
    setVariants((prev) =>
      prev.map((variant, i) =>
        i === variantIndex ? { ...variant, images } : variant
      )
    );
  };

  // Update variant by index (used by VariantCard)
  const updateVariantByIndex = (
    variantIndex: number,
    field: string,
    value: any
  ) => {
    setVariants((prev) =>
      prev.map((variant, i) =>
        i === variantIndex ? { ...variant, [field]: value } : variant
      )
    );
  };

  // Remove variant by index (used by VariantCard)
  const removeVariantByIndex = (variantIndex: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== variantIndex));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate product name
    if (!product.name || product.name.trim() === "") {
      toast.error("Please provide a valid product name");
      setIsLoading(false);
      return;
    }

    // Validate category selection
    if (!product.categoryIds || product.categoryIds.length === 0) {
      toast.error("Please select at least one category");
      setIsLoading(false);
      return;
    }

    // Validate variants for variant products
    if (hasVariants && (!variants || variants.length === 0)) {
      toast.error("Please add at least one variant for this product");
      setIsLoading(false);
      return;
    }

    try {
      // Create FormData object for API submission
      const formData = new FormData();

      // Add basic product information
      formData.append("name", product.name);
      formData.append("description", product.description || "");
      formData.append("featured", String(product.featured));
      formData.append("ourProduct", String(product.ourProduct));
      formData.append("productType", JSON.stringify(product.productType));
      formData.append("isActive", String(product.isActive));
      formData.append("hasVariants", String(hasVariants));
      // Add SEO fields
      formData.append("metaTitle", product.metaTitle || "");
      formData.append("metaDescription", product.metaDescription || "");
      formData.append("keywords", product.keywords || "");
      formData.append("tags", JSON.stringify(product.tags || []));

      // Add categories information
      if (product.categoryIds && product.categoryIds.length > 0) {
        formData.append("categoryIds", JSON.stringify(product.categoryIds));
        if (product.primaryCategoryId) {
          formData.append("primaryCategoryId", product.primaryCategoryId);
        }
      }

      // Add simple product data if no variants
      if (!hasVariants) {
        // Add simple product data
        formData.append("price", String(product.price || 0));
        // Explicitly check for salePrice and handle it correctly
        if (product.salePrice) {
          formData.append("salePrice", String(product.salePrice));
        }
        formData.append("quantity", String(product.quantity || 0));
      }

      // Add variants if product has variants
      if (hasVariants && variants.length > 0) {
        // Ensure all required fields are in each variant
        const processedVariants = variants.map((variant) => {
          return {
            id: variant.id,
            sizeId: variant.sizeId || null,
            colorId: variant.colorId || null,
            sku: variant.sku || "",
            price: String(variant.price || 0),
            salePrice: variant.salePrice ? String(variant.salePrice) : "",
            quantity: String(variant.quantity || 0),
            isActive: variant.isActive !== undefined ? variant.isActive : true,
            removedImageIds: variant.removedImageIds || [], // Include removed image IDs for cleanup
          };
        });

        formData.append("variants", JSON.stringify(processedVariants));
      }

      // Add images (only for non-variant products)
      if (!hasVariants && imageFiles.length > 0) {
        console.log(
          `📸 Submitting ${imageFiles.length} images for simple product:`,
          imageFiles
        );

        // Add primary image index
        const primaryIndex = imagePreviews.findIndex(
          (img) => img.isPrimary === true
        );
        if (primaryIndex >= 0) {
          formData.append("primaryImageIndex", String(primaryIndex));
          console.log(`📸 Primary image index: ${primaryIndex}`);
        } else {
          // Default to first image as primary if none is marked
          formData.append("primaryImageIndex", "0");
          console.log(`📸 Default primary image index: 0`);
        }

        // Append each image file with proper field name for multer
        imageFiles.forEach((file, index) => {
          formData.append("images", file);
          console.log(
            `📸 Added image ${index + 1}: ${file.name} (${file.size} bytes)`
          );
        });

        // Also log the FormData contents
        console.log(
          `📸 FormData contents:`,
          Object.fromEntries(formData.entries())
        );
      } else if (hasVariants) {
        console.log(
          `📸 Skipping product images for variant product - will use variant-specific images`
        );
      }

      // Add topBrandIds, newBrandIds, hotBrandIds to formData
      // Include single brand association if set
      if ((product as any).brandId) {
        formData.append("brandId", (product as any).brandId);
      }
      formData.append("topBrandIds", JSON.stringify(product.topBrandIds || []));
      formData.append("newBrandIds", JSON.stringify(product.newBrandIds || []));
      formData.append("hotBrandIds", JSON.stringify(product.hotBrandIds || []));

      let response;
      if (mode === "create") {
        response = await products.createProduct(formData as any);
      } else {
        response = await products.updateProduct(productId!, formData as any);
      }

      if (response.data.success) {
        // If product creation/update was successful and we have variant images, upload them
        if (hasVariants && response.data.data?.product?.variants) {
          const productVariants = response.data.data.product.variants;
          console.log(
            `📸 Processing variant images for ${productVariants.length} variants`
          );

          let uploadPromises = [];

          // Match variants by their temporary IDs or color/size combination
          for (let i = 0; i < variants.length; i++) {
            const localVariant = variants[i];

            // In create mode: match by index
            // In edit mode: match by ID or create new mapping for newly generated variants
            let serverVariant;

            if (mode === "create") {
              serverVariant = productVariants[i]; // Match by index since they're created in same order
            } else {
              // Edit mode: find matching variant by ID or create new one
              const isNewVariant =
                localVariant.id && localVariant.id.includes("-"); // UUID format

              if (isNewVariant) {
                // This is a newly generated variant, find it in the updated product variants
                // Match by color/size combination
                serverVariant = productVariants.find(
                  (sv: any) =>
                    sv.colorId === localVariant.colorId &&
                    sv.sizeId === localVariant.sizeId
                );
              } else {
                // This is an existing variant, find by ID
                serverVariant = productVariants.find(
                  (sv: any) => sv.id === localVariant.id
                );
              }
            }

            if (localVariant && localVariant.images && serverVariant) {
              // Filter only new images that need to be uploaded
              const newImages = localVariant.images.filter(
                (img: any) => img.isNew && img.file
              );

              if (newImages.length > 0) {
                console.log(
                  `📸 Found ${newImages.length} new images for variant ${serverVariant.id} (${localVariant.color?.name || "N/A"} - ${localVariant.size?.name || "N/A"}) [Mode: ${mode}]`
                );

                // Upload each new image for this variant
                for (let j = 0; j < newImages.length; j++) {
                  const imageData = newImages[j];

                  // FIXED: Send undefined for non-explicitly-marked images to let backend decide
                  // Only send true/false when explicitly set, otherwise let backend handle it
                  const isPrimary =
                    imageData.isPrimary === true ? true : undefined;

                  console.log(`📸 Upload decision for image ${j + 1}:`, {
                    imageDataIsPrimary: imageData.isPrimary,
                    finalIsPrimary: isPrimary,
                    note: "undefined = let backend decide, true = force primary",
                  });

                  const uploadPromise = products
                    .uploadVariantImage(
                      serverVariant.id,
                      imageData.file,
                      isPrimary
                    )
                    .then(() => {
                      console.log(
                        `📸 Uploaded image ${j + 1}/${newImages.length} for variant ${serverVariant.id} (isPrimary: ${isPrimary})`
                      );
                    })
                    .catch((error) => {
                      console.error(
                        `❌ Failed to upload image ${j + 1} for variant ${serverVariant.id}:`,
                        error
                      );
                      throw error;
                    });

                  uploadPromises.push(uploadPromise);
                }
              }
            }
          }

          // Wait for all uploads to complete
          if (uploadPromises.length > 0) {
            try {
              await Promise.all(uploadPromises);
              toast.success(
                `Successfully uploaded ${uploadPromises.length} variant image(s)`
              );
            } catch (error) {
              console.error("Some variant image uploads failed:", error);
              toast.error("Failed to upload some variant images");
            }
          }
        }

        toast.success(
          mode === "create"
            ? "Product created successfully"
            : "Product updated successfully"
        );
        navigate("/products");
      } else {
        toast.error(response.data.message || "Failed to save product");
      }
    } catch (error: any) {
      console.error("Error saving product:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to save product";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Add this function to handle hasVariants toggle
  const handleVariantsToggle = (value: boolean) => {
    setHasVariants(value);

    // If toggling to simple product and we have variants, clear them
    if (!value && variants.length > 0) {
      if (
        window.confirm(
          "Switching to simple product will remove all your variant configurations. Continue?"
        )
      ) {
        setVariants([]);
        setSelectedColors([]);
        setSelectedSizes([]);
      } else {
        setHasVariants(true);
      }
    }
  };

  // Handle category selection from CategorySelector
  const handleSelectCategory = (categoryId: string) => {
    // Check if the category is already selected
    const isSelected = product.categoryIds.includes(categoryId);

    // Get parent-child relationships
    const parentChildMap = new Map();
    const childParentMap = new Map();

    categories.forEach((category) => {
      if (category.children && category.children.length > 0) {
        parentChildMap.set(
          category.id,
          category.children.map((child: any) => child.id)
        );
      }
      if (category.parentId) {
        childParentMap.set(category.id, category.parentId);
      }
    });

    // Helper functions
    const isParent = (id: string) => parentChildMap.has(id);
    const isChild = (id: string) => childParentMap.has(id);
    const getParentId = (id: string) => childParentMap.get(id);
    const getChildrenIds = (id: string) => parentChildMap.get(id) || [];

    let newSelectedCategoryIds: string[] = [...product.categoryIds];

    if (isSelected) {
      // If selected, remove it from the array
      newSelectedCategoryIds = newSelectedCategoryIds.filter(
        (id) => id !== categoryId
      );

      // If this is a parent, also remove all its children
      if (isParent(categoryId)) {
        const childrenIds = getChildrenIds(categoryId);
        newSelectedCategoryIds = newSelectedCategoryIds.filter(
          (id) => !childrenIds.includes(id)
        );
      }
    } else {
      // If not selected, add it to the array
      newSelectedCategoryIds.push(categoryId);

      // If this is a child, also select its parent if not already selected
      if (isChild(categoryId)) {
        const parentId = getParentId(categoryId);
        if (parentId && !newSelectedCategoryIds.includes(parentId)) {
          newSelectedCategoryIds.push(parentId);
        }
      }
    }

    // Update primary category if needed
    if (product.primaryCategoryId === categoryId && isSelected) {
      // If removing the primary category, set a new primary if possible
      if (newSelectedCategoryIds.length > 0) {
        setProduct((prev) => ({
          ...prev,
          primaryCategoryId: newSelectedCategoryIds[0],
        }));
      } else {
        // If no categories left, clear primary category
        setProduct((prev) => ({
          ...prev,
          primaryCategoryId: "", // Use empty string instead of null
        }));
      }
    } else if (
      !product.primaryCategoryId &&
      newSelectedCategoryIds.length > 0
    ) {
      // If this is the first category, set it as primary
      setProduct((prev) => ({
        ...prev,
        primaryCategoryId: newSelectedCategoryIds[0],
      }));
    }

    // Update the product with new category IDs
    setProduct((prev) => ({
      ...prev,
      categoryIds: newSelectedCategoryIds,
    }));
  };

  // Handle setting primary category
  const handleSetPrimaryCategory = (categoryId: string) => {
    // Update product with new primary category
    setProduct((prev) => ({
      ...prev,
      primaryCategoryId: categoryId,
    }));

    // Also update selectedCategories to reflect the primary category change
    setSelectedCategories((prev) =>
      prev.map((category) => ({
        ...category,
        isPrimary: category.id === categoryId,
      }))
    );
  };

  useEffect(() => {
    // Auto-generate SKU when not using variants
    if (
      !hasVariants &&
      product.name &&
      product.price &&
      categories.length > 0 &&
      product.categoryIds.length > 0
    ) {
      const categoryName =
        categories.find((c) => c.id === product.categoryIds[0])?.name || "";
      // Create SKU from first 3 chars of name + price + first 3 chars of category
      const namePart = product.name
        .replace(/\s+/g, "")
        .substring(0, 3)
        .toUpperCase();
      const pricePart = Math.floor(parseFloat(product.price)).toString();
      const categoryPart = categoryName
        .replace(/\s+/g, "")
        .substring(0, 3)
        .toUpperCase();

      const generatedSku = `${namePart}${pricePart}${categoryPart}`;

      setProduct((prev) => ({
        ...prev,
        sku: generatedSku,
      }));
    }
  }, [
    hasVariants,
    product.name,
    product.price,
    product.categoryIds,
    categories,
  ]);

  // ... inside ProductForm, after brands state:
  // const [brands, setBrands] = useState<{ label: string; value: string }[]>([]); // Removed unused brands state

  // useEffect(() => {
  //   async function fetchBrands() {
  //     try {
  //       const res = await import("@/api/adminService").then((m) =>
  //         m.brands.getBrands()
  //       );
  //       const brandOptions = (res.data.data.brands || []).map((b: any) => ({
  //         label: b.name,
  //         value: b.id,
  //       }));
  //       setBrands(brandOptions);
  //     } catch (e) {
  //       // ignore
  //     }
  //   }
  //   fetchBrands();
  // }, []);

  if (formLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center py-10">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-lg text-muted-foreground">
            {mode === "edit" ? "Loading product..." : "Preparing form..."}
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
            <Link to="/products">
              <ChevronLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">
            {mode === "create"
              ? "Add New Product"
              : `Edit Product: ${product.name}`}
          </h1>
        </div>
      </div>

      <Card className="overflow-hidden">
        <form onSubmit={handleSubmit} className="space-y-8 p-6">
          {/* Basic Information */}
          <div className="space-y-4 rounded-lg border p-4 bg-gray-50">
            <h2 className="text-xl font-semibold border-b pb-2">
              Basic Information
            </h2>

            <div className="space-y-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={product.name}
                  onChange={handleChange}
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="categories">Categories *</Label>
                <CategorySelector
                  selectedCategoryIds={product.categoryIds}
                  onSelectCategory={handleSelectCategory}
                  primaryCategoryId={product.primaryCategoryId}
                  onSetPrimaryCategory={handleSetPrimaryCategory}
                  categories={categories}
                  isLoading={categoriesLoading}
                />
              </div>

              {/* Primary Category Selection - only show if multiple categories selected */}
              {product.categoryIds.length > 1 && (
                <div className="space-y-2">
                  <Label>Primary Category *</Label>
                  <div className="space-y-2 rounded-md border p-3">
                    {selectedCategories.map((category) => (
                      <div
                        key={category.id}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="radio"
                          id={`primary-${category.id}`}
                          name="primaryCategory"
                          value={category.id}
                          checked={product.primaryCategoryId === category.id}
                          onChange={() => handleSetPrimaryCategory(category.id)}
                          className="h-4 w-4 rounded-full border-gray-300"
                        />
                        <label
                          htmlFor={`primary-${category.id}`}
                          className="text-sm"
                        >
                          {category.name}
                        </label>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    The primary category determines where the product appears in
                    main listings
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={product.description}
                  onChange={handleChange}
                  placeholder="Enter product description"
                  rows={4}
                />
              </div>

              {/* Brand selection */}
              <div className="space-y-2">
                <Label htmlFor="brandId">Brand (optional)</Label>
                <select
                  id="brandId"
                  name="brandId"
                  value={(product as any).brandId || ""}
                  onChange={(e) =>
                    setProduct((prev) => ({ ...prev, brandId: e.target.value }))
                  }
                  className="rounded-md border bg-background px-3 py-2 text-sm w-full"
                >
                  <option value="">Select a brand</option>
                  {brandsList.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Optional - associate this product with a brand
                </p>
              </div>

              <div className="flex items-center gap-2 p-1">
                <Label className="text-base">Has Variants</Label>
                <Checkbox
                  checked={hasVariants}
                  onCheckedChange={handleVariantsToggle}
                  className="h-6 w-6 border-gray-400 cursor-pointer"
                />
              </div>

              {/* Product Settings */}
              <div className="space-y-4 rounded-lg border p-4 bg-gray-50">
                <h3 className="text-lg font-semibold">Product Settings</h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* <div className="flex items-center gap-2">
                    <Checkbox
                      id="isSupplement"
                      name="isSupplement"
                      checked={product.isSupplement}
                      onCheckedChange={(checked) =>
                        setProduct((prev) => ({
                          ...prev,
                          isSupplement: !!checked,
                        }))
                      }
                    />
                    <Label htmlFor="isSupplement">Is Supplement</Label>
                  </div> */}

                  {/* <div className="flex items-center gap-2">
                    <Checkbox
                      id="featured"
                      name="featured"
                      checked={product.featured}
                      onCheckedChange={(checked) =>
                        setProduct((prev) => ({ ...prev, featured: !!checked }))
                      }
                    />
                    <Label htmlFor="featured">Featured Product</Label>
                  </div> */}

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="isActive"
                      name="isActive"
                      checked={product.isActive}
                      onCheckedChange={(checked) =>
                        setProduct((prev) => ({ ...prev, isActive: !!checked }))
                      }
                    />
                    <Label htmlFor="isActive">Active</Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="ourProduct"
                      name="ourProduct"
                      checked={product.ourProduct}
                      onCheckedChange={(checked) =>
                        setProduct((prev) => ({
                          ...prev,
                          ourProduct: !!checked,
                        }))
                      }
                    />
                    <Label htmlFor="ourProduct">
                      Our Product (Prioritized in listings)
                    </Label>
                  </div>
                </div>

                {/* Product Type Selection */}
                <div className="space-y-2">
                  <Label>Product Categories</Label>
                  <p className="text-xs text-muted-foreground">
                    Select which categories this product belongs to
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {[
                      { key: "featured", label: "Featured", icon: "⭐" },
                      { key: "bestseller", label: "Bestseller", icon: "📈" },
                      { key: "trending", label: "Trending", icon: "🔥" },
                      { key: "new", label: "New Arrivals", icon: "🆕" },
                    ].map((type) => (
                      <div key={type.key} className="flex items-center gap-2">
                        <Checkbox
                          id={`productType-${type.key}`}
                          checked={product.productType.includes(type.key)}
                          onCheckedChange={(checked) => {
                            setProduct((prev) => ({
                              ...prev,
                              productType: checked
                                ? [...prev.productType, type.key]
                                : prev.productType.filter(
                                    (t) => t !== type.key
                                  ),
                            }));
                          }}
                          className="h-6 w-6 border-gray-400 cursor-pointer"
                        />
                        <Label
                          htmlFor={`productType-${type.key}`}
                          className="flex items-center gap-1 cursor-pointer"
                        >
                          <span>{type.icon}</span>
                          {type.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {!hasVariants && (
                <>
                  {/* Simple product fields */}
                  <div className="grid gap-2">
                    <Label htmlFor="quantity">Stock Quantity *</Label>
                    <Input
                      id="quantity"
                      name="quantity"
                      type="number"
                      min="0"
                      value={product.quantity}
                      onChange={handleChange}
                      placeholder="0"
                      required
                    />
                  </div>
                </>
              )}

              {/* SKU Field - Auto-generated in both cases */}
              <div className="grid gap-2">
                <Label htmlFor="sku">
                  {!hasVariants
                    ? "SKU (Auto-generated)"
                    : "Base SKU (Auto-generated)"}
                </Label>
                <Input
                  id="sku"
                  name="sku"
                  value={product.sku}
                  onChange={handleChange}
                  placeholder="Auto-generated from name, price and category"
                  readOnly
                  className="bg-muted"
                />
              </div>

              {!hasVariants && (
                <div className="grid gap-2">
                  <Label htmlFor="price">Price *</Label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                      ₹
                    </span>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      min="0"
                      value={product.price}
                      onChange={handleChange}
                      placeholder="0.00"
                      className="pl-8"
                      required
                    />
                  </div>
                </div>
              )}
              {!hasVariants && (
                <div className="grid gap-2">
                  <Label htmlFor="salePrice">Sale Price (Optional)</Label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                      ₹
                    </span>
                    <Input
                      id="salePrice"
                      name="salePrice"
                      type="number"
                      min="0"
                      value={product.salePrice}
                      onChange={handleChange}
                      placeholder="0.00"
                      className="pl-8"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Product Images - Dropzone - Only show when variants are NOT enabled */}
          {!hasVariants && (
            <div className="space-y-4 rounded-lg border p-4 bg-gray-50">
              <h2 className="text-xl font-semibold border-b pb-2">
                Product Images
              </h2>
              <div className="space-y-2">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">Upload Images</p>
                  <p className="text-xs text-muted-foreground">
                    Drag and drop images here, or click to select files. The
                    first image will be the primary image.
                  </p>
                </div>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-md p-8 cursor-pointer transition-colors text-center bg-white ${
                    isDragActive
                      ? "border-blue-400 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                  }`}
                >
                  <input {...getInputProps()} />
                  <ImageIcon className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                  {isDragActive ? (
                    <p className="text-blue-600 font-medium">
                      Drop the images here...
                    </p>
                  ) : (
                    <>
                      <p className="text-muted-foreground">
                        Drop multiple images here, or click to select files
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Supports JPEG, PNG, WebP, GIF • Maximum size: 10MB per
                        image
                      </p>
                    </>
                  )}
                </div>

                {/* Fallback file input */}
                <div className="mt-2">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        const files = Array.from(e.target.files);
                        onDrop(files);
                        // Clear the input so the same file can be selected again
                        e.target.value = "";
                      }
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Alternative: Use this input if drag and drop doesn't work
                  </p>
                </div>

                {/* Manual File Input as Fallback */}
              </div>

              {/* Image previews */}
              {imagePreviews.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <Label>Product Images</Label>
                    <Badge variant="outline" className="text-xs">
                      {imagePreviews.length} image
                      {imagePreviews.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <div
                          className={`relative h-32 rounded-md overflow-hidden border-2 ${preview.isPrimary ? "border-primary" : "border-transparent"}`}
                        >
                          <img
                            src={preview.url}
                            alt={`Product preview ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                          {preview.isPrimary && (
                            <span className="absolute top-2 left-2 bg-primary text-white text-xs py-1 px-2 rounded-full">
                              Primary
                            </span>
                          )}
                        </div>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex space-x-1">
                          {!preview.isPrimary && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 bg-white hover:bg-primary hover:text-white"
                              onClick={() => setPrimaryImage(index)}
                            >
                              <Star className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 bg-white hover:bg-destructive hover:text-white"
                            onClick={() => removeImage(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SEO Section */}
          <div className="space-y-4 rounded-lg border p-4 bg-gray-50">
            <h2 className="text-xl font-semibold border-b pb-2">
              SEO Information
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="metaTitle">SEO Title</Label>
                <Input
                  id="metaTitle"
                  name="metaTitle"
                  value={product.metaTitle}
                  onChange={handleChange}
                  placeholder="SEO Title (recommended 50-60 characters)"
                />
                <p className="text-xs text-muted-foreground">
                  If left empty, the product name will be used
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="metaDescription">SEO Description</Label>
                <Textarea
                  id="metaDescription"
                  name="metaDescription"
                  value={product.metaDescription}
                  onChange={handleChange}
                  placeholder="Meta description (recommended 150-160 characters)"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  If left empty, the product description will be used
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="keywords">Keywords</Label>
                <Input
                  id="keywords"
                  name="keywords"
                  value={product.keywords}
                  onChange={handleChange}
                  placeholder="Comma-separated keywords"
                />
                <p className="text-xs text-muted-foreground">
                  Keywords for search engines (comma-separated)
                </p>
              </div>
            </div>
          </div>

          {/* Variants Configuration */}
          {hasVariants && (
            <div className="space-y-4 rounded-lg border p-4 bg-gray-50">
              <div className="flex items-center justify-between border-b pb-2">
                <h2 className="text-xl font-semibold">
                  Variants Configuration
                </h2>
                <Badge variant="secondary" className="text-xs">
                  Using variant-specific images
                </Badge>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-sm text-green-700">
                  <strong>✓ Variant Mode:</strong> Each variant can have its own
                  images. Upload images for each variant below in the table.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Available Colors</Label>
                    <div className="space-y-2 rounded-md border p-3 max-h-40 overflow-y-auto bg-white">
                      {colorsList.map((color) => (
                        <div
                          key={color.id}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="checkbox"
                            id={`color-${color.id}`}
                            checked={selectedColors.includes(color.id)}
                            onChange={() => handleColorToggle(color.id)}
                            className="h-6 w-6 rounded border-gray-400 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <Label
                            htmlFor={`color-${color.id}`}
                            className="text-sm font-normal cursor-pointer flex items-center gap-2"
                          >
                            {color.hexCode && (
                              <div
                                className="w-4 h-4 rounded border"
                                style={{ backgroundColor: color.hexCode }}
                              />
                            )}
                            {color.name}
                          </Label>
                        </div>
                      ))}
                      {colorsList.length === 0 && (
                        <p className="text-sm text-gray-500">
                          No colors available. Create colors first.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Available Sizes</Label>
                    <div className="space-y-2 rounded-md border p-3 max-h-40 overflow-y-auto bg-white">
                      {sizesList.map((size) => (
                        <div
                          key={size.id}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="checkbox"
                            id={`size-${size.id}`}
                            checked={selectedSizes.includes(size.id)}
                            onChange={() => handleSizeToggle(size.id)}
                            className="h-6 w-6 rounded border-gray-400 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <Label
                            htmlFor={`size-${size.id}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {size.name}
                          </Label>
                        </div>
                      ))}
                      {sizesList.length === 0 && (
                        <p className="text-sm text-gray-500">
                          No sizes available. Create sizes first.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={generateVariants}
                  disabled={
                    (selectedColors.length === 0 &&
                      selectedSizes.length === 0) ||
                    isLoading
                  }
                  className="w-full"
                >
                  Generate Variants
                </Button>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Variants</Label>
                    <Badge variant="outline" className="ml-2">
                      {variants.length} variants
                    </Badge>
                  </div>

                  {variants.length > 0 ? (
                    <div className="space-y-4">
                      {variants.map((variant, variantIndex) => (
                        <VariantCard
                          key={variant.id || `variant-${variantIndex}`}
                          variant={variant}
                          index={variantIndex}
                          onUpdate={updateVariantByIndex}
                          onRemove={removeVariantByIndex}
                          onImagesChange={handleVariantImagesChange}
                          isEditMode={mode === "edit"}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-4 border rounded-md bg-white">
                      <p className="text-sm text-gray-500">
                        No variants yet. Select colors and/or sizes and click
                        "Generate Variants" to create them.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Product Tags */}
          {/* <div className="space-y-4 rounded-lg border p-4 bg-gray-50">
            <h2 className="text-xl font-semibold border-b pb-2">
              Product Tags
            </h2>
            <div className="flex gap-4">
              {tagOptions.map((tag) => (
                <label key={tag.key} className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={product.tags.includes(tag.key)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setProduct((prev) => ({
                        ...prev,
                        tags: checked
                          ? [...prev.tags, tag.key]
                          : prev.tags.filter((t) => t !== tag.key),
                      }));
                    }}
                  />
                  {tag.label}
                </label>
              ))}
            </div>
            {product.tags.includes("top") && (
              <div className="mt-4">
                <Label>Select brands for Top tag</Label>
                <MultiSelect
                  options={brands}
                  value={product.topBrandIds}
                  onChange={(val: string[]) =>
                    setProduct((prev) => ({ ...prev, topBrandIds: val }))
                  }
                  placeholder="Select brands for Top"
                />
              </div>
            )}
            {product.tags.includes("new") && (
              <div className="mt-4">
                <Label>Select brands for New tag</Label>
                <MultiSelect
                  options={brands}
                  value={product.newBrandIds}
                  onChange={(val: string[]) =>
                    setProduct((prev) => ({ ...prev, newBrandIds: val }))
                  }
                  placeholder="Select brands for New"
                />
              </div>
            )}
            {product.tags.includes("hot") && (
              <div className="mt-4">
                <Label>Select brands for Hot tag</Label>
                <MultiSelect
                  options={brands}
                  value={product.hotBrandIds}
                  onChange={(val: string[]) =>
                    setProduct((prev) => ({ ...prev, hotBrandIds: val }))
                  }
                  placeholder="Select brands for Hot"
                />
              </div>
            )}
          </div> */}

          {/* Submit Buttons */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/products")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === "create" ? "Creating..." : "Updating..."}
                </>
              ) : mode === "create" ? (
                "Add Product"
              ) : (
                "Update Product"
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

// CategorySelector component
const CategorySelector = ({
  selectedCategoryIds,
  onSelectCategory,
  primaryCategoryId,
  onSetPrimaryCategory,
  categories,
  isLoading,
}: {
  selectedCategoryIds: string[];
  onSelectCategory: (categoryId: string) => void;
  primaryCategoryId: string | null;
  onSetPrimaryCategory: (categoryId: string) => void;
  categories: any[];
  isLoading: boolean;
}) => {
  if (isLoading) {
    return <div className="text-sm text-gray-500">Loading categories...</div>;
  }

  if (!categories || categories.length === 0) {
    return <div className="text-sm text-gray-500">No categories available</div>;
  }

  // Create a map of parent-child relationships for quick access
  const parentChildMap = new Map();
  categories.forEach((category) => {
    if (category.children && category.children.length > 0) {
      parentChildMap.set(
        category.id,
        category.children.map((child: any) => child.id)
      );
    }
  });

  // Create a map of child-parent relationships for quick access
  const childParentMap = new Map();
  categories.forEach((category) => {
    if (category.parentId) {
      childParentMap.set(category.id, category.parentId);
    }
  });

  // Ensure we have a primary category if we have selected categories
  const ensuredPrimaryId =
    primaryCategoryId ||
    (selectedCategoryIds.length > 0 ? selectedCategoryIds[0] : null);

  // Helper functions
  const isParent = (categoryId: string) => parentChildMap.has(categoryId);
  const isChild = (categoryId: string) => childParentMap.has(categoryId);
  const getParentId = (categoryId: string) => childParentMap.get(categoryId);
  const getChildrenIds = (categoryId: string) =>
    parentChildMap.get(categoryId) || [];

  // Handle selection with parent-child logic
  const handleCategorySelect = (categoryId: string) => {
    let newSelectionIds = [...selectedCategoryIds];
    const isCurrentlySelected = newSelectionIds.includes(categoryId);

    if (isCurrentlySelected) {
      // If deselecting, remove this category
      newSelectionIds = newSelectionIds.filter(
        (id: string) => id !== categoryId
      );

      // If this is a parent, also remove all its children
      if (isParent(categoryId)) {
        const childrenIds = getChildrenIds(categoryId);
        newSelectionIds = newSelectionIds.filter(
          (id: string) => !childrenIds.includes(id)
        );
      }
    } else {
      // If selecting, add this category
      newSelectionIds.push(categoryId);

      // If this is a child, also select its parent if not already selected
      if (isChild(categoryId)) {
        const parentId = getParentId(categoryId);
        if (parentId && !newSelectionIds.includes(parentId)) {
          newSelectionIds.push(parentId);
        }
      }
    }

    // Update primary category if needed
    let newPrimaryId = ensuredPrimaryId;
    if (isCurrentlySelected && categoryId === ensuredPrimaryId) {
      // If deselecting the primary category, choose a new one
      newPrimaryId = newSelectionIds.length > 0 ? newSelectionIds[0] : null;
      if (newPrimaryId) {
        onSetPrimaryCategory(newPrimaryId);
      }
    } else if (!ensuredPrimaryId && newSelectionIds.length > 0) {
      // If no primary category exists yet, set the first selected one
      newPrimaryId = newSelectionIds[0];
      onSetPrimaryCategory(newPrimaryId);
    }

    // Call parent's handler with new selection
    onSelectCategory(categoryId);
  };

  // Filter only parent categories (those without parentId)
  const parentCategories = categories.filter((category) => !category.parentId);

  // Render a category and its children recursively
  const renderCategory = (category: any) => {
    const categoryId = category._id || category.id;
    const isSelected = selectedCategoryIds.includes(categoryId);
    const isPrimary = ensuredPrimaryId === categoryId;

    // Find children of this category
    const childCategories = categories.filter((c) => c.parentId === categoryId);

    return (
      <div key={categoryId} className="category-group">
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center">
            <input
              type="checkbox"
              id={`cat-${categoryId}`}
              checked={isSelected}
              onChange={() => handleCategorySelect(categoryId)}
              className="mr-2 h-6 w-6 rounded border-gray-400 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <label
              htmlFor={`cat-${categoryId}`}
              className="text-sm font-medium cursor-pointer"
            >
              {category.name}
            </label>
          </div>

          {isSelected && selectedCategoryIds.length > 1 && (
            <button
              type="button"
              onClick={() => {
                onSetPrimaryCategory(categoryId);
              }}
              className={`text-xs px-2 py-1 rounded-full ${
                isPrimary
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {isPrimary ? "Primary" : "Set as Primary"}
            </button>
          )}
        </div>

        {/* Render children with indentation */}
        {childCategories.length > 0 && (
          <div className="pl-6 border-l-2 border-gray-100 ml-1.5 mt-1">
            {childCategories.map((child) => {
              const childId = child._id || child.id;
              const isChildSelected = selectedCategoryIds.includes(childId);
              const isChildPrimary = ensuredPrimaryId === childId;

              return (
                <div
                  key={childId}
                  className="flex items-center justify-between py-1"
                >
                  <div className="flex items-center">
                    <span className="mr-2 text-xs text-muted-foreground">
                      ↳
                    </span>
                    <input
                      type="checkbox"
                      id={`cat-${childId}`}
                      checked={isChildSelected}
                      onChange={() => handleCategorySelect(childId)}
                      className="mr-2 h-6 w-6 rounded border-gray-400 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <label
                      htmlFor={`cat-${childId}`}
                      className="text-sm cursor-pointer"
                    >
                      {child.name}
                    </label>
                  </div>

                  {isChildSelected && selectedCategoryIds.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        onSetPrimaryCategory(childId);
                      }}
                      className={`text-xs px-2 py-1 rounded-full ${
                        isChildPrimary
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {isChildPrimary ? "Primary" : "Set as Primary"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-2 border rounded-md p-3 max-h-60 overflow-y-auto bg-white">
      <div className="font-medium text-sm mb-1">
        Select categories (multiple allowed):
      </div>
      <div className="space-y-2">
        {parentCategories.map((category) => renderCategory(category))}
      </div>
    </div>
  );
};

export default function ProductsPage() {
  const { id } = useParams();
  const location = useLocation();
  const isNewProduct = location.pathname.includes("/new");
  const isEditProduct = !!id;

  // Show appropriate content based on route
  if (isNewProduct) {
    return <ProductForm mode="create" />;
  }

  if (isEditProduct) {
    return <ProductForm mode="edit" productId={id} />;
  }

  return <ProductsList />;
}

// Product List Component
function ProductsList() {
  const [productsList, setProductsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categoriesList, setCategoriesList] = useState<any[]>([]);

  // States for delete dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isForceDeleteDialogOpen, setIsForceDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [deletingProduct, setDeletingProduct] = useState(false);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const params = {
          page: currentPage,
          limit: 10,
          ...(debouncedSearchQuery && { search: debouncedSearchQuery }),
          ...(selectedCategory && { category: selectedCategory }),
        };

        const response = await products.getProducts(params);

        if (response.data.success) {
          const products = response.data.data?.products || [];

          setProductsList(products);
          setTotalPages(response.data.data?.pagination?.pages || 1);
        } else {
          setError(response.data.message || "Failed to fetch products");
        }
      } catch (error: any) {
        console.error("Error fetching products:", error);
        setError("Failed to load products. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [currentPage, debouncedSearchQuery, selectedCategory]);

  // Fetch categories for filter
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categories.getCategories();

        if (response.data.success) {
          setCategoriesList(response.data.data?.categories || []);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  // Get base price and sale price for a product
  const getProductPrices = (product: any) => {
    if (!product.variants || product.variants.length === 0) {
      return { basePrice: "0", regularPrice: "0", hasSale: false };
    }

    // For products with variants, show the lowest price
    if (product.hasVariants && product.variants.length > 1) {
      // Find the lowest regular price and its corresponding sale price
      const lowestPriceVariant = product.variants.reduce(
        (lowest: any, current: any) => {
          const currentPrice = Number(current.price);
          const lowestPrice = Number(lowest.price);
          return currentPrice < lowestPrice ? current : lowest;
        },
        product.variants[0]
      );

      return {
        basePrice: lowestPriceVariant.salePrice || lowestPriceVariant.price,
        regularPrice: lowestPriceVariant.salePrice
          ? lowestPriceVariant.price
          : null,
        hasSale: !!lowestPriceVariant.salePrice,
      };
    }

    // For simple products
    const variant = product.variants[0];
    return {
      basePrice: variant.salePrice || variant.price,
      regularPrice: variant.salePrice ? variant.price : null,
      hasSale: !!variant.salePrice,
    };
  };

  // Organize categories into a hierarchical structure
  const organizeCategories = () => {
    // Create parent categories
    const parentCategories = categoriesList
      .filter((category) => !category.parentId)
      .map((parent) => ({
        ...parent,
        children: categoriesList.filter(
          (child) => child.parentId === parent.id
        ),
      }));

    return parentCategories;
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  // Handle product deletion
  const handleDeleteProduct = async (
    productId: string,
    force: boolean = false
  ) => {
    setDeletingProduct(true);

    try {
      const response = await products.deleteProduct(productId, force);

      if (response.data.success) {
        // Check if the message indicates the product has orders and cannot be deleted
        if (
          !force &&
          response.data.message?.includes("has associated orders") &&
          response.data.message?.includes("cannot be deleted")
        ) {
          // Show force delete dialog
          setProductToDelete(productId);
          setIsForceDeleteDialogOpen(true);
        }
        // If message indicates product is just marked inactive
        else if (
          response.data.message?.includes("cannot be deleted") &&
          response.data.message?.includes("marked as inactive")
        ) {
          toast.success("Product marked as inactive");

          // Update product status in the list
          setProductsList((prevProducts) =>
            prevProducts.map((product) =>
              product.id === productId
                ? { ...product, isActive: false }
                : product
            )
          );

          // Close dialogs if open
          setIsDeleteDialogOpen(false);
          setIsForceDeleteDialogOpen(false);
        } else {
          toast.success("Product deleted successfully");
          // Remove from product list
          setProductsList((prevProducts) =>
            prevProducts.filter((product) => product.id !== productId)
          );

          // Close dialogs if open
          setIsDeleteDialogOpen(false);
          setIsForceDeleteDialogOpen(false);
        }
      } else {
        toast.error(response.data.message || "Failed to delete product");
      }
    } catch (error: any) {
      console.error("Error deleting product:", error);
      toast.error(
        error.message || "An error occurred while deleting the product"
      );
    } finally {
      setDeletingProduct(false);
    }
  };

  // Handle marking product as inactive instead of deleting
  const handleMarkAsInactive = async (productId: string) => {
    try {
      const formData = new FormData();
      formData.append("isActive", "false");

      const response = await products.updateProduct(productId, formData as any);

      if (response.data.success) {
        toast.success("Product marked as inactive successfully");

        // Update product status in the list
        setProductsList((prevProducts) =>
          prevProducts.map((product) =>
            product.id === productId ? { ...product, isActive: false } : product
          )
        );

        // Close force delete dialog
        setIsForceDeleteDialogOpen(false);
      } else {
        toast.error(
          response.data.message || "Failed to mark product as inactive"
        );
      }
    } catch (error: any) {
      console.error("Error marking product as inactive:", error);
      toast.error(
        error.message ||
          "An error occurred while marking the product as inactive"
      );
    }
  };

  // Function to open delete dialog
  const openDeleteDialog = (productId: string) => {
    setProductToDelete(productId);
    setIsDeleteDialogOpen(true);
  };

  // Handle product status toggle (active/inactive)
  const handleToggleProductStatus = async (
    productId: string,
    currentStatus: boolean
  ) => {
    try {
      const formData = new FormData();
      formData.append("isActive", (!currentStatus).toString());

      const response = await products.updateProduct(productId, formData as any);

      if (response.data.success) {
        toast.success(
          `Product ${currentStatus ? "deactivated" : "activated"} successfully`
        );

        // Update product status in the list
        setProductsList((prevProducts) =>
          prevProducts.map((product) =>
            product.id === productId
              ? { ...product, isActive: !currentStatus }
              : product
          )
        );
      } else {
        toast.error(
          response.data.message ||
            `Failed to ${currentStatus ? "deactivate" : "activate"} product`
        );
      }
    } catch (error: any) {
      console.error(
        `Error ${currentStatus ? "deactivating" : "activating"} product:`,
        error
      );
      toast.error(
        error.message ||
          `An error occurred while ${currentStatus ? "deactivating" : "activating"} the product`
      );
    }
  };

  // Render option for a category with proper indentation
  const renderCategoryOption = (category: any, level = 0) => {
    return (
      <Fragment key={category.id}>
        <option value={category.id}>
          {level > 0 ? "↳ ".repeat(level) : ""}
          {category.name}
        </option>
        {category.children &&
          category.children.map((child: any) =>
            renderCategoryOption(child, level + 1)
          )}
      </Fragment>
    );
  };

  // Loading state
  if (isLoading && productsList.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center py-10">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-lg text-muted-foreground">
            Loading products...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && productsList.length === 0) {
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

  // Organize categories hierarchically
  const hierarchicalCategories = organizeCategories();

  return (
    <div className="space-y-6">
      {/* Delete Confirmation Dialog */}
      <DeleteProductDialog
        open={isDeleteDialogOpen}
        setOpen={setIsDeleteDialogOpen}
        title="Delete Product"
        description="Are you sure you want to delete this product? This action cannot be undone."
        onConfirm={() => {
          if (productToDelete) {
            handleDeleteProduct(productToDelete, false);
          }
        }}
        loading={deletingProduct}
        confirmText="Delete"
      />

      {/* Force Delete Confirmation Dialog */}
      <DeleteProductDialog
        open={isForceDeleteDialogOpen}
        setOpen={setIsForceDeleteDialogOpen}
        title="Product Has Order History"
        description="This product has order history and cannot be permanently deleted.\n\nYou can either mark it as inactive (recommended) or force delete it (this will affect order history and is not recommended)."
        onConfirm={() => {
          if (productToDelete) {
            handleDeleteProduct(productToDelete, true);
          }
        }}
        loading={deletingProduct}
        confirmText="Force Delete"
        isDestructive={true}
        secondaryAction={{
          text: "Mark as Inactive",
          onClick: () => {
            if (productToDelete) {
              handleMarkAsInactive(productToDelete);
            }
          },
        }}
      />

      {/* Header and Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Button asChild>
          <Link to="/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="rounded-lg border p-4 bg-card">
        <div className="flex flex-col gap-4 md:flex-row">
          <form onSubmit={handleSearch} className="flex flex-1 gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button type="submit">Search</Button>
          </form>

          <div className="flex gap-2">
            <select
              className="rounded-md border bg-background px-3 py-2 text-sm"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Categories</option>
              {hierarchicalCategories.map((category) =>
                renderCategoryOption(category)
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Products List */}
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
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Price
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {productsList.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      No products found
                    </td>
                  </tr>
                ) : (
                  productsList.map((product) => {
                    const { basePrice, regularPrice, hasSale } =
                      getProductPrices(product);
                    // Get image with fallback logic
                    let productImage = null;

                    // Priority 1: Product images
                    if (product.images && product.images.length > 0) {
                      productImage =
                        product.images.find((img: any) => img.isPrimary) ||
                        product.images[0];
                    }
                    // Priority 2: Any variant images
                    else if (product.variants && product.variants.length > 0) {
                      const variantWithImages = product.variants.find(
                        (variant: any) =>
                          variant.images && variant.images.length > 0
                      );
                      if (variantWithImages) {
                        productImage =
                          variantWithImages.images.find(
                            (img: any) => img.isPrimary
                          ) || variantWithImages.images[0];
                      }
                    }

                    return (
                      <tr
                        key={product.id}
                        className="border-b hover:bg-muted/20"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {productImage ? (
                              <img
                                src={productImage.url}
                                alt={product.name}
                                className="h-10 w-10 rounded-md object-cover"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                                <Package className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{product.name}</p>
                                {product.ourProduct && (
                                  <Badge
                                    variant="default"
                                    className="text-xs bg-blue-600"
                                  >
                                    Our Product
                                  </Badge>
                                )}
                              </div>
                              {product.hasVariants && (
                                <p className="text-xs text-muted-foreground">
                                  {product.variants.length} variants
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {product.categories &&
                            product.categories.length > 0 ? (
                              product.categories.map((category: any) => {
                                // Check if this is a child category
                                const isChild = category.parentId !== null;
                                const parentName =
                                  isChild &&
                                  categoriesList.find(
                                    (c) => c.id === category.parentId
                                  )?.name;

                                return (
                                  <Badge
                                    key={category.id}
                                    variant={
                                      category.isPrimary ? "default" : "outline"
                                    }
                                    className="text-xs"
                                  >
                                    {isChild && (
                                      <span className="text-muted-foreground mr-1 text-[10px]">
                                        {parentName} &gt;
                                      </span>
                                    )}
                                    {category.name}
                                    {category.isPrimary && " (Primary)"}
                                  </Badge>
                                );
                              })
                            ) : (
                              <span className="text-muted-foreground">
                                Uncategorized
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {hasSale ? (
                            <div>
                              <span className="font-medium">₹{basePrice}</span>
                              <span className="ml-1 text-xs line-through text-muted-foreground">
                                ₹{regularPrice}
                              </span>
                            </div>
                          ) : (
                            <span className="font-medium">₹{basePrice}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              product.isActive
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500"
                            }`}
                          >
                            {product.isActive ? "Active" : "Inactive"}
                          </span>
                          <button
                            onClick={() =>
                              handleToggleProductStatus(
                                product.id,
                                product.isActive
                              )
                            }
                            className="ml-2 text-xs text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            {product.isActive ? "Deactivate" : "Activate"}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" asChild>
                              <Link to={`/products/${product.id}`}>
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteDialog(product.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
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

// // Add state for tags
// const tagOptions = [
//   { key: "top", label: "Top" },
//   { key: "hot", label: "Hot" },
//   { key: "new", label: "New" },
// ];
