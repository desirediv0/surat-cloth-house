import PartnerPage from "./pages/partner";
import PartnerDetailsPage from "./pages/PartnerDetailsPage";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "sonner";
import DashboardLayout from "./layouts/DashboardLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ProductsPage from "./pages/ProductsPage";
import OrdersPage from "./pages/OrdersPage";
import OrderDetailsPage from "./pages/OrderDetailsPage";
import CategoriesPage from "./pages/CategoriesPage";
import ColorsPage from "./pages/ColorsPage";
import SizesPage from "./pages/SizesPage";
import CouponsPage from "./pages/CouponsPage";
import AdminsPage from "./pages/AdminsPage";
import AdminCreatePage from "./pages/AdminCreatePage";
import AdminPermissionsPage from "./pages/AdminPermissionsPage";
import ContactManagementPage from "./pages/ContactManagementPage";
import ReviewsManagementPage from "./pages/ReviewsManagementPage";
import FAQManagementPage from "./pages/FAQManagementPage";
import FAQCreatePage from "./pages/FAQCreatePage";
import NotFoundPage from "./pages/NotFoundPage";
import { ErrorBoundary } from "./components/ErrorBoundary";
import ProductDetailPage from "./pages/ProductDetailPage";
import ProductCreatePage from "./pages/ProductCreatePage";
import { useAuth } from "./context/AuthContext";
import { Resource, Action } from "./types/admin";
import { PermissionGuard } from "./components/PermissionGuard";
import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "./components/ui/card";
import UserManagementPage from "./pages/UserManagementPage";
import AnalyticsDashboard from "@/pages/AnalyticsDashboard";
import BrandsPage from "./pages/BrandsPage";
import ProductSectionsPage from "./pages/ProductSections";
import BannersPage from "./pages/BannersPage";

