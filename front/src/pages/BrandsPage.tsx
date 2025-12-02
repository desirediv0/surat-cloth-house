import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { brands } from "@/api/adminService";
import { useDropzone } from "react-dropzone";
import { Edit, Trash2, Eye } from "lucide-react";
import { getImageUrl } from "@/utils/image";
import { products } from "@/api/adminService";
import { Loader2, Search } from "lucide-react";
import { MultiSelect } from "@/components/ui/multiselect";
const TAG_OPTIONS = [
  { label: "Top", value: "TOP" },
  { label: "New", value: "NEW" },
  { label: "Hot", value: "HOT" },
];

interface Brand {
  id: string;
  name: string;
  slug: string;
  image: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  products: any[];
}

export default function BrandsPage() {
  const [brandsList, setBrandsList] = useState<Brand[]>([]);
  const [open, setOpen] = useState(false);
  const [editBrand, setEditBrand] = useState<Brand | null>(null);
  const [form, setForm] = useState({ name: "", image: null as File | null });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [assignModalBrand, setAssignModalBrand] = useState<Brand | null>(null);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [brandTags, setBrandTags] = useState<string[]>([]);

  // Fetch brands with tag filter
  const fetchBrands = async () => {
    try {
      const params = activeTab !== "ALL" ? { tag: activeTab } : {};
      const res = await brands.getBrands(params);
      setBrandsList(res.data.data.brands || []);
    } catch (err) {
      toast.error("Failed to fetch brands");
    }
  };

  useEffect(() => {
    fetchBrands();
  }, [activeTab]);

  // Dropzone for image upload
  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setForm((prev) => ({ ...prev, image: acceptedFiles[0] }));
      setImagePreview(URL.createObjectURL(acceptedFiles[0]));
    }
  };
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateOrUpdateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.image) {
      toast.error("Name and image are required");
      return;
    }
    if (brandTags.length === 0) {
      toast.error("At least one tag is required");
      return;
    }
    setCreating(true);
    try {
      if (editBrand) {
        await brands.updateBrand(editBrand.id, {
          name: form.name,
          image: form.image,
          tags: brandTags,
        });
        toast.success("Brand updated");
      } else {
        await brands.createBrand({
          name: form.name,
          image: form.image,
          tags: brandTags,
        });
        toast.success("Brand created");
      }
      setForm({ name: "", image: null });
      setImagePreview(null);
      setOpen(false);
      setEditBrand(null);
      fetchBrands();
    } catch (err) {
      toast.error("Failed to save brand");
    }
    setCreating(false);
  };

  const handleEdit = (brand: Brand) => {
    setEditBrand(brand);
    setBrandTags(brand.tags || []);
    setForm({ name: brand.name, image: null });
    setImagePreview(getImageUrl(brand.image));
    setOpen(true);
  };

  const handleDelete = async (brandId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this brand? Products will remain, but will be unassigned from this brand."
      )
    )
      return;
    try {
      await brands.deleteBrand(brandId);
      toast.success("Brand deleted. Products are now unassigned.");
      fetchBrands();
    } catch (err) {
      toast.error("Failed to delete brand");
    }
  };

  const handleShowProducts = (brand: Brand) => {
    setAssignModalBrand(brand);
  };

  const handleDialogClose = () => {
    setOpen(false);
    setEditBrand(null);
    setForm({ name: "", image: null });
    setImagePreview(null);
    setBrandTags([]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Brands</CardTitle>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) handleDialogClose();
          }}
        >
          <DialogTrigger asChild>
            <Button
              variant="default"
              onClick={() => {
                setEditBrand(null);
                setForm({ name: "", image: null });
                setImagePreview(null);
                setBrandTags([]);
              }}
            >
              Add Brand
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editBrand ? "Edit Brand" : "Add New Brand"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateOrUpdateBrand} className="space-y-4">
              <Input
                name="name"
                placeholder="Brand Name"
                value={form.name}
                onChange={handleInputChange}
                required
              />
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded p-4 text-center cursor-pointer ${isDragActive ? "bg-muted" : ""}`}
              >
                <input {...getInputProps()} />
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="mx-auto h-24 w-24 object-contain mb-2"
                  />
                ) : (
                  <span>Drag & drop image here, or click to select</span>
                )}
              </div>
              <MultiSelect
                options={TAG_OPTIONS}
                value={brandTags}
                onChange={(val) => {
                  setBrandTags(val);
                }}
                placeholder="Select tags (Top, New, Hot, etc.)"
              />
              <Button type="submit" disabled={creating}>
                {creating
                  ? editBrand
                    ? "Updating..."
                    : "Creating..."
                  : editBrand
                    ? "Update"
                    : "Create"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          {["ALL", ...TAG_OPTIONS.map((t) => t.value)].map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? "default" : "outline"}
              onClick={() => setActiveTab(tab)} // Only setActiveTab, no fetchBrands
            >
              {tab === "ALL"
                ? "All Brands"
                : TAG_OPTIONS.find((t) => t.value === tab)?.label || tab}
            </Button>
          ))}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {brandsList.map((brand) => (
              <TableRow key={brand.id}>
                <TableCell>
                  <img
                    src={getImageUrl(brand.image)}
                    alt={brand.name}
                    className="h-12 w-12 object-contain rounded"
                  />
                </TableCell>
                <TableCell>{brand.name}</TableCell>
                <TableCell>{brand.slug}</TableCell>
                <TableCell>
                  <div style={{ maxHeight: 80, overflowY: "auto" }}>
                    <ul>
                      {brand.products.slice(0, 3).map((p) => (
                        <li key={p.id}>{p.name}</li>
                      ))}
                      {brand.products.length > 3 && (
                        <li>+{brand.products.length - 3} more</li>
                      )}
                    </ul>
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShowProducts(brand)}
                  >
                    {brand.products.length}{" "}
                    <Eye className="inline ml-1 h-4 w-4" />
                  </Button>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(brand)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(brand.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {/* Products Modal */}
        {assignModalBrand && (
          <ProductsAssignModal
            brand={assignModalBrand}
            open={!!assignModalBrand}
            onClose={() => setAssignModalBrand(null)}
            onUpdated={fetchBrands}
          />
        )}
      </CardContent>
    </Card>
  );
}

function getProductImage(product: any) {
  // 1. Product images
  if (product.images && product.images.length > 0) {
    const primary =
      product.images.find((img: any) => img.isPrimary) || product.images[0];
    return getImageUrl(primary.url);
  }
  // 2. Variant images
  if (product.variants && product.variants.length > 0) {
    for (const variant of product.variants) {
      if (variant.images && variant.images.length > 0) {
        const primary =
          variant.images.find((img: any) => img.isPrimary) || variant.images[0];
        return getImageUrl(primary.url);
      }
    }
  }
  // 3. Placeholder
  return getImageUrl(null);
}

function ProductsAssignModal({
  brand,
  open,
  onClose,
  onUpdated,
}: {
  brand: Brand;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [assigning, setAssigning] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await products.getProducts({ page, limit: 10, search });
      setAllProducts(res.data.data.products || []);
      setTotalPages(res.data.data.pagination?.pages || 1);
      // Preselect products already assigned to this brand
      const assigned = new Set(
        (res.data.data.products || [])
          .filter((p: any) => p.brandId === brand.id)
          .map((p: any) => p.id)
      );
      setSelected(assigned as Set<string>);
    } catch (err) {
      toast.error("Failed to fetch products");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open) fetchProducts();
    // eslint-disable-next-line
  }, [open, page, search]);

  // In ProductsAssignModal, after fetching products, if only one product is assigned, auto-select it
  useEffect(() => {
    if (open && allProducts.length === 1) {
      setSelected(new Set([allProducts[0].id]));
    }
    // eslint-disable-next-line
  }, [open, allProducts.length]);

  const handleSelect = (productId: string) => {
    setSelected((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) newSet.delete(productId);
      else newSet.add(productId);
      return newSet as Set<string>;
    });
  };

  const handleAssign = async () => {
    setAssigning(true);
    try {
      const promises = Array.from(selected).map(async (id) => {
        const res = await products.getProductById(id);
        const product = res.data.data.product;
        await products.updateProduct(id, {
          ...product,
          brandId: brand.id,
        });
      });
      await Promise.all(promises);
      toast.success("Products assigned to brand");
      // Immediately fetch updated brands list
      await onUpdated();
      // Optionally, fetch this brand's products again if needed
      setSelected(new Set());
      onClose();
    } catch (err) {
      toast.error("Failed to assign products");
    }
    setAssigning(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assign Products to {brand.name}</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-2 mb-4">
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full"
          />
          <Button variant="outline" onClick={fetchProducts}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin h-8 w-8" />
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto border rounded">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="p-2 text-left">
                    <input
                      type="checkbox"
                      style={{ width: 20, height: 20 }} // Make checkbox bigger
                      checked={
                        allProducts.length > 0 &&
                        allProducts.every((p) => selected.has(p.id))
                      }
                      onChange={() => {
                        if (
                          allProducts.length > 0 &&
                          allProducts.every((p) => selected.has(p.id))
                        ) {
                          setSelected(new Set());
                        } else {
                          setSelected(new Set(allProducts.map((p) => p.id)));
                        }
                      }}
                    />
                    <span style={{ marginLeft: 8 }}>Select All</span>
                  </th>
                  <th className="p-2 text-left">Image</th>
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-left">Brand</th>
                  <th className="p-2 text-left"></th>
                </tr>
              </thead>
              <tbody>
                {allProducts.map((product) => (
                  <tr key={product.id} className="border-b">
                    <td className="p-2">
                      <input
                        type="checkbox"
                        style={{ width: 20, height: 20 }} // Make checkbox bigger
                        checked={selected.has(product.id)}
                        onChange={() => handleSelect(product.id)}
                      />
                    </td>
                    <td className="p-2">
                      <img
                        src={getProductImage(product)}
                        alt={product.name}
                        className="h-10 w-10 object-contain rounded"
                      />
                    </td>
                    <td className="p-2">{product.name}</td>
                    <td className="p-2">
                      {product.brandId === brand.id
                        ? brand.name
                        : product.brand?.name || "-"}
                    </td>
                    <td className="p-2">
                      {product.brandId === brand.id && (
                        <button
                          title="Remove from Brand"
                          onClick={async () => {
                            await brands.removeProductFromBrand(
                              brand.id,
                              product.id
                            );
                            toast.success("Product removed from brand");
                            await onUpdated();
                            setSelected((prev) => {
                              const newSet = new Set(prev);
                              newSet.delete(product.id);
                              return newSet;
                            });
                          }}
                          className="text-destructive hover:bg-destructive/10 rounded p-1 ml-2"
                          style={{
                            border: "none",
                            background: "none",
                            cursor: "pointer",
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex gap-2 mt-4 justify-end">
          <Button
            onClick={async () => {
              await handleAssign();
              onClose(); // Close modal after assign
            }}
            disabled={assigning || selected.size === 0}
          >
            {assigning ? "Assigning..." : "Assign to Brand"}
          </Button>
        </div>
        <div className="flex justify-between items-center mt-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </Button>
          <span>
            Page {page} of {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
