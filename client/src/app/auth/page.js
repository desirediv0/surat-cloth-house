"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast, Toaster } from "sonner";
import { AuthRedirect } from "@/components/auth-redirect";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";

const TABS = ["login", "register", "verify-otp"];
const NAV_TABS = ["login", "register"];

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, register, verifyOtp, resendVerification } = useAuth();

  const queryTab = (searchParams.get("tab") || "login").toLowerCase();
  const initialTab = TABS.includes(queryTab) ? queryTab : "login";
  const [activeTab, setActiveTab] = useState(initialTab);

  // Persist selected tab in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("tab", activeTab);
    const email = searchParams.get("email");
    if (email) params.set("email", email);
    const href = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", href);
  }, [activeTab, searchParams]);

  // Common email persistence for Verify tab
  const emailFromQuery = useMemo(
    () => searchParams.get("email") || "",
    [searchParams]
  );
  const [pendingEmail, setPendingEmail] = useState("");
  useEffect(() => {
    const stored =
      localStorage.getItem("pendingEmail") ||
      localStorage.getItem("registeredEmail") ||
      "";
    const chosen = emailFromQuery || stored;
    if (chosen) setPendingEmail(chosen);
  }, [emailFromQuery]);

  // LOGIN state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  // REGISTER state
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [registerSubmitting, setRegisterSubmitting] = useState(false);

  // VERIFY state
  const [otp, setOtp] = useState("");
  const [verifySubmitting, setVerifySubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((x) => x - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Handlers
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.error("Email and password are required");
      return;
    }
    setLoginSubmitting(true);
    try {
      await login(loginEmail, loginPassword);
      sessionStorage.setItem("justLoggedIn", "true");
      const returnUrl =
        searchParams.get("returnUrl") || searchParams.get("redirect");
      setTimeout(() => {
        window.location.href = returnUrl ? decodeURIComponent(returnUrl) : "/";
      }, 300);
    } catch (err) {
      const msg = err.message || "Login failed";
      if (msg.toLowerCase().includes("verify")) {
        toast.error("Please verify with OTP first");
        setActiveTab("verify-otp");
        if (loginEmail) {
          localStorage.setItem("pendingEmail", loginEmail);
          setPendingEmail(loginEmail);
        }
      } else {
        toast.error(msg);
      }
    } finally {
      setLoginSubmitting(false);
    }
  };

  // Check if password meets all requirements
  const isPasswordValid = () => {
    return (
      form.password.length >= 8 &&
      /[A-Z]/.test(form.password) &&
      /[a-z]/.test(form.password) &&
      /\d/.test(form.password) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(form.password) &&
      form.password === form.confirmPassword &&
      form.name.trim().length >= 3 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
    );
  };

  const validateRegister = () => {
    if (form.name.trim().length < 3)
      return toast.error("Name should be at least 3 characters"), false;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email))
      return toast.error("Enter a valid email"), false;

    // Enhanced password validation to match server requirements
    if (form.password.length < 8)
      return toast.error("Password must be at least 8 characters long"), false;
    if (!/[A-Z]/.test(form.password))
      return toast.error("Password must contain at least one uppercase letter"), false;
    if (!/[a-z]/.test(form.password))
      return toast.error("Password must contain at least one lowercase letter"), false;
    if (!/\d/.test(form.password))
      return toast.error("Password must contain at least one number"), false;
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(form.password))
      return toast.error("Password must contain at least one special character"), false;

    if (form.password !== form.confirmPassword)
      return toast.error("Passwords do not match"), false;

    return true;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateRegister()) return;
    setRegisterSubmitting(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      localStorage.setItem("pendingEmail", form.email);
      toast.success("Account created. Enter the OTP sent to your email.");
      setActiveTab("verify-otp");
      setPendingEmail(form.email);
      setOtp("");
    } catch (err) {
      toast.error(err.message || "Registration failed");
    } finally {
      setRegisterSubmitting(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!pendingEmail) return toast.error("Email required");
    if (!/^\d{6}$/.test(otp)) return toast.error("Enter 6-digit OTP");
    setVerifySubmitting(true);
    try {
      await verifyOtp(pendingEmail, otp);
      toast.success("Email verified. Please login.");
      setActiveTab("login");
    } catch (err) {
      toast.error(err.message || "Failed to verify OTP");
    } finally {
      setVerifySubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!pendingEmail) return toast.error("Enter your email to resend OTP");
    try {
      await resendVerification(pendingEmail);
      toast.success("OTP sent to your email");
      setResendCooldown(30);
    } catch (err) {
      toast.error(err.message || "Failed to resend OTP");
    }
  };

  return (
    <AuthRedirect>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Toaster position="top-center" />
        <div className="w-full max-w-2xl bg-white rounded-lg shadow-md p-6 sm:p-8">
          <div className="flex gap-2 mb-6">
            {NAV_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === tab
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
              >
                {tab === "login" && "Login"}
                {tab === "register" && "Register"}
              </button>
            ))}
          </div>

          {activeTab === "login" && (
            <form className="space-y-4" onSubmit={handleLogin}>
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <Input
                  id="login-email"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="login-password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showLoginPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    onClick={() => setShowLoginPassword((s) => !s)}
                  >
                    {showLoginPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loginSubmitting}
              >
                {loginSubmitting ? "Signing in..." : "Sign in"}
              </Button>
              <p className="text-center text-sm text-gray-600">
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => setActiveTab("register")}
                >
                  Register
                </button>
              </p>
            </form>
          )}

          {activeTab === "register" && (
            <form className="space-y-4" onSubmit={handleRegister}>
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Full Name
                </label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  required
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label
                  htmlFor="reg-email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <Input
                  id="reg-email"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, email: e.target.value }))
                  }
                  required
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Phone (optional)
                </label>
                <Input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, phone: e.target.value }))
                  }
                  placeholder="Enter your phone number"
                />
              </div>
              <div>
                <label
                  htmlFor="reg-password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="reg-password"
                    type={showRegisterPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, password: e.target.value }))
                    }
                    required
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    onClick={() => setShowRegisterPassword((s) => !s)}
                  >
                    {showRegisterPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-gray-600 font-medium">Password requirements:</p>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li className="flex items-center">
                      <span className={`mr-2 ${form.password.length >= 8 ? 'text-green-500' : 'text-gray-400'}`}>✓</span>
                      At least 8 characters long
                    </li>
                    <li className="flex items-center">
                      <span className={`mr-2 ${/[A-Z]/.test(form.password) ? 'text-green-500' : 'text-gray-400'}`}>✓</span>
                      One uppercase letter (A-Z)
                    </li>
                    <li className="flex items-center">
                      <span className={`mr-2 ${/[a-z]/.test(form.password) ? 'text-green-500' : 'text-gray-400'}`}>✓</span>
                      One lowercase letter (a-z)
                    </li>
                    <li className="flex items-center">
                      <span className={`mr-2 ${/\d/.test(form.password) ? 'text-green-500' : 'text-gray-400'}`}>✓</span>
                      One number (0-9)
                    </li>
                    <li className="flex items-center">
                      <span className={`mr-2 ${/[!@#$%^&*(),.?":{}|<>]/.test(form.password) ? 'text-green-500' : 'text-gray-400'}`}>✓</span>
                      One special character (!@#$%^&*(),.?&quot;:{ }|&lt;&gt;)
                    </li>
                  </ul>
                </div>
              </div>
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Confirm Password
                </label>
                <Input
                  id="confirmPassword"
                  type={showRegisterPassword ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, confirmPassword: e.target.value }))
                  }
                  required
                  placeholder="Confirm your password"
                />
                {form.confirmPassword && (
                  <p className={`mt-1 text-xs ${form.password === form.confirmPassword
                    ? 'text-green-600'
                    : 'text-red-600'
                    }`}>
                    {form.password === form.confirmPassword
                      ? '✓ Passwords match'
                      : '✗ Passwords do not match'
                    }
                  </p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={registerSubmitting || !isPasswordValid()}
              >
                {registerSubmitting ? "Creating Account..." : "Create Account"}
              </Button>
              <p className="text-center text-sm text-gray-600">
                Already have an account?{" "}
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => setActiveTab("login")}
                >
                  Login
                </button>
              </p>
            </form>
          )}

          {activeTab === "verify-otp" && (
            <form className="space-y-4" onSubmit={handleVerify}>
              <div>
                <label
                  htmlFor="v-email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <Input
                  id="v-email"
                  type="email"
                  value={pendingEmail}
                  onChange={(e) => setPendingEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="v-otp"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  One-Time Password (OTP)
                </label>
                <Input
                  id="v-otp"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^\d]/g, ""))}
                  placeholder="Enter 6-digit OTP"
                  required
                />
              </div>
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                >
                  {resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : "Resend OTP"}
                </Button>
                <Button type="submit" disabled={verifySubmitting}>
                  {verifySubmitting ? "Verifying..." : "Verify"}
                </Button>
              </div>
              <p className="text-center text-sm text-gray-600">
                Already verified?{" "}
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => setActiveTab("login")}
                >
                  Login
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </AuthRedirect>
  );
}
