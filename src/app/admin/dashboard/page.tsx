"use client";

import React, { useState, useEffect, useCallback } from "react";
import ResponsiveLayout from "@/components/ResponsiveLayout";
import NavigationHeader from "@/components/NavigationHeader";
import { motion } from "framer-motion";
import {
  Activity,
  Users,
  UserCheck,
  Stethoscope,
  Calendar,
  Pill,
  Package,
  TestTube,
  FlaskConical,
  ShoppingCart,
  Star,
  Heart,
  BarChart3,
  Shield,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { ResponsiveCard } from "@/components/ResponsiveComponents";
import { formatCurrency } from "@/lib/utils";
import {
  AdminPerformanceProvider,
  AdminPerformanceWarning,
  useAdminPerformance,
} from "@/components/admin/AdminPerformanceProvider";

// Import all the modular admin components
import DoctorManagement from "@/components/admin/DoctorManagement";
import StockManagement from "@/components/admin/StockManagement";
import AppointmentManagement from "@/components/admin/AppointmentManagement";
import UserManagement from "@/components/admin/UserManagement";
import MedicineManagement from "@/components/admin/MedicineManagement";
import LabPackageManagement from "@/components/admin/LabPackageManagement";
import OrderManagement from "@/components/admin/OrderManagement";
import ReviewManagement from "@/components/admin/ReviewManagement";
import SpecialtyManagement from "@/components/admin/SpecialtyManagement";
import CategoryManagement from "@/components/admin/CategoryManagement";
import LabTestManagement from "@/components/admin/LabTestManagement";

// Import the new DoctorVerificationTab component
import DoctorVerificationTab from "@/components/admin/DoctorVerificationTab";

// Import the new WishlistManagement component
import WishlistManagement from "@/components/admin/WishlistManagement";

interface DashboardStats {
  totalUsers: number;
  totalDoctors: number;
  totalPatients: number;
  pendingVerifications: number;
  totalAppointments: number;
  monthlyRevenue: number;
  totalMedicines: number;
  totalLabPackages: number;
  lowStockMedicines: number;
  pendingOrders: number;
}

export default function AdminDashboard() {
  return (
    <AdminPerformanceProvider>
      <AdminDashboardContent />
      <AdminPerformanceWarning />
    </AdminPerformanceProvider>
  );
}

function AdminDashboardContent() {
  const { retryOperation, performanceStatus } = useAdminPerformance();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false); // Start with false - show dashboard immediately
  const [error, setError] = useState("");

  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalDoctors: 0,
    totalPatients: 0,
    pendingVerifications: 0,
    totalAppointments: 0,
    monthlyRevenue: 0,
    totalMedicines: 0,
    totalLabPackages: 0,
    lowStockMedicines: 0,
    pendingOrders: 0,
  });

  const fetchDashboardData = useCallback(async (retryCount = 0) => {
    try {
      // Don't show loading state - dashboard should be immediately visible
      // setLoading(true);
      setError(""); // Clear any previous errors

      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("Authentication required");
        setLoading(false);
        return;
      }

      console.log(`[Dashboard] Loading data (attempt ${retryCount + 1})...`);

      // Reduced timeout to work with optimized API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      // Fetch optimized dashboard stats
      const statsResponse = await fetch("/api/dashboard/stats", {
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();

        // Handle both optimized and legacy response formats
        const statsToUse = statsData.stats ||
          statsData || {
            totalUsers: 0,
            totalDoctors: 0,
            totalPatients: 0,
            pendingVerifications: 0,
            totalAppointments: 0,
            monthlyRevenue: 0,
            totalMedicines: 0,
            totalLabPackages: 0,
            lowStockMedicines: 0,
            pendingOrders: 0,
          };

        setStats(statsToUse);

        // Handle performance feedback
        if (statsData.fallback) {
          console.warn("[Dashboard] Using fallback data due to system load");
          setError(
            "⚠️ Some dashboard data may be incomplete due to high system load"
          );
        } else {
          console.log(
            `[Dashboard] Successfully loaded ${
              statsData.cached ? "(cached)" : "(fresh)"
            }`
          );
        }
      } else if (statsResponse.status === 408) {
        throw new Error("Dashboard API timeout - system under high load");
      } else {
        throw new Error(
          `HTTP ${statsResponse.status}: Failed to fetch dashboard stats`
        );
      }
    } catch (error: unknown) {
      console.error("[Dashboard] Data fetch error:", error);

      // Reduced retries for faster resolution
      if (
        retryCount < 2 &&
        error instanceof Error &&
        !error.message.includes("Authentication")
      ) {
        const delay = Math.pow(2, retryCount) * 1500; // 1.5s, 3s delays
        console.log(
          `[Dashboard] Retrying in ${delay}ms... (attempt ${retryCount + 1}/2)`
        );
        setTimeout(() => {
          fetchDashboardData(retryCount + 1);
        }, delay);
        return;
      }

      // Simplified error handling - no timeout messages
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to load dashboard data";

      if (errorMessage.includes("Authentication")) {
        setError("🔐 Authentication required - please log in again");
      }
      // Remove timeout-specific error messages per project specification
    } finally {
      if (retryCount === 0) {
        setLoading(false);
      }
    }
  }, []); // Remove dependencies to prevent infinite loop

  useEffect(() => {
    fetchDashboardData(0); // Simple data fetch for admin dashboard
  }, [fetchDashboardData]);

  const navigationItems = [
    { id: "overview", icon: Activity, label: "Overview" },
    { id: "users", icon: Users, label: "User Management" },
    {
      id: "doctor-verification",
      icon: UserCheck,
      label: "Doctor Verification",
    },
    { id: "doctors", icon: Stethoscope, label: "Doctors" },
    { id: "appointments", icon: Calendar, label: "Appointments" },
    { id: "medicines", icon: Pill, label: "Medicines" },
    { id: "categories", icon: Package, label: "Categories" },
    { id: "stock-management", icon: Package, label: "Stock Management" },
    { id: "lab-packages", icon: TestTube, label: "Lab Packages" },
    { id: "lab-tests", icon: FlaskConical, label: "Lab Tests" },
    { id: "orders", icon: ShoppingCart, label: "Orders" },
    { id: "reviews", icon: Star, label: "Reviews" },
    { id: "specialties", icon: Heart, label: "Specialties" },
    { id: "wishlist", icon: Heart, label: "Wishlist" }, // Add this line
    { id: "analytics", icon: BarChart3, label: "Analytics" },
  ];

  // Remove loading state display - show dashboard immediately
  // if (loading) {
  //   return loading screen - DISABLED per project specification
  // }

  // Remove error state display - show dashboard even with errors
  // if (error) {
  //   return error screen - DISABLED per project specification
  // }

  return (
    <>
      {/* Navigation Header */}
      <NavigationHeader currentPage="admin-dashboard" />

      <ResponsiveLayout
        title="Admin Dashboard"
        user={{
          name: "Admin User",
          email: "admin@medical.com",
          role: "ADMIN",
        }}
      >
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
          {/* Animated Background */}
          <div className="absolute inset-0">
            <motion.div
              animate={{
                background: [
                  "radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.05) 0%, transparent 50%)",
                  "radial-gradient(circle at 80% 20%, rgba(168, 85, 247, 0.05) 0%, transparent 50%)",
                  "radial-gradient(circle at 40% 80%, rgba(14, 165, 233, 0.05) 0%, transparent 50%)",
                  "radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.05) 0%, transparent 50%)",
                ],
              }}
              transition={{ duration: 15, repeat: Infinity }}
              className="absolute inset-0"
            />
          </div>

          <div className="relative z-10">
            <div className="pt-24 pb-8">
              <div className="flex gap-8">
                {/* Left Sidebar */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="w-64 flex-shrink-0"
                >
                  <div className="bg-white/80 backdrop-blur-xl shadow-2xl border border-white/30 rounded-2xl p-6 sticky top-32">
                    <div className="text-center mb-6">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3"
                      >
                        <Shield className="h-8 w-8 text-white" />
                      </motion.div>
                      <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Admin Panel
                      </h2>
                      <p className="text-sm text-gray-600">System Management</p>
                    </div>

                    {/* Navigation Menu */}
                    <nav className="space-y-2">
                      {navigationItems.map((item, index) => (
                        <motion.button
                          key={item.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ x: 4, scale: 1.02 }}
                          onClick={() => setActiveTab(item.id)}
                          className={`w-full text-left px-4 py-3 rounded-xl flex items-center transition-all duration-200 ${
                            activeTab === item.id
                              ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                              : "text-gray-700 hover:bg-white/60 hover:shadow-md"
                          }`}
                        >
                          <item.icon className="h-5 w-5 mr-3" />
                          <span className="font-medium">{item.label}</span>
                        </motion.button>
                      ))}
                    </nav>
                  </div>
                </motion.div>

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                  >
                    <div className="bg-white/80 backdrop-blur-xl shadow-2xl border border-white/30 rounded-2xl p-6">
                      <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        {navigationItems.find((item) => item.id === activeTab)
                          ?.label || "Dashboard Overview"}
                      </h1>
                      <p className="text-gray-600">
                        {activeTab === "overview"
                          ? "Monitor and manage your medical platform"
                          : `Manage ${navigationItems
                              .find((item) => item.id === activeTab)
                              ?.label?.toLowerCase()} in your system`}
                      </p>
                    </div>
                  </motion.div>

                  {/* Content Area */}
                  <div className="space-y-6">
                    {/* Error Display Enhancement */}
                    {error && !loading && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4"
                      >
                        <div className="flex items-center space-x-2">
                          <div className="text-red-600 text-xl">⚠️</div>
                          <div>
                            <h4 className="text-red-800 font-semibold">
                              System Notice
                            </h4>
                            <p className="text-red-700">{error}</p>
                            <button
                              onClick={() => {
                                setError("");
                                fetchDashboardData(0);
                              }}
                              className="mt-2 text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                            >
                              Retry Connection
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    {/* Overview Tab */}
                    {activeTab === "overview" && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                      >
                        {/* Key Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          {[
                            {
                              icon: Users,
                              label: "Total Users",
                              value: stats.totalUsers,
                              color: "from-blue-500 to-cyan-500",
                              change: "+12%",
                            },
                            {
                              icon: Stethoscope,
                              label: "Active Doctors",
                              value: stats.totalDoctors,
                              color: "from-green-500 to-emerald-500",
                              change: "+5%",
                            },
                            {
                              icon: Calendar,
                              label: "Total Appointments",
                              value: stats.totalAppointments,
                              color: "from-purple-500 to-violet-500",
                              change: "+23%",
                            },
                            {
                              icon: DollarSign,
                              label: "Monthly Revenue",
                              value: formatCurrency(stats.monthlyRevenue),
                              color: "from-orange-500 to-amber-500",
                              change: "+18%",
                            },
                          ].map((metric, index) => (
                            <motion.div
                              key={metric.label}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              whileHover={{ y: -5, scale: 1.02 }}
                            >
                              <ResponsiveCard className="bg-white/80 backdrop-blur-xl shadow-2xl border border-white/30 p-6">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">
                                      {metric.label}
                                    </p>
                                    <p className="text-3xl font-bold text-gray-900 mb-2">
                                      {metric.value}
                                    </p>
                                    <div className="flex items-center">
                                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                                      <span className="text-sm text-green-500 font-medium">
                                        {metric.change}
                                      </span>
                                      <span className="text-sm text-gray-500 ml-1">
                                        vs last month
                                      </span>
                                    </div>
                                  </div>
                                  <div
                                    className={`bg-gradient-to-r ${metric.color} rounded-2xl p-4`}
                                  >
                                    <metric.icon className="h-8 w-8 text-white" />
                                  </div>
                                </div>
                              </ResponsiveCard>
                            </motion.div>
                          ))}
                        </div>

                        {/* Quick Actions */}
                        <ResponsiveCard className="bg-white/80 backdrop-blur-xl shadow-2xl border border-white/30 p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Quick Actions
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              onClick={() => setActiveTab("users")}
                              className="p-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl text-left"
                            >
                              <Users className="h-6 w-6 mb-2" />
                              <p className="font-medium">Manage Users</p>
                              <p className="text-sm opacity-80">
                                User roles & profiles
                              </p>
                            </motion.button>

                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              onClick={() => setActiveTab("doctors")}
                              className="p-4 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl text-left"
                            >
                              <Stethoscope className="h-6 w-6 mb-2" />
                              <p className="font-medium">Manage Doctors</p>
                              <p className="text-sm opacity-80">
                                Add or verify doctors
                              </p>
                            </motion.button>

                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              onClick={() => setActiveTab("medicines")}
                              className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-left"
                            >
                              <Pill className="h-6 w-6 mb-2" />
                              <p className="font-medium">Medicine Inventory</p>
                              <p className="text-sm opacity-80">
                                Stock & categories
                              </p>
                            </motion.button>

                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              onClick={() => setActiveTab("wishlist")}
                              className="p-4 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl text-left"
                            >
                              <Heart className="h-6 w-6 mb-2" />
                              <p className="font-medium">Wishlist Management</p>
                              <p className="text-sm opacity-80">
                                Patient wishlists
                              </p>
                            </motion.button>
                          </div>
                        </ResponsiveCard>
                      </motion.div>
                    )}
                    {/* Modular Components */}
                    {activeTab === "users" && <UserManagement />}
                    {activeTab === "doctors" && <DoctorManagement />}
                    {activeTab === "doctor-verification" && (
                      <DoctorVerificationTab />
                    )}
                    {activeTab === "medicines" && <MedicineManagement />}
                    {activeTab === "categories" && <CategoryManagement />}
                    {activeTab === "lab-packages" && <LabPackageManagement />}
                    {activeTab === "lab-tests" && <LabTestManagement />}
                    {activeTab === "orders" && <OrderManagement />}
                    {activeTab === "reviews" && <ReviewManagement />}
                    {activeTab === "specialties" && <SpecialtyManagement />}
                    {activeTab === "stock-management" && <StockManagement />}
                    {activeTab === "appointments" && <AppointmentManagement />}
                    {activeTab === "wishlist" && <WishlistManagement />}{" "}
                    {/* Add this line */}
                    {/* Placeholder for other tabs */}
                    {![
                      "overview",
                      "users",
                      "doctors",
                      "doctor-verification",
                      "medicines",
                      "categories",
                      "lab-packages",
                      "lab-tests",
                      "orders",
                      "reviews",
                      "specialties",
                      "stock-management",
                      "appointments",
                      "wishlist", // Add this line
                    ].includes(activeTab) && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                      >
                        <ResponsiveCard className="bg-white/80 backdrop-blur-xl shadow-2xl border border-white/30 p-12 text-center">
                          <div className="text-6xl mb-4">🚧</div>
                          <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            {
                              navigationItems.find(
                                (item) => item.id === activeTab
                              )?.label
                            }{" "}
                            Management
                          </h2>
                          <p className="text-gray-600 mb-6">
                            This section is under development. Full CRUD
                            functionality will be available soon.
                          </p>
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 max-w-md mx-auto">
                            <p className="text-sm text-blue-800">
                              <strong>Available CRUD Components:</strong> Users,
                              Doctors, Medicines, Appointments, and Stock
                              Management with complete Create, Read, Update,
                              Delete operations.
                            </p>
                          </div>
                          <div className="flex justify-center space-x-4">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              onClick={() => setActiveTab("overview")}
                              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg"
                            >
                              Back to Overview
                            </motion.button>
                          </div>
                        </ResponsiveCard>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ResponsiveLayout>
    </>
  );
}
