import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import { coupons, partners, categories, brands, products } from "@/api/adminService";
import axios from "axios";
import { Button } from "@/components/ui/button";
import MultiSelectCombo from "@/components/MultiSelectCombo";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Ticket,
  Plus,
  ArrowLeft,
  Loader2,
  Trash2,
  Edit,
  AlertTriangle,
  PercentIcon,
  Calendar,
  CheckCircle,
  XCircle,
  IndianRupee,
  UserPlus,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface CouponItem {
  id: string;
  code?: string;
  description?: string;
  discountType?: string;
  discountValue?: number;
  minOrderAmount?: number;
  maxUses?: number;
  couponPartners?: Array<{ partner: { id: string; name?: string }; commission?: number | null }>;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
  categories?: Array<{ id: string; name?: string; category?: { id: string; name?: string } }>;
  products?: Array<{ id: string; name?: string; product?: { id: string; name?: string } }>;
  brands?: Array<{ id: string; name?: string; brand?: { id: string; name?: string } }>;
  couponCategories?: Array<{ categoryId: string; category?: { id: string; name?: string } }>;
  couponProducts?: Array<{ productId: string; product?: { id: string; name?: string } }>;
  couponBrands?: Array<{ brandId: string; brand?: { id: string; name?: string } }>;
}

export default function CouponsPage() {
  const { id } = useParams();
  const location = useLocation();
  const isNewCoupon = location.pathname.includes("/new");
  const isEditCoupon = !!id;

  // Use lazy loading for the components to reduce initial load time
  return (
    <>
      {isNewCoupon && <CouponForm mode="create" />}
      {isEditCoupon && <CouponForm mode="edit" couponId={id} />}
      {!isNewCoupon && !isEditCoupon && <CouponsList />}
    </>
  );
}