// Protected Route Component
const ProtectedRoute = ({
  children,
  resource,
  action = Action.READ,
  superAdminOnly = false,
}: {
  children: React.ReactNode;
  resource?: Resource;
  action?: Action;
  superAdminOnly?: boolean;
}) => {
  const { admin, isAuthenticated } = useAuth();

  // Not authenticated at all
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Super admin only route
  if (superAdminOnly && admin?.role !== "SUPER_ADMIN") {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-10 w-10 text-red-600" />
            <div>
              <h3 className="text-lg font-medium text-red-800">
                Access Denied
              </h3>
              <p className="text-red-700">
                This page is only accessible to Super Administrators.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Permission-based route
  if (resource && action) {
    const hasPermission =
      admin?.role === "SUPER_ADMIN" ||
      admin?.permissions?.includes(`${resource}:${action}`);

    if (!hasPermission) {
      return (
        <PermissionGuard resource={resource} action={action}>
          {children}
        </PermissionGuard>
      );
    }
  }

  return <>{children}</>;
};

const App = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={<LoginPage />}
          errorElement={<ErrorBoundary />}
        />

        {/* Authenticated routes with DashboardLayout */}
        <Route
          path="/"
          element={<DashboardLayout />}
          errorElement={<ErrorBoundary />}
        >
          <Route index element={<Navigate to="/dashboard" replace />} />

          <Route
            path="dashboard"
            element={
              <ProtectedRoute
                resource={Resource.DASHBOARD}
                action={Action.READ}
              >
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="dashboard/analytics"
            element={
              <ProtectedRoute
                resource={Resource.ANALYTICS}
                action={Action.READ}
              >
                <AnalyticsDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="products"
            element={
              <ProtectedRoute resource={Resource.PRODUCTS} action={Action.READ}>
                <ProductsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="products/new"
            element={
              <ProtectedRoute
                resource={Resource.PRODUCTS}
                action={Action.CREATE}
              >
                <ProductCreatePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="products/edit/:id"
            element={
              <ProtectedRoute
                resource={Resource.PRODUCTS}
                action={Action.UPDATE}
              >
                <ProductsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="products/:id"
            element={
              <ProtectedRoute resource={Resource.PRODUCTS} action={Action.READ}>
                <ProductDetailPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="orders"
            element={
              <ProtectedRoute resource={Resource.ORDERS} action={Action.READ}>
                <OrdersPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="orders/:id"
            element={
              <ProtectedRoute resource={Resource.ORDERS} action={Action.READ}>
                <OrderDetailsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="categories"
            element={
              <ProtectedRoute
                resource={Resource.CATEGORIES}
                action={Action.READ}
              >
                <CategoriesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="categories/new"
            element={
              <ProtectedRoute
                resource={Resource.CATEGORIES}
                action={Action.CREATE}
              >
                <CategoriesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="categories/:id"
            element={
              <ProtectedRoute
                resource={Resource.CATEGORIES}
                action={Action.UPDATE}
              >
                <CategoriesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="colors"
            element={
              <ProtectedRoute resource={Resource.PRODUCTS} action={Action.READ}>
                <ColorsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="colors/new"
            element={
              <ProtectedRoute
                resource={Resource.PRODUCTS}
                action={Action.CREATE}
              >
                <ColorsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="colors/:id"
            element={
              <ProtectedRoute
                resource={Resource.PRODUCTS}
                action={Action.UPDATE}
              >
                <ColorsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="sizes"
            element={
              <ProtectedRoute resource={Resource.PRODUCTS} action={Action.READ}>
                <SizesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="sizes/new"
            element={
              <ProtectedRoute
                resource={Resource.PRODUCTS}
                action={Action.CREATE}
              >
                <SizesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="sizes/:id"
            element={
              <ProtectedRoute
                resource={Resource.PRODUCTS}
                action={Action.UPDATE}
              >
                <SizesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="coupons"
            element={
              <ProtectedRoute resource={Resource.COUPONS} action={Action.READ}>
                <CouponsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="coupons/new"
            element={
              <ProtectedRoute
                resource={Resource.COUPONS}
                action={Action.CREATE}
              >
                <CouponsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="coupons/:id"
            element={
              <ProtectedRoute
                resource={Resource.COUPONS}
                action={Action.UPDATE}
              >
                <CouponsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="admins"
            element={
              <ProtectedRoute superAdminOnly={true}>
                <AdminsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="admins/new"
            element={
              <ProtectedRoute superAdminOnly={true}>
                <AdminCreatePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="admins/permissions/:adminId"
            element={
              <ProtectedRoute superAdminOnly={true}>
                <AdminPermissionsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="users"
            element={
              <ProtectedRoute resource={Resource.USERS} action={Action.READ}>
                <UserManagementPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="contact-management"
            element={
              <ProtectedRoute resource={Resource.CONTACT} action={Action.READ}>
                <ContactManagementPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="reviews-management"
            element={
              <ProtectedRoute resource={Resource.REVIEWS} action={Action.READ}>
                <ReviewsManagementPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="product-sections"
            element={
              <ProtectedRoute
                resource={Resource.PRODUCTS}
                action={Action.UPDATE}
              >
                <ProductSectionsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="faq-management"
            element={
              <ProtectedRoute resource={Resource.FAQS} action={Action.READ}>
                <FAQManagementPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="faq-management/create"
            element={
              <ProtectedRoute resource={Resource.FAQS} action={Action.CREATE}>
                <FAQCreatePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="brands"
            element={
              <ProtectedRoute resource={Resource.BRANDS} action={Action.READ}>
                <BrandsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="banners/new"
            element={
              <ProtectedRoute
                resource={Resource.BANNERS}
                action={Action.CREATE}
              >
                <BannersPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="banners/:id"
            element={
              <ProtectedRoute
                resource={Resource.BANNERS}
                action={Action.UPDATE}
              >
                <BannersPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="banners"
            element={
              <ProtectedRoute resource={Resource.BANNERS} action={Action.READ}>
                <BannersPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="partner"
            element={
              <ProtectedRoute superAdminOnly={true}>
                <PartnerPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="partners/:id"
            element={
              <ProtectedRoute superAdminOnly={true}>
                <PartnerDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>

      <Toaster position="bottom-right" richColors />
    </AuthProvider>
  );
};

export default App;
