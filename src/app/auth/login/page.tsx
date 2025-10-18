"use client";

import { useState, useEffect, Suspense } from "react";
import { Mail, Lock, LogIn, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LocalStorageManager } from "@/lib/localStorage";
import { motion } from "framer-motion";
import AnimatedBackground from "@/components/AnimatedBackground";

// Create a separate component for the login content
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setSuccessMessage(
        "Registration successful! You can now login with your credentials."
      );
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Store auth token and user info using localStorage manager
      LocalStorageManager.saveUserSession(data.user, data.token);
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("userRole", data.user.role);
      localStorage.setItem("userId", data.user.id);
      localStorage.setItem("userName", data.user.name);

      // Redirect based on role
      switch (data.user.role) {
        case "PATIENT":
          router.push("/patient/dashboard");
          break;
        case "DOCTOR":
          router.push("/doctor/dashboard");
          break;
        case "ADMIN":
        case "SUPERADMIN":
          router.push("/admin/dashboard");
          break;
        default:
          router.push("/");
      }
    } catch (error: unknown) {
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted relative overflow-hidden">
      <AnimatedBackground />

      <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="sm:mx-auto sm:w-full sm:max-w-md"
        >
          <div className="text-center">
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="mx-auto h-16 w-16 bg-gradient-to-r from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg"
            >
              <LogIn className="h-8 w-8 text-white" />
            </motion.div>
            <h2 className="mt-6 text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Sign in to your account
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Access your telemedicine platform
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
        >
          <div className="bg-card border border-border py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10">
            <form className="login-form space-y-6" onSubmit={handleSubmit}>
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm"
                >
                  {successMessage}
                </motion.div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm"
                >
                  {error}
                </motion.div>
              )}

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <Input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="pl-10 bg-transparent border-white/20 focus:border-white"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="pl-10 pr-10 bg-transparent border-white/20 focus:border-white"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Eye className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-2 block text-sm text-foreground"
                  >
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <Link
                    href="#"
                    className="font-medium text-primary hover:text-primary/80"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                  size="lg"
                >
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="h-5 w-5 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-card text-muted-foreground">
                    Don&apos;t have an account?
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <Link href="/auth/register">
                  <Button variant="outline" className="w-full" size="lg">
                    Create Account
                  </Button>
                </Link>
              </div>
            </div>

            {/* Demo Accounts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-6 bg-primary/5 border border-primary/10 rounded-xl p-4"
            >
              <h3 className="text-sm font-semibold text-primary mb-2">
                Demo Accounts
              </h3>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>
                  <strong className="text-foreground">Patient:</strong>{" "}
                  patient@example.com / patient123
                </p>
                <p>
                  <strong className="text-foreground">Doctor:</strong>{" "}
                  sarah.wilson@mediconnect.com / doctor123
                </p>
                <p>
                  <strong className="text-foreground">Admin:</strong>{" "}
                  admin@mediconnect.com / admin123
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Create a loading component for the Suspense fallback
function LoginLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted relative overflow-hidden">
      <AnimatedBackground />
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    </div>
  );
}

// Main component wrapped with Suspense
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginContent />
    </Suspense>
  );
}
