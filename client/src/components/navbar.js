"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { useState, useEffect, useRef } from "react";
import {
  ShoppingBag,
  User,
  Menu,
  X,
  Search,
  Heart,
  ChevronRight,
  Phone,
  Truck,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useRouter, usePathname } from "next/navigation";
import { fetchApi } from "@/lib/utils";
import { ClientOnly } from "./client-only";
import { cn } from "@/lib/utils";
import { toast, Toaster } from "sonner";
import Image from "next/image";

const menuItems = [
  {
    name: "NEW ARRIVALS",
    href: "/products?productType=new",
    highlight: true,
  },
  {
    name: "SUIT SETS",
    href: "/products?productType=suits",
    megaMenu: {
      categories: [
        { name: "Shop All", href: "/products?productType=suits" },
        { name: "Printed Suits", href: "/products?style=printed-suits" },
        {
          name: "Embroidered Suits",
          href: "/products?style=embroidered-suits",
        },
        { name: "Cotton Suits", href: "/products?fabric=cotton-suits" },
        { name: "Silk Suits", href: "/products?fabric=silk-suits" },
      ],
      collections: [
        { name: "Festive Collection", href: "/collections/festive-suits" },
        { name: "Wedding Edit", href: "/collections/wedding-suits" },
        { name: "Daily Wear", href: "/collections/daily-suits" },
        { name: "Office Wear", href: "/collections/office-suits" },
      ],
    },
  },
  {
    name: "KURTIS & TOPS",
    href: "/products?productType=kurtis",
    megaMenu: {
      categories: [
        { name: "Shop All", href: "/products?productType=kurtis" },
        { name: "Straight Kurtis", href: "/products?style=straight-kurtis" },
        { name: "A-Line Kurtis", href: "/products?style=aline-kurtis" },
        { name: "Anarkali Kurtis", href: "/products?style=anarkali" },
        { name: "Short Kurtis", href: "/products?style=short-kurtis" },
        { name: "Long Kurtis", href: "/products?style=long-kurtis" },
      ],
      collections: [
        { name: "Classic Solids", href: "/collections/solid-kurtis" },
        { name: "Printed Kurtis", href: "/collections/printed-kurtis" },
        { name: "Embroidered", href: "/collections/embroidered-kurtis" },
        { name: "Designer Kurtis", href: "/collections/designer-kurtis" },
      ],
    },
  },
  {
    name: "SAREES",
    href: "/products?productType=sarees",
    megaMenu: {
      categories: [
        { name: "Shop All", href: "/products?productType=sarees" },
        { name: "Silk Sarees", href: "/products?fabric=silk-sarees" },
        { name: "Cotton Sarees", href: "/products?fabric=cotton-sarees" },
        { name: "Georgette Sarees", href: "/products?fabric=georgette" },
        { name: "Chiffon Sarees", href: "/products?fabric=chiffon" },
      ],
      collections: [
        { name: "Banarasi", href: "/collections/banarasi" },
        { name: "Kanjeevaram", href: "/collections/kanjeevaram" },
        { name: "Chanderi", href: "/collections/chanderi" },
        { name: "Patola", href: "/collections/patola" },
      ],
    },
  },
  {
    name: "DRESSES",
    href: "/products?productType=dresses",
  },
  {
    name: "WESTERN",
    href: "/products?productType=western",
  },
  {
    name: "JEWELLERY",
    href: "/products?productType=jewellery",
  },
  {
    name: "SALE",
    href: "/products?sale=true",
    highlight: true,
    isSale: true,
  },
];

