"use client";

import type React from "react";

import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Package, Loader2, Shield } from "lucide-react";
import { loginbg } from "@/assets";

export default function LoginPage() {
  const { login, isAuthenticated, isLoading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // If already authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validate inputs
    if (!email.trim()) {
      setFormError("Email is required");
      return;
    }
    if (!password) {
      setFormError("Password is required");
      return;
    }

    try {
      setIsSubmitting(true);
      await login(email, password);
    } catch (error: any) {
      console.error("Login error:", error);
      setFormError(error.message || "Failed to login. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen w-full">
      {/* Left Side - Single Image with Hover Overlay */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50">
        {/* Brand Logo/Title */}
        <div className="absolute top-6 left-6 z-20">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0160A8]">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-200">
                Surat Cloth House
              </h1>
              <p className="text-sm text-gray-500">Admin Portal</p>
            </div>
          </div>
        </div>

        {/* Single Hero Image */}
        <div className="flex-1 relative group overflow-hidden cursor-pointer">
          <img
            src={loginbg}
            alt="Surat Cloth House - Premium Supplements"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-70 group-hover:opacity-85 transition-opacity duration-300" />

          {/* Text Overlay */}
          <div className="absolute inset-0 flex items-center justify-center p-8 text-white">
            <div className="text-center max-w-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
              <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold mb-4 opacity-90 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                Surat Cloth House
              </h2>
              <p className="text-lg lg:text-xl opacity-80 group-hover:opacity-100 transition-opacity duration-300 delay-200 leading-relaxed">
                Premium Supplements for Your Fitness Journey
              </p>

              {/* Decorative Line */}
              <div className="w-24 h-1 bg-[#0160A8] mx-auto mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-300"></div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-8 right-8 w-16 h-16 border-2 border-white/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Shield className="w-8 h-8 text-white" />
          </div>

          {/* Bottom Corner Accent */}
          <div className="absolute bottom-8 left-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
            <div className="flex items-center space-x-2 text-white/80">
              <div className="w-2 h-2 bg-[#0160A8] rounded-full"></div>
              <span className="text-sm font-medium">Admin Access</span>
            </div>
          </div>
        </div>

        {/* Bottom Gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 lg:w-1/2 xl:w-2/5 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Brand Header */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0160A8]">
                <Package className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Surat Cloth House
                </h1>
                <p className="text-sm text-gray-600">Admin Portal</p>
              </div>
            </div>
          </div>

          {/* Login Form Header */}
          <div className="text-center space-y-2">
            <div className="hidden lg:flex lg:justify-center lg:mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0160A8]">
                <Shield className="h-7 w-7 text-white" />
              </div>
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
              Admin Login
            </h2>
            <p className="text-sm text-gray-600">
              Enter your credentials to access the admin dashboard
            </p>
          </div>

          {/* Error Display */}
          {(error || formError) && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-center">
              <p className="text-sm text-red-600 font-medium">
                {formError || error}
              </p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="admin@login.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                required
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                required
                className="h-12 text-base"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base bg-[#0160A8] hover:bg-[#0160A8]/90 focus:ring-[#0160A8] cursor-pointer"
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-5 w-5" />
                  Sign in to Dashboard
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="text-center pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              © 2025 Surat Cloth House. All rights reserved.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Secure admin access portal
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