function CouponsList() {
  const [couponsList, setCouponsList] = useState<CouponItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch coupons
  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await coupons.getCoupons();

        if (response.data.success) {
          const fetchedCoupons = response.data.data?.coupons || [];

          setCouponsList(fetchedCoupons as CouponItem[]);
        } else {
          const errorMsg = response.data.message || "Failed to fetch coupons";
          console.error("Coupons fetch error:", errorMsg);
          setError(errorMsg);
          toast.error(errorMsg);
        }
      } catch (error: unknown) {
        console.error("Error fetching coupons:", error);
        let errorMsg = "Failed to load coupons. Please try again.";
        if (error instanceof Error) errorMsg = error.message;
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCoupons();
  }, []);

  // Handle coupon deletion
  const handleDeleteCoupon = async (couponId: string, couponCode: string) => {
    if (
      !window.confirm(`Are you sure you want to delete coupon "${couponCode}"?`)
    ) {
      return;
    }

    try {
      const response = await coupons.deleteCoupon(couponId);
      if (response.data.success) {
        toast.success("Coupon deleted successfully");
        // Update the coupons list
        setCouponsList(couponsList.filter((coupon) => coupon.id !== couponId));
      } else {
        toast.error(response.data.message || "Failed to delete coupon");
      }
    } catch (error: unknown) {
      console.error("Error deleting coupon:", error);
      toast.error("An error occurred while deleting the coupon");
    }
  };

  // Handle coupon active/inactive toggle
  const handleToggleStatus = async (couponId: string, currentStatus: boolean, couponCode: string) => {
    const newStatus = !currentStatus;
    const action = newStatus ? "activate" : "deactivate";

    try {
      const response = await coupons.updateCoupon(couponId, {
        isActive: newStatus
      });

      if (response.data.success) {
        toast.success(`Coupon "${couponCode}" ${action}d successfully`);

        // Update the coupon in the list
        setCouponsList(couponsList.map(coupon =>
          coupon.id === couponId
            ? { ...coupon, isActive: newStatus }
            : coupon
        ));
      } else {
        toast.error(response.data.message || `Failed to ${action} coupon`);
      }
    } catch (error: unknown) {
      console.error(`Error ${action}ing coupon:`, error);
      toast.error(`An error occurred while ${action}ing the coupon`);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center py-10">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-lg text-muted-foreground">
            Loading coupons...
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
      {/* Header and Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Coupons</h1>
        <Button asChild>
          <Link to="/coupons/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Coupon
          </Link>
        </Button>
      </div>

      {/* Coupons List */}
      {couponsList.length === 0 ? (
        <Card className="p-6 flex items-center justify-center flex-col text-center">
          <Ticket className="h-12 w-12 mb-4 text-primary/40" />
          <h3 className="text-lg font-medium">No Coupons Found</h3>
          <p className="text-muted-foreground mt-2">
            Create your first discount coupon to offer to customers
          </p>
          <Button className="mt-4" asChild>
            <Link to="/coupons/new">Add Your First Coupon</Link>
          </Button>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Code
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Discount
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Targets
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Partner
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Valid Period
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
                {couponsList.map((coupon) => (
                  <tr key={coupon.id} className="border-b">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium">{coupon.code}</span>
                        {coupon.description && (
                          <span className="text-xs text-muted-foreground">
                            {coupon.description}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {coupon.discountType === "PERCENTAGE" ? (
                          <>
                            <PercentIcon className="h-4 w-4 text-muted-foreground" />
                            <span>{coupon.discountValue}% off</span>
                          </>
                        ) : (
                          <>
                            <IndianRupee className="h-4 w-4 text-muted-foreground" />
                            <span>₹{coupon.discountValue} off</span>
                          </>
                        )}
                      </div>
                      {coupon.minOrderAmount && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Min. order: ₹{coupon.minOrderAmount}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {(() => {
                        const dedupe = (values: Array<string>) => Array.from(new Set(values));

                        const categoryNames = dedupe([
                          ...((coupon.categories ?? [])
                            .map((entry) => entry.category?.name ?? entry.name ?? "")
                            .filter((name): name is string => Boolean(name))),
                          ...((coupon.couponCategories ?? [])
                            .map((entry) => entry.category?.name ?? "")
                            .filter((name): name is string => Boolean(name))),
                        ]);

                        const productNames = dedupe([
                          ...((coupon.products ?? [])
                            .map((entry) => entry.product?.name ?? entry.name ?? "")
                            .filter((name): name is string => Boolean(name))),
                          ...((coupon.couponProducts ?? [])
                            .map((entry) => entry.product?.name ?? "")
                            .filter((name): name is string => Boolean(name))),
                        ]);

                        const brandNames = dedupe([
                          ...((coupon.brands ?? [])
                            .map((entry) => entry.brand?.name ?? entry.name ?? "")
                            .filter((name): name is string => Boolean(name))),
                          ...((coupon.couponBrands ?? [])
                            .map((entry) => entry.brand?.name ?? "")
                            .filter((name): name is string => Boolean(name))),
                        ]);

                        if (!categoryNames.length && !productNames.length && !brandNames.length) {
                          return <span className="text-xs uppercase tracking-wide text-green-600">All items</span>;
                        }

                        const parts: string[] = [];
                        if (categoryNames.length) {
                          const preview = categoryNames.slice(0, 2).join(", ");
                          parts.push(`Categories: ${preview}${categoryNames.length > 2 ? " +" + (categoryNames.length - 2) : ""}`);
                        }
                        if (productNames.length) {
                          const preview = productNames.slice(0, 2).join(", ");
                          parts.push(`Products: ${preview}${productNames.length > 2 ? " +" + (productNames.length - 2) : ""}`);
                        }
                        if (brandNames.length) {
                          const preview = brandNames.slice(0, 2).join(", ");
                          parts.push(`Brands: ${preview}${brandNames.length > 2 ? " +" + (brandNames.length - 2) : ""}`);
                        }

                        return parts.map((text, index) => (
                          <div key={index} className="text-xs leading-relaxed text-foreground/80">
                            {text}
                          </div>
                        ));
                      })()}
                    </td>
                    <td className="px-4 py-3">
                      {coupon.couponPartners && coupon.couponPartners.length > 0 ? (
                        <div className="space-y-1">
                          {coupon.couponPartners.slice(0, 2).map((cp, index: number) => (
                            <div key={index} className="flex flex-col">
                              <span className="text-sm font-medium">
                                {cp.partner.name}
                              </span>
                              {cp.commission != null && (
                                <span className="text-xs text-muted-foreground">
                                  {cp.commission}% commission
                                </span>
                              )}
                            </div>
                          ))}
                          {coupon.couponPartners.length > 2 && (
                            <span className="text-xs text-muted-foreground">
                              +{coupon.couponPartners.length - 2} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          General Coupon
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {formatDate(coupon.startDate || "")}
                          {coupon.endDate && ` - ${formatDate(coupon.endDate || "")}`}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {/* Toggle Switch */}
                        <button
                          onClick={() => handleToggleStatus(coupon.id, !!coupon.isActive, coupon.code || "")}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${coupon.isActive
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-gray-300 hover:bg-gray-400'
                            }`}
                          title={coupon.isActive ? 'Click to deactivate' : 'Click to activate'}
                        >
                          <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-white transition duration-200 ${coupon.isActive ? 'translate-x-5' : 'translate-x-1'
                              }`}
                          />
                        </button>

                        {/* Status Text */}
                        {coupon.isActive ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm font-medium">Active</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-gray-500">
                            <XCircle className="h-4 w-4" />
                            <span className="text-sm font-medium">Inactive</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/coupons/${coupon.id}`}>
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() =>
                            handleDeleteCoupon(coupon.id, coupon.code || "")
                          }
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

function CouponForm({
  mode,
  couponId,
}: {
  mode: "create" | "edit";
  couponId?: string;
}) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(mode === "edit");
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountType: "PERCENTAGE",
    discountValue: "",
    minOrderAmount: "",
    maxUses: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    isActive: true,
  });
  const [selectedPartners, setSelectedPartners] = useState<
    Array<{ partnerId: string; commission: string }>
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [partnersList, setPartnersList] = useState<Array<{ id: string; name: string; email?: string }>>([]);
  const [categoriesList, setCategoriesList] = useState<Array<{ id: string; name: string }>>([]);
  const [brandsList, setBrandsList] = useState<Array<{ id: string; name: string }>>([]);
  const [productsList, setProductsList] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);

  const mergeOptions = (
    existing: Array<{ id: string; name: string }>,
    extras: Array<{ id: string; name: string }>
  ) => {
    const map = new Map(existing.map((item) => [item.id, item]));
    extras.forEach((option) => {
      if (!map.has(option.id) || !map.get(option.id)?.name) {
        map.set(option.id, option);
      }
    });
    return Array.from(map.values());
  };

  // Fetch partners list for dropdown
  useEffect(() => {
    const fetchCatsAndBrands = async () => {
      try {
        const [catsRes, brandsRes, productsRes] = await Promise.all([
          categories.getCategories(),
          brands.getBrands(),
          products.getProducts({ limit: 100 }),
        ]);

        const dedupeById = (items: Array<{ id: string; name: string }>) => {
          const map = new Map<string, { id: string; name: string }>();
          items.forEach((item) => {
            if (!map.has(item.id)) {
              map.set(item.id, item);
            }
          });
          return Array.from(map.values());
        };

        const isObject = (value: unknown): value is Record<string, unknown> =>
          typeof value === "object" && value !== null;

        const rawCategories = catsRes.data.data?.categories || catsRes.data.data || [];
        const normalizedCategories = dedupeById(
          (Array.isArray(rawCategories) ? rawCategories : [])
            .map((entry) => {
              if (!isObject(entry)) return null;
              const categoryValue = isObject(entry.category) ? entry.category : undefined;
              const idCandidate = entry.id ?? entry.categoryId ?? categoryValue?.id ?? entry._id;
              if (idCandidate === undefined || idCandidate === null) return null;
              const nameCandidate = entry.name ?? categoryValue?.name ?? entry.label ?? entry.title;
              const id = String(idCandidate);
              const name = typeof nameCandidate === "string" && nameCandidate.trim()
                ? nameCandidate
                : `Category ${id}`;
              return { id, name };
            })
            .filter((item): item is { id: string; name: string } => Boolean(item))
        );

        const rawBrands = brandsRes.data.data?.brands || brandsRes.data.data || [];
        const normalizedBrands = dedupeById(
          (Array.isArray(rawBrands) ? rawBrands : [])
            .map((entry) => {
              if (!isObject(entry)) return null;
              const brandValue = isObject(entry.brand) ? entry.brand : undefined;
              const idCandidate = entry.id ?? entry.brandId ?? brandValue?.id ?? entry._id;
              if (idCandidate === undefined || idCandidate === null) return null;
              const nameCandidate = entry.name ?? brandValue?.name ?? entry.label ?? entry.title;
              const id = String(idCandidate);
              const name = typeof nameCandidate === "string" && nameCandidate.trim()
                ? nameCandidate
                : `Brand ${id}`;
              return { id, name };
            })
            .filter((item): item is { id: string; name: string } => Boolean(item))
        );

        const rawProducts = productsRes.data.data?.products || productsRes.data.data || [];
        const normalizedProducts = dedupeById(
          (Array.isArray(rawProducts) ? rawProducts : [])
            .map((entry) => {
              if (!isObject(entry)) return null;
              const productValue = isObject(entry.product) ? entry.product : undefined;
              const idCandidate = entry.id ?? entry.productId ?? productValue?.id ?? entry._id;
              if (idCandidate === undefined || idCandidate === null) return null;
              const nameCandidate = entry.name ?? productValue?.name ?? entry.label ?? entry.title;
              const id = String(idCandidate);
              const name = typeof nameCandidate === "string" && nameCandidate.trim()
                ? nameCandidate
                : `Product ${id}`;
              return { id, name };
            })
            .filter((item): item is { id: string; name: string } => Boolean(item))
        );

        setCategoriesList(normalizedCategories);
        setBrandsList(normalizedBrands);
        setProductsList(normalizedProducts);
      } catch (err) {
        console.warn('Failed to load categories/brands/products for coupon form', err);
      }
    };

    const fetchPartners = async () => {
      try {
        const response = await partners.getApprovedPartners();
        if (response.data.success) {
          // Handle both array and object with 'partners' key
          let fetchedPartners = [];
          if (Array.isArray(response.data.data)) {
            fetchedPartners = response.data.data;
          } else if (response.data.data?.partners) {
            fetchedPartners = response.data.data.partners;
          } else {
            fetchedPartners = [];
          }
          setPartnersList(fetchedPartners);
        } else {
          console.error("Partners fetch error:", response.data.message);
          toast.error("Failed to load partners");
        }
      } catch (error) {
        console.error("Error fetching partners:", error);
        toast.error("Failed to load partners");
      }
    };
    fetchPartners();
    fetchCatsAndBrands();
  }, []);

  // Fetch coupon details if in edit mode
  useEffect(() => {
    if (mode === "edit" && couponId) {
      const fetchCouponDetails = async () => {
        try {
          setIsFetching(true);
          const response = await coupons.getCouponById(couponId);
          console.log("Coupon details response:", response); // Debug logging

          if (response.data.success) {
            const couponData = response.data.data?.coupon as CouponItem | undefined;
            // Format dates properly for edit form
            const formatDateForInput = (dateString?: string) => {
              try {
                if (!dateString) return "";
                const date = new Date(dateString);
                return date.toISOString().split("T")[0];
              } catch (error) {
                console.warn("Date format error:", error);
                return "";
              }
            };

            setFormData({
              code: couponData?.code?.toUpperCase() || "",
              description: couponData?.description || "",
              discountType: couponData?.discountType || "PERCENTAGE",
              discountValue: couponData?.discountValue?.toString?.() || "",
              minOrderAmount: couponData?.minOrderAmount?.toString?.() || "",
              maxUses: couponData?.maxUses?.toString?.() || "",
              startDate: formatDateForInput(couponData?.startDate) || new Date().toISOString().split("T")[0],
              endDate: formatDateForInput(couponData?.endDate),
              isActive: couponData?.isActive ?? true,
            });

            // Set selected partners (handle both array and object with 'partners' key)
            let couponPartnersArr: Array<{ partner: { id: string }; commission?: number | null }> = [];
            if (Array.isArray(couponData?.couponPartners)) {
              couponPartnersArr = couponData.couponPartners;
            } else if ((couponData as unknown as { couponPartners?: { partners?: Array<{ partner: { id: string }; commission?: number | null }> } })?.couponPartners?.partners) {
              couponPartnersArr = (couponData as unknown as { couponPartners: { partners: Array<{ partner: { id: string }; commission?: number | null }> } }).couponPartners.partners;
            }
            if (couponPartnersArr.length > 0) {
              setSelectedPartners(
                couponPartnersArr.map((cp: { partner: { id: string }; commission?: number | null }) => ({
                  partnerId: cp.partner.id,
                  commission: cp.commission != null ? cp.commission.toString() : "",
                }))
              );
            } else {
              setSelectedPartners([]);
            }

            // populate target selects if present
            const toRecord = (value: unknown): Record<string, unknown> | null =>
              typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;

            const coerceId = (value: unknown): string | undefined => {
              if (typeof value === "string" || typeof value === "number") return String(value);
              return undefined;
            };

            const collectTargetIds = (
              primary: unknown[] | undefined,
              fallback: unknown[] | undefined,
              directKey: "categoryId" | "productId" | "brandId",
              nestedKey: "category" | "product" | "brand"
            ) => {
              const ids: string[] = [];
              const appendFrom = (source?: unknown[]) => {
                (source ?? []).forEach((entry) => {
                  const record = toRecord(entry);
                  if (!record) return;
                  const nested = toRecord(record[nestedKey]);
                  const idCandidate =
                    coerceId(record[directKey]) ??
                    coerceId(nested?.id) ??
                    coerceId(record.id) ??
                    coerceId(record._id);
                  if (idCandidate) ids.push(idCandidate);
                });
              };

              appendFrom(primary);
              appendFrom(fallback);
              return Array.from(new Set(ids));
            };

            const collectTargetOptions = (
              primary: unknown[] | undefined,
              fallback: unknown[] | undefined,
              directKey: "categoryId" | "productId" | "brandId",
              nestedKey: "category" | "product" | "brand",
              fallbackLabel: string
            ) => {
              const options = new Map<string, { id: string; name: string }>();
              const appendFrom = (source?: unknown[]) => {
                (source ?? []).forEach((entry) => {
                  const record = toRecord(entry);
                  if (!record) return;
                  const nested = toRecord(record[nestedKey]);
                  const idCandidate =
                    coerceId(record[directKey]) ??
                    coerceId(nested?.id) ??
                    coerceId(record.id) ??
                    coerceId(record._id);
                  if (!idCandidate) return;
                  const nameCandidate =
                    typeof nested?.name === "string" && nested.name.trim()
                      ? nested.name
                      : typeof record.name === "string" && record.name.trim()
                        ? record.name
                        : typeof record.label === "string" && record.label.trim()
                          ? record.label
                          : typeof record.title === "string" && record.title.trim()
                            ? record.title
                            : `${fallbackLabel} ${idCandidate}`;
                  if (!options.has(idCandidate)) {
                    options.set(idCandidate, { id: idCandidate, name: nameCandidate });
                  }
                });
              };

              appendFrom(primary);
              appendFrom(fallback);
              return Array.from(options.values());
            };

            setSelectedCategoryIds(
              collectTargetIds(couponData?.categories, couponData?.couponCategories, "categoryId", "category")
            );
            setSelectedProductIds(
              collectTargetIds(couponData?.products, couponData?.couponProducts, "productId", "product")
            );
            setSelectedBrandIds(
              collectTargetIds(couponData?.brands, couponData?.couponBrands, "brandId", "brand")
            );

            const prefilledCategories = collectTargetOptions(
              couponData?.categories,
              couponData?.couponCategories,
              "categoryId",
              "category",
              "Category"
            );
            const prefilledProducts = collectTargetOptions(
              couponData?.products,
              couponData?.couponProducts,
              "productId",
              "product",
              "Product"
            );
            const prefilledBrands = collectTargetOptions(
              couponData?.brands,
              couponData?.couponBrands,
              "brandId",
              "brand",
              "Brand"
            );

            if (prefilledCategories.length) {
              setCategoriesList((prev) => mergeOptions(prev, prefilledCategories));
            }
            if (prefilledProducts.length) {
              setProductsList((prev) => mergeOptions(prev, prefilledProducts));
            }
            if (prefilledBrands.length) {
              setBrandsList((prev) => mergeOptions(prev, prefilledBrands));
            }
          } else {
            setError(response.data.message || "Failed to fetch coupon details");
          }
        } catch (error: unknown) {
          console.error("Error fetching coupon:", error);
          setError("An error occurred while fetching the coupon");
        } finally {
          setIsFetching(false);
        }
      };

      fetchCouponDetails();
    }
  }, [mode, couponId]);

  // Handle partner add/remove
  const addPartner = () => {
    setSelectedPartners([...selectedPartners, { partnerId: "", commission: "" }]);
  };

  const removePartner = (index: number) => {
    setSelectedPartners(selectedPartners.filter((_, i) => i !== index));
  };

  const updatePartner = (index: number, field: "partnerId" | "commission", value: string) => {
    const updated = [...selectedPartners];
    updated[index][field] = value;

    // If updating partnerId, check for duplicates
    if (field === "partnerId" && value) {
      const duplicateExists = updated.some((partner, i) =>
        i !== index && partner.partnerId === value
      );

      if (duplicateExists) {
        const partnerName = partnersList.find(p => p.id === value)?.name || value;
        setError(`Partner "${partnerName}" is already assigned to this coupon. Each partner can only be assigned once per coupon.`);
        return; // Don't update if duplicate
      }
    }

    setSelectedPartners(updated);

    // Clear error if no duplicates
    if (error && error.includes("already assigned")) {
      setError(null);
    }
  };

  // Handle form input changes
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;

    // Special handling for coupon code - convert to uppercase immediately
    if (name === "code") {
      setFormData((prev) => ({
        ...prev,
        [name]: value.toUpperCase(),
      }));
    } else {
      // Normal handling for other fields
      setFormData((prev) => ({
        ...prev,
        [name]:
          type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
      }));
    }

    // Clear error when user changes input
    if (error) {
      setError(null);
    }
  };

  // Validate form before submission
  const validateForm = () => {
    // Check if code is empty
    if (!formData.code.trim()) {
      setError("Coupon code is required");
      return false;
    }

    // Check if code contains only valid characters
    if (!/^[A-Z0-9_-]+$/i.test(formData.code)) {
      setError(
        "Coupon code can only contain letters, numbers, underscores, and hyphens"
      );
      return false;
    }

    // Make sure discount value is a valid number and greater than 0
    const discountValue = parseFloat(formData.discountValue);
    if (isNaN(discountValue) || discountValue <= 0) {
      setError("Discount value must be a positive number");
      return false;
    }

    // Validate discount value based on discount type
    if (formData.discountType === "PERCENTAGE" && discountValue > 100) {
      setError("Percentage discount cannot be greater than 100%");
      return false;
    }

    // If minimum order amount is provided, make sure it's a valid number
    if (
      formData.minOrderAmount &&
      (isNaN(parseFloat(formData.minOrderAmount)) ||
        parseFloat(formData.minOrderAmount) < 0)
    ) {
      setError("Minimum order amount must be a positive number");
      return false;
    }

    // If max uses is provided, make sure it's a valid positive integer
    if (
      formData.maxUses &&
      (isNaN(parseInt(formData.maxUses)) || parseInt(formData.maxUses) < 1)
    ) {
      setError("Maximum uses must be a positive integer");
      return false;
    }

    // Make sure end date is after start date if provided
    if (
      formData.endDate &&
      new Date(formData.endDate) <= new Date(formData.startDate)
    ) {
      setError("End date must be after start date");
      return false;
    }

    // Validate partners
    if (selectedPartners.length > 0) {
      // Check for empty partner IDs
      const emptyPartners = selectedPartners.filter(p => !p.partnerId);
      if (emptyPartners.length > 0) {
        setError("Please select a partner or remove empty partner entries");
        return false;
      }

      // Check for duplicate partners
      const partnerIds = selectedPartners.map(p => p.partnerId);
      const uniquePartnerIds = [...new Set(partnerIds)];
      if (partnerIds.length !== uniquePartnerIds.length) {
        setError("Each partner can only be assigned once per coupon. Please remove duplicate partners.");
        return false;
      }

      // Validate commission values
      for (const partner of selectedPartners) {
        if (partner.commission && partner.commission.trim()) {
          const commission = parseFloat(partner.commission);
          if (isNaN(commission) || commission < 0 || commission > 100) {
            const partnerName = partnersList.find(p => p.id === partner.partnerId)?.name || "Partner";
            setError(`${partnerName}'s commission must be between 0 and 100`);
            return false;
          }
        }
      }
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const uniq = (values: string[]) => Array.from(new Set(values.filter(Boolean)));
      const categoryIds = uniq(selectedCategoryIds);
      const productIds = uniq(selectedProductIds);
      const brandIds = uniq(selectedBrandIds);

      const data = {
        ...formData,
        // Make sure code is uppercase when submitting to backend
        code: formData.code.toUpperCase(),
        discountType: formData.discountType as "PERCENTAGE" | "FIXED_AMOUNT",
        discountValue: parseFloat(formData.discountValue),
        minOrderAmount: formData.minOrderAmount
          ? parseFloat(formData.minOrderAmount)
          : undefined,
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : undefined,
        partners: selectedPartners.length > 0
          ? selectedPartners.map(p => ({
            partnerId: p.partnerId,
            commission: p.commission ? parseFloat(p.commission) : undefined,
          }))
          : undefined,
        categoryIds,
        productIds,
        brandIds,
      };

      let response;
      if (mode === "create") {
        response = await coupons.createCoupon(data);
      } else {
        response = await coupons.updateCoupon(couponId!, data);
      }

      if (response.data.success) {
        toast.success(
          mode === "create"
            ? "Coupon created successfully"
            : "Coupon updated successfully"
        );
        navigate("/coupons");
      } else {
        // Display the exact error message from the API
        const errorMsg = response.data.message || `Failed to ${mode} coupon`;
        setError(errorMsg);

        // Use toast.error with longer duration for visibility
        toast.error(errorMsg, {
          duration: 5000,
          position: "top-center",
        });
      }
    } catch (error: unknown) {
      console.error(`Error ${mode}ing coupon:`, error);

      // Prefer server-sent error message when available (Axios errors)
      let errorMessage = `An error occurred while ${mode === "create" ? "creating" : "updating"} the coupon`;

      if (axios.isAxiosError(error)) {
        const respData: unknown = error.response ? error.response.data : null;
        let serverMsg: string | null = null;

        if (respData && typeof respData === "object") {
          const d = respData as { [k: string]: unknown };
          if (typeof d.message === "string") serverMsg = d.message;
          else if (typeof d.error === "string") serverMsg = d.error;
        }

        if (serverMsg) {
          errorMessage = serverMsg;
        } else if (error.message) {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setError(errorMessage);

      // Show detailed toast with longer duration
      toast.error(errorMessage, {
        duration: 5000,
        position: "top-center",
      });
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
            Loading coupon...
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
            <Link to="/coupons">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Coupons
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">
            {mode === "create" ? "Create Coupon" : "Edit Coupon"}
          </h1>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 mb-4 rounded-md flex items-center gap-2 border border-destructive/20">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium">{error}</p>
            {error.includes("code already exists") && (
              <p className="text-xs mt-1">
                Please choose a different coupon code or edit the existing one.
              </p>
            )}
          </div>
        </div>
      )}

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <label htmlFor="code" className="text-sm font-medium">
                Coupon Code *
              </label>
              <Input
                id="code"
                name="code"
                placeholder="e.g., SUMMER2023, WELCOME10"
                value={formData.code}
                onChange={handleInputChange}
                required
                className={
                  error &&
                    (error.includes("code already exists") ||
                      error.includes("Coupon code"))
                    ? "border-destructive ring-1 ring-destructive"
                    : ""
                }
              />
              {error &&
                (error.includes("code already exists") ||
                  error.includes("Coupon code")) && (
                  <p className="text-xs text-destructive mt-1">
                    {error.includes("code already exists")
                      ? "This coupon code is already in use. Please choose a different code."
                      : error}
                  </p>
                )}
            </div>

            <div className="grid gap-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Input
                id="description"
                name="description"
                placeholder="Short description of the coupon"
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="discountType" className="text-sm font-medium">
                Discount Type *
              </label>
              <select
                id="discountType"
                name="discountType"
                value={formData.discountType}
                onChange={handleInputChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="PERCENTAGE">Percentage Discount (%)</option>
                <option value="FIXED_AMOUNT">Fixed Amount Discount (₹)</option>
              </select>
            </div>

            <div className="grid gap-2">
              <label htmlFor="discountValue" className="text-sm font-medium">
                Discount Value *
              </label>
              <div className="flex">
                <div className="flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3">
                  {formData.discountType === "PERCENTAGE" ? (
                    <PercentIcon className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <IndianRupee className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <Input
                  id="discountValue"
                  name="discountValue"
                  type="number"
                  min="0"
                  step={formData.discountType === "PERCENTAGE" ? "1" : "0.01"}
                  placeholder={
                    formData.discountType === "PERCENTAGE" ? "10" : "100"
                  }
                  value={formData.discountValue}
                  onChange={handleInputChange}
                  className={
                    error && error.includes("Discount value")
                      ? "border-destructive ring-1 ring-destructive rounded-l-none"
                      : "rounded-l-none"
                  }
                  required
                />
              </div>
              {error && error.includes("Discount value") && (
                <p className="text-xs text-destructive mt-1">{error}</p>
              )}
            </div>

            <div className="grid gap-2">
              <label htmlFor="minOrderAmount" className="text-sm font-medium">
                Minimum Order Amount
              </label>
              <div className="flex">
                <div className="flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3">
                  <IndianRupee className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input
                  id="minOrderAmount"
                  name="minOrderAmount"
                  type="number"
                  min="0"

                  placeholder="500"
                  value={formData.minOrderAmount}
                  onChange={handleInputChange}
                  className="rounded-l-none"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label htmlFor="maxUses" className="text-sm font-medium">
                Maximum Uses
              </label>
              <Input
                id="maxUses"
                name="maxUses"
                type="number"
                min="0"
                step="1"
                placeholder="Leave empty for unlimited"
                value={formData.maxUses}
                onChange={handleInputChange}
              />
            </div>

            {/* Targets: categories / products / brands */}
            <div className="grid gap-2 md:col-span-2">
              <MultiSelectCombo
                items={categoriesList}
                selectedIds={selectedCategoryIds}
                onChange={setSelectedCategoryIds}
                label="Target Categories (optional)"
                placeholder="Select categories"
                maxHeight={240}
              />
              <p className="text-xs text-muted-foreground">Leave empty to allow coupon on all categories.</p>
            </div>

            <div className="grid gap-2 md:col-span-2">
              <MultiSelectCombo
                items={productsList}
                selectedIds={selectedProductIds}
                onChange={setSelectedProductIds}
                label="Target Products (optional)"
                placeholder="Select products"
                maxHeight={240}
              />
              <p className="text-xs text-muted-foreground">Leave empty to allow coupon on all products.</p>
            </div>

            <div className="grid gap-2 md:col-span-2">
              <MultiSelectCombo
                items={brandsList}
                selectedIds={selectedBrandIds}
                onChange={setSelectedBrandIds}
                label="Target Brands (optional)"
                placeholder="Select brands"
                maxHeight={240}
              />
              <p className="text-xs text-muted-foreground">Leave empty to allow coupon on all brands.</p>
            </div>

            <div className="grid gap-2">
              <label htmlFor="startDate" className="text-sm font-medium">
                Start Date *
              </label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="endDate" className="text-sm font-medium">
                End Date
              </label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                value={formData.endDate}
                onChange={handleInputChange}
                min={formData.startDate}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="isActive"
                name="isActive"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
                checked={formData.isActive as boolean}
                onChange={handleInputChange}
              />
              <label htmlFor="isActive" className="text-sm font-medium">
                Active
              </label>
            </div>

            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  Partner Assignments (Optional)
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPartner}
                  className="flex items-center gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Add Partner
                </Button>
              </div>

              {selectedPartners.length === 0 ? (
                <div className="text-center p-4 border-2 border-dashed border-gray-200 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    No partners assigned. This coupon will be a general coupon available to all.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedPartners.map((partner, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex-1">
                        <select
                          value={partner.partnerId}
                          onChange={(e) => updatePartner(index, "partnerId", e.target.value)}
                          className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ${error && error.includes("already assigned") &&
                            selectedPartners.some((p, i) => i !== index && p.partnerId === partner.partnerId)
                            ? "border-destructive ring-1 ring-destructive"
                            : ""
                            }`}
                        >
                          <option value="">Select Partner...</option>
                          {partnersList.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.email})
                            </option>
                          ))}
                        </select>
                        {/* Show validation error for specific partner */}
                        {error && error.includes("already assigned") &&
                          selectedPartners.some((p, i) => i !== index && p.partnerId === partner.partnerId) && (
                            <p className="text-xs text-destructive mt-1">
                              This partner is already assigned to this coupon
                            </p>
                          )}
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex">
                          <div className="flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3">
                            <PercentIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            placeholder="5.0"
                            value={partner.commission}
                            onChange={(e) => updatePartner(index, "commission", e.target.value)}
                            className="w-20 rounded-l-none"
                          />
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePartner(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Assign this coupon to specific partners for commission tracking. Partners will earn the specified commission percentage from orders using this coupon.
              </p>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5" />
                  </div>
                  <div className="ml-2">
                    <h4 className="text-sm font-medium text-blue-800">Commission Calculation Note</h4>
                    <div className="text-xs text-blue-700 mt-1 space-y-1">
                      <p><strong>Example:</strong> Order value ₹100, Coupon discount ₹10, Partner commission 5%</p>
                      <p>• Commission is calculated on: <strong>₹90</strong> (Order value after discount)</p>
                      <p>• Partner earns: <strong>₹4.50</strong> (5% of ₹90)</p>
                      <p className="text-blue-600 font-medium">Commission is always calculated on the final order amount after applying the coupon discount.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/coupons")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "create" ? "Create Coupon" : "Update Coupon"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