const defaultCategories = [
  { id: "1", name: "Kurtis", slug: "kurtis" },
  { id: "2", name: "Suits", slug: "suits" },
  { id: "3", name: "Sarees", slug: "sarees" },
  { id: "4", name: "Western", slug: "western" },
  { id: "5", name: "Dresses", slug: "dresses" },
  { id: "6", name: "Jewellery", slug: "jewellery" },
];

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { getCartItemCount } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [categories, setCategories] = useState(defaultCategories);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [expandedMobileMenu, setExpandedMobileMenu] = useState(null);
  const searchInputRef = useRef(null);
  const navbarRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();

  // Track scroll position for transparent/solid header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setIsSearchOpen(false);
    setActiveMenu(null);
  }, [pathname]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navbarRef.current && !navbarRef.current.contains(event.target)) {
        setActiveMenu(null);
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetchApi("/public/categories");
        if (response?.data?.categories && response.data.categories.length > 0) {
          setCategories(response.data.categories);
        }
      } catch (error) {
        console.log("[v0] Categories API failed, using defaults");
        // Keep default categories
      }
    };
    fetchCategories();
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
      setSearchQuery("");
      setIsMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    window.location.href = "/";
  };

  return (
    <>
      <header
        ref={navbarRef}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          isScrolled ? "shadow-md" : ""
        )}
      >
        <Toaster position="top-center" richColors />

        <div className="bg-[#136C5B] text-white py-2">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center text-sm font-medium tracking-wide">
              <span>FREE SHIPPING ON ORDERS ABOVE ₹999</span>
            </div>
          </div>
        </div>

        <div
          className={cn(
            "transition-all duration-300 bg-white",
            !isScrolled && "bg-white/95 backdrop-blur-sm"
          )}
        >
          <div className="max-w-7xl mx-auto px-4">
            {/* Mobile Header */}
            <div className="flex lg:hidden items-center justify-between h-24">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMenuOpen(true)}
                  className="p-2 text-gray-700 hover:text-[#136C5B] transition-colors"
                  aria-label="Open menu"
                >
                  <Menu className="h-6 w-6" />
                </button>
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2 text-gray-700 hover:text-[#136C5B] transition-colors"
                  aria-label="Search"
                >
                  <Search className="h-5 w-5" />
                </button>
              </div>

              <Link href="/" className="flex items-center">
                <Image
                  src="/logo.png"
                  alt="Surat Cloth House"
                  width={100}
                  height={40}
                />
              </Link>

              <div className="flex items-center gap-1">
                <ClientOnly>
                  <Link
                    href="/wishlist"
                    className="p-2 text-gray-700 hover:text-[#136C5B] transition-colors"
                  >
                    <Heart className="h-5 w-5" />
                  </Link>
                  <Link
                    href="/cart"
                    className="p-2 text-gray-700 hover:text-[#136C5B] transition-colors relative"
                  >
                    <ShoppingBag className="h-5 w-5" />
                    {getCartItemCount() > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-[#136C5B] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                        {getCartItemCount()}
                      </span>
                    )}
                  </Link>
                </ClientOnly>
              </div>
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:flex items-center justify-between h-24">
              {/* Logo */}
              <Link href="/" className="flex items-center shrink-0">
                <Image
                  src="/logo.png"
                  alt="Surat Cloth House"
                  width={100}
                  height={100}
                />
              </Link>

              {/* Search Bar */}
              <div className="flex-1 max-w-lg mx-8">
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Search kurta, suits and more..."
                    className="w-full pl-11 pr-4 py-2.5 border-gray-200 rounded-full bg-gray-50 focus:bg-white focus:border-[#136C5B] focus:ring-[#136C5B] text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </form>
              </div>

              {/* Right Icons */}
              <div className="flex items-center gap-6">
                <Link
                  href="/wishlist"
                  className="flex flex-col items-center text-gray-700 hover:text-[#136C5B] transition-colors"
                >
                  <Heart className="h-5 w-5" />
                  <span className="text-xs mt-0.5">Wishlist</span>
                </Link>

                <ClientOnly>
                  <div className="relative">
                    <button
                      className="flex flex-col items-center text-gray-700 hover:text-[#136C5B] transition-colors"
                      onClick={() =>
                        setActiveMenu(
                          activeMenu === "account" ? null : "account"
                        )
                      }
                    >
                      <User className="h-5 w-5" />
                      <span className="text-xs mt-0.5">Account</span>
                    </button>

                    {/* Account Dropdown */}
                    <div
                      className={cn(
                        "absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-100 py-2 transition-all duration-200 origin-top-right z-50",
                        activeMenu === "account"
                          ? "opacity-100 scale-100 visible"
                          : "opacity-0 scale-95 invisible pointer-events-none"
                      )}
                    >
                      {isAuthenticated ? (
                        <>
                          <div className="px-4 py-3 border-b border-gray-100">
                            <p className="font-medium text-gray-900">
                              {user?.name || "User"}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {user?.email}
                            </p>
                          </div>
                          <Link
                            href="/account"
                            className="block px-4 py-2.5 text-gray-700 hover:bg-gray-50 hover:text-[#136C5B] transition-colors"
                            onClick={() => setActiveMenu(null)}
                          >
                            My Account
                          </Link>
                          <Link
                            href="/account/orders"
                            className="block px-4 py-2.5 text-gray-700 hover:bg-gray-50 hover:text-[#136C5B] transition-colors"
                            onClick={() => setActiveMenu(null)}
                          >
                            My Orders
                          </Link>
                          <Link
                            href="/wishlist"
                            className="block px-4 py-2.5 text-gray-700 hover:bg-gray-50 hover:text-[#136C5B] transition-colors"
                            onClick={() => setActiveMenu(null)}
                          >
                            My Wishlist
                          </Link>
                          <div className="border-t border-gray-100 mt-2 pt-2">
                            <button
                              onClick={() => {
                                handleLogout();
                                setActiveMenu(null);
                              }}
                              className="block w-full text-left px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors"
                            >
                              Logout
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="p-4 space-y-2">
                          <Link
                            href="/auth"
                            onClick={() => setActiveMenu(null)}
                          >
                            <Button className="w-full bg-[#136C5B] hover:bg-[#0f5a4a]">
                              Login
                            </Button>
                          </Link>
                          <Link
                            href="/auth?mode=register"
                            onClick={() => setActiveMenu(null)}
                          >
                            <Button
                              variant="outline"
                              className="w-full border-[#136C5B] text-[#136C5B] hover:bg-[#136C5B] hover:text-white bg-transparent"
                            >
                              Register
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </ClientOnly>

                <ClientOnly>
                  <Link
                    href="/cart"
                    className="flex flex-col items-center text-gray-700 hover:text-[#136C5B] transition-colors relative"
                  >
                    <div className="relative">
                      <ShoppingBag className="h-5 w-5" />
                      {getCartItemCount() > 0 && (
                        <span className="absolute -top-2 -right-2 bg-[#136C5B] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                          {getCartItemCount()}
                        </span>
                      )}
                    </div>
                    <span className="text-xs mt-0.5">Cart</span>
                  </Link>
                </ClientOnly>
              </div>
            </div>
          </div>
        </div>

        <nav
          className={cn(
            "hidden lg:block border-t border-gray-100 transition-all duration-300 bg-white",
            !isScrolled && "bg-white/95 backdrop-blur-sm"
          )}
        >
          <div className="container mx-auto px-4">
            <ul className="flex items-center justify-center">
              {menuItems.map((item) => (
                <li
                  key={item.name}
                  className="relative"
                  onMouseEnter={() => item.megaMenu && setActiveMenu(item.name)}
                  onMouseLeave={() => setActiveMenu(null)}
                >
                  {item.highlight ? (
                    <Link
                      href={item.href}
                      className={cn(
                        "block px-5 py-3 text-sm font-semibold tracking-wide transition-colors",
                        item.isSale
                          ? "bg-[#136C5B] text-white hover:bg-[#0f5a4a]"
                          : "bg-[#136C5B] text-white hover:bg-[#0f5a4a]"
                      )}
                    >
                      {item.name}
                    </Link>
                  ) : (
                    <Link
                      href={item.href}
                      className={cn(
                        "block px-5 py-3 text-sm font-medium text-gray-800 hover:text-[#136C5B] tracking-wide transition-colors relative",
                        activeMenu === item.name && "text-[#136C5B]"
                      )}
                    >
                      {item.name}
                      {item.megaMenu && (
                        <span
                          className={cn(
                            "absolute bottom-0 left-5 right-5 h-0.5 bg-[#136C5B] transform origin-left transition-transform duration-200",
                            activeMenu === item.name
                              ? "scale-x-100"
                              : "scale-x-0"
                          )}
                        />
                      )}
                    </Link>
                  )}

                  {/* Mega Menu */}
                  {item.megaMenu && (
                    <div
                      className={cn(
                        "absolute left-1/2 -translate-x-1/2 top-full w-[500px] bg-white shadow-xl border border-gray-100 transition-all duration-200 origin-top z-50",
                        activeMenu === item.name
                          ? "opacity-100 scale-100 visible"
                          : "opacity-0 scale-95 invisible pointer-events-none"
                      )}
                    >
                      <div className="grid grid-cols-2 gap-6 p-6">
                        {/* Categories */}
                        <div>
                          <h3 className="text-xs font-semibold text-[#136C5B] tracking-wider mb-3 uppercase">
                            Category
                          </h3>
                          <ul className="space-y-2">
                            {item.megaMenu.categories.map((cat) => (
                              <li key={cat.href}>
                                <Link
                                  href={cat.href}
                                  className="text-sm text-gray-600 hover:text-[#136C5B] transition-colors"
                                  onClick={() => setActiveMenu(null)}
                                >
                                  {cat.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Collections */}
                        <div>
                          <h3 className="text-xs font-semibold text-[#136C5B] tracking-wider mb-3 uppercase">
                            Collection
                          </h3>
                          <ul className="space-y-2">
                            {item.megaMenu.collections.map((col) => (
                              <li key={col.href}>
                                <Link
                                  href={col.href}
                                  className="text-sm text-gray-600 hover:text-[#136C5B] transition-colors"
                                  onClick={() => setActiveMenu(null)}
                                >
                                  {col.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </header>

      {/* Mobile Search Overlay */}
      {isSearchOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 lg:hidden"
          onClick={() => setIsSearchOpen(false)}
        >
          <div
            className="bg-white p-4 animate-in slide-in-from-top duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                ref={searchInputRef}
                type="search"
                placeholder="Search kurta, suits and more..."
                className="w-full pl-12 pr-12 py-3 text-base border-gray-200 rounded-lg focus:border-[#136C5B] focus:ring-[#136C5B]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </form>

            {/* Quick Search Tags */}
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
                Popular Searches
              </p>
              <div className="flex flex-wrap gap-2">
                {["Kurtis", "Sarees", "Suits", "Western", "Dresses"].map(
                  (term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => {
                        setSearchQuery(term);
                        router.push(`/products?search=${term}`);
                        setIsSearchOpen(false);
                      }}
                      className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-[#136C5B] hover:text-white transition-colors"
                    >
                      {term}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        className={cn(
          "fixed inset-0 z-[60] lg:hidden transition-opacity duration-300",
          isMenuOpen
            ? "opacity-100 visible"
            : "opacity-0 invisible pointer-events-none"
        )}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50"
          onClick={() => setIsMenuOpen(false)}
        />

        {/* Menu Panel */}
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 w-[85%] max-w-sm bg-white transform transition-transform duration-300 flex flex-col",
            isMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {/* Menu Header */}
          <div className="bg-[#136C5B] px-4 py-3 flex items-center justify-between shrink-0">
            <span className="text-sm font-medium text-white">
              FREE SHIPPING ABOVE ₹999
            </span>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="p-1 text-white hover:opacity-70"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User Section */}
          <ClientOnly>
            <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
              {isAuthenticated ? (
                <div>
                  <p className="font-medium text-gray-900">
                    Hi, {user?.name || "User"}
                  </p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
              ) : (
                <Link
                  href="/auth"
                  className="flex items-center gap-2 text-[#136C5B] font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="h-5 w-5" />
                  Login / Register
                </Link>
              )}
              <Link
                href="/wishlist"
                className="p-2 text-gray-600 hover:text-[#136C5B]"
                onClick={() => setIsMenuOpen(false)}
              >
                <Heart className="h-5 w-5" />
              </Link>
            </div>
          </ClientOnly>

          {/* Menu Items - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            {/* NEW ARRIVALS */}
            <div className="bg-[#136C5B] text-white">
              <Link
                href="/products?productType=new"
                className="flex items-center justify-between px-4 py-3.5 hover:bg-[#0f5a4a] transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="font-semibold">NEW ARRIVALS</span>
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>

            {/* Categories */}
            {menuItems
              .filter((item) => !item.highlight)
              .map((item) => (
                <div key={item.name} className="border-b border-gray-100">
                  {item.megaMenu ? (
                    <>
                      <button
                        onClick={() =>
                          setExpandedMobileMenu(
                            expandedMobileMenu === item.name ? null : item.name
                          )
                        }
                        className="flex items-center justify-between w-full px-4 py-3.5 text-gray-800 hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-medium">{item.name}</span>
                        <ChevronRight
                          className={cn(
                            "h-5 w-5 text-gray-400 transition-transform duration-200",
                            expandedMobileMenu === item.name && "rotate-90"
                          )}
                        />
                      </button>

                      {/* Submenu */}
                      <div
                        className={cn(
                          "bg-gray-50 overflow-hidden transition-all duration-300",
                          expandedMobileMenu === item.name
                            ? "max-h-[500px] opacity-100"
                            : "max-h-0 opacity-0"
                        )}
                      >
                        <div className="py-2">
                          <Link
                            href={item.href}
                            className="block px-6 py-2.5 text-[#136C5B] font-medium hover:bg-gray-100"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            Shop All {item.name}
                          </Link>
                          {item.megaMenu.categories.slice(1).map((cat) => (
                            <Link
                              key={cat.href}
                              href={cat.href}
                              className="block px-6 py-2.5 text-gray-600 hover:bg-gray-100 hover:text-[#136C5B]"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              {cat.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      className="flex items-center justify-between px-4 py-3.5 text-gray-800 hover:bg-gray-50 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="font-medium">{item.name}</span>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </Link>
                  )}
                </div>
              ))}

            {/* SALE */}
            <div className="bg-[#136C5B] text-white">
              <Link
                href="/products?sale=true"
                className="flex items-center justify-between px-4 py-3.5 hover:bg-[#0f5a4a] transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="font-bold">CLEARANCE SALE</span>
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>

            {/* Additional Links */}
            <div className="py-4 border-t border-gray-200 mt-2">
              <Link
                href="/account/orders"
                className="flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:text-[#136C5B]"
                onClick={() => setIsMenuOpen(false)}
              >
                <Truck className="h-4 w-4" />
                Track Order
              </Link>
              <Link
                href="/contact"
                className="flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:text-[#136C5B]"
                onClick={() => setIsMenuOpen(false)}
              >
                <Phone className="h-4 w-4" />
                Contact Us
              </Link>
            </div>

            {/* Logout Button */}
            <ClientOnly>
              {isAuthenticated && (
                <div className="px-4 py-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full py-2.5 text-red-600 font-medium hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Logout
                  </button>
                </div>
              )}
            </ClientOnly>
          </div>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="grid grid-cols-4 gap-1 safe-area-pb">
          <Link
            href="/"
            className={cn(
              "flex flex-col items-center justify-center py-2.5",
              pathname === "/" ? "text-[#136C5B]" : "text-gray-500"
            )}
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-[10px] mt-0.5 font-medium">Home</span>
          </Link>

          <Link
            href="/products"
            className={cn(
              "flex flex-col items-center justify-center py-2.5",
              pathname.includes("/products")
                ? "text-[#136C5B]"
                : "text-gray-500"
            )}
          >
            <Search className="h-5 w-5" />
            <span className="text-[10px] mt-0.5 font-medium">Shop</span>
          </Link>

          <Link
            href="/wishlist"
            className={cn(
              "flex flex-col items-center justify-center py-2.5",
              pathname === "/wishlist" ? "text-[#136C5B]" : "text-gray-500"
            )}
          >
            <Heart className="h-5 w-5" />
            <span className="text-[10px] mt-0.5 font-medium">Wishlist</span>
          </Link>

          <ClientOnly>
            <Link
              href="/cart"
              className={cn(
                "flex flex-col items-center justify-center py-2.5 relative",
                pathname === "/cart" ? "text-[#136C5B]" : "text-gray-500"
              )}
            >
              <div className="relative">
                <ShoppingBag className="h-5 w-5" />
                {getCartItemCount() > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#136C5B] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-medium">
                    {getCartItemCount()}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 font-medium">Cart</span>
            </Link>
          </ClientOnly>
        </div>
      </div>

      {/* Spacer for fixed header */}
      <div className="h-[96px] lg:h-[136px]" />
    </>
  );
}
