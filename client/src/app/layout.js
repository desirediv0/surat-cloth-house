import { Lato } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Toaster } from "sonner";
import { RouteGuard } from "@/components/route-guard";
import { ClientOnly } from "@/components/client-only";

const lato = Lato({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--font-lato",
  display: "swap",
});

export const metadata = {
  title: "Surat Cloth House - Premium Women's Fashion",
  description:
    "Discover elegant women's clothing at Surat Cloth House. Shop Kurtis, Suits, Sarees, Western wear, and more. Free shipping on orders above ₹999.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${lato.variable} font-lato antialiased`}
      >
        <AuthProvider>
          <CartProvider>
            <div className="flex min-h-screen flex-col">
              <Navbar />
              <main className="flex-1">
                <ClientOnly>
                  <RouteGuard>{children}</RouteGuard>
                </ClientOnly>
              </main>
              <Footer />
            </div>
            <Toaster position="top-center" richColors closeButton />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
