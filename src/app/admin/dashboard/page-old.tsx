"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  Users,
  UserCheck,
  Calendar,
  DollarSign,
  Activity,
  TrendingUp,
  AlertTriangle,
  Shield,
  Settings,
  Bell,
  LogOut,
  Search,
  Filter,
  Download,
  Edit,
  Eye,
  Check,
  X,
  Plus,
  Stethoscope,
  FileText,
  Pill,
  TestTube,
  BarChart3,
  Heart,
  Brain,
  Bone,
  Baby,
  Eye as EyeIcon,
  Zap,
  Sparkles,
  ArrowRight,
  Package,
  FlaskConical,
  UserPlus,
  Star,
  Clock,
  ShoppingCart,
  Truck,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import ResponsiveLayout from "@/components/ResponsiveLayout";
import {
  ResponsiveGrid,
  ResponsiveCard,
  ResponsiveButton,
  MobileOnly,
  DesktopOnly,
} from "@/components/ResponsiveComponents";
import ExportButton, { prepareExportData } from "@/components/ExportButton";
import { motion, AnimatePresence } from "framer-motion";

// Type definitions for real data
interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  patient_profile?: any;
  doctor_profile?: any;
}

interface Medicine {
  id: string;
  name: string;
  generic_name?: string;
  manufacturer?: string;
  category: string;
  strength: string;
  unit_price: number;
  stock_quantity: number;
  prescription_required: boolean;
  is_active: boolean;
}

interface LabPackage {
  id: string;
  name: string;
  description?: string;
  category: string;
  tests_included: string[];
  price: number;
  reporting_time?: string;
  is_active: boolean;
}

interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  status: string;
  scheduled_at: string;
  created_at: string;
}

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
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Real data states
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

  const [users, setUsers] = useState<User[]>([]);
  const [pendingDoctors, setPendingDoctors] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [labPackages, setLabPackages] = useState<LabPackage[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [specialties, setSpecialties] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("authToken");
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      // Fetch dashboard stats
      const statsResponse = await fetch("/api/dashboard/stats", { headers });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats || stats);
      }

      // Fetch users
      const usersResponse = await fetch("/api/admin/users", { headers });
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.users || []);
      }

      // Fetch pending doctor verifications
      const pendingDoctorsResponse = await fetch("/api/admin/doctors/pending", {
        headers,
      });
      if (pendingDoctorsResponse.ok) {
        const pendingDoctorsData = await pendingDoctorsResponse.json();
        setPendingDoctors(pendingDoctorsData.doctors || []);
      }

      // Fetch medicines
      const medicinesResponse = await fetch("/api/medicines", { headers });
      if (medicinesResponse.ok) {
        const medicinesData = await medicinesResponse.json();
        setMedicines(medicinesData.medicines || []);
      }

      // Fetch lab packages
      const labPackagesResponse = await fetch("/api/lab-packages", { headers });
      if (labPackagesResponse.ok) {
        const labPackagesData = await labPackagesResponse.json();
        setLabPackages(labPackagesData.packages || []);
      }

      // Fetch appointments
      const appointmentsResponse = await fetch("/api/appointments", {
        headers,
      });
      if (appointmentsResponse.ok) {
        const appointmentsData = await appointmentsResponse.json();
        setAppointments(appointmentsData.appointments || []);
      }

      // Fetch specialties
      const specialtiesResponse = await fetch("/api/specialties", { headers });
      if (specialtiesResponse.ok) {
        const specialtiesData = await specialtiesResponse.json();
        setSpecialties(specialtiesData.specialties || []);
      }
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-3xl shadow-2xl mb-6 mx-auto w-24 h-24 flex items-center justify-center">
            <Loader2 className="h-12 w-12 text-white animate-spin" />
          </div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Loading Dashboard...
          </h3>
          <p className="text-gray-600 mt-2">Fetching system data</p>
        </motion.div>
      </div>
    );
  }

  return (
    <ResponsiveLayout
      title="Admin Dashboard"
      user={{
        name: "Admin User",
        email: "admin@medical.com",
        role: "ADMIN",
      }}
    >
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Enhanced Animated Background */}
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
          <motion.div
            animate={{
              x: [0, 100, 0],
              y: [0, 50, 0],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 left-0 w-96 h-96 bg-blue-300/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              x: [0, -100, 0],
              y: [0, -50, 0],
            }}
            transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-0 right-0 w-96 h-96 bg-purple-300/10 rounded-full blur-3xl"
          />
        </div>

        <div className="relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Enhanced Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-8 mb-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <motion.h1
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2"
                  >
                    Admin Dashboard
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-gray-600 text-lg"
                  >
                    Monitor and manage your telemedicine platform
                  </motion.p>
                </div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center space-x-4"
                >
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search..."
                      className="pl-10 w-64 bg-white/80 backdrop-blur-sm border-white/30"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="outline"
                    className="bg-white/80 backdrop-blur-sm border-white/30"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </motion.div>
              </div>
            </motion.div>

            <div className="flex flex-col lg:flex-row gap-8">
              {/* Enhanced Sidebar */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:w-64"
              >
                <Card className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30">
                  <CardContent className="p-6">
                    <div className="text-center mb-6">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4"
                      >
                        <Shield className="h-10 w-10 text-white" />
                      </motion.div>
                      <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Admin Panel
                      </h2>
                      <p className="text-gray-600">System Management</p>
                    </div>

                    <nav className="space-y-2">
                      {[
                        { id: "overview", icon: Activity, label: "Overview" },
                        { id: "users", icon: Users, label: "User Management" },
                        {
                          id: "doctor-verification",
                          icon: UserCheck,
                          label: "Doctor Verification",
                          badge: pendingDoctors.length,
                        },
                        { id: "doctors", icon: Stethoscope, label: "Doctors" },
                        {
                          id: "appointments",
                          icon: Calendar,
                          label: "Appointments",
                        },
                        { id: "medicines", icon: Pill, label: "Medicines" },
                        {
                          id: "categories",
                          icon: Package,
                          label: "Categories",
                        },
                        {
                          id: "stock-management",
                          icon: Package,
                          label: "Stock Management",
                        },
                        {
                          id: "lab-packages",
                          icon: TestTube,
                          label: "Lab Packages",
                        },
                        {
                          id: "lab-tests",
                          icon: FlaskConical,
                          label: "Lab Tests",
                        },
                        { id: "orders", icon: ShoppingCart, label: "Orders" },
                        { id: "reviews", icon: Star, label: "Reviews" },
                        {
                          id: "specialties",
                          icon: Heart,
                          label: "Specialties",
                        },
                        {
                          id: "analytics",
                          icon: BarChart3,
                          label: "Analytics",
                        },
                      ].map((item, index) => (
                        <motion.button
                          key={item.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ x: 5, scale: 1.02 }}
                          onClick={() => setActiveTab(item.id)}
                          className={`w-full text-left px-4 py-3 rounded-2xl flex items-center transition-all duration-200 ${
                            activeTab === item.id
                              ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                              : "text-gray-700 hover:bg-white/50 hover:shadow-md"
                          }`}
                        >
                          <item.icon className="h-5 w-5 mr-3" />
                          <span className="font-medium">{item.label}</span>
                          {item.badge && (
                            <span className="ml-auto bg-white text-blue-600 text-xs px-2 py-1 rounded-full font-bold">
                              {item.badge}
                            </span>
                          )}
                        </motion.button>
                      ))}
                    </nav>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Enhanced Main Content */}
              <div className="flex-1">
                {/* Overview Tab */}
                {activeTab === "overview" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
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
                          value: `$${stats.monthlyRevenue.toLocaleString()}`,
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
                          className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-6"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600 mb-1">
                                {metric.label}
                              </p>
                              <p className="text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700">
                                {metric.value}
                              </p>
                              <p className="text-sm text-green-600 font-medium mt-1">
                                {metric.change}
                              </p>
                            </div>
                            <div
                              className={`bg-gradient-to-r ${metric.color} rounded-2xl p-3`}
                            >
                              <metric.icon className="h-6 w-6 text-white" />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Specialties Overview */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-6"
                    >
                      <h2 className="text-xl font-bold text-gray-900 mb-6">
                        Specialties Overview
                      </h2>
                      <div className="grid grid-cols-2 md:grid-3 lg:grid-cols-6 gap-4">
                        {specialties.map((specialty, index) => (
                          <motion.div
                            key={specialty.name}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 + index * 0.1 }}
                            whileHover={{ y: -5, scale: 1.05 }}
                            className="flex flex-col items-center p-4 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-white/50 cursor-pointer"
                          >
                            <div
                              className={`bg-gradient-to-r ${specialty.color} p-3 rounded-xl mb-2`}
                            >
                              <specialty.icon className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-sm font-medium text-gray-900 text-center mb-1">
                              {specialty.name}
                            </span>
                            <span className="text-xs text-gray-600">
                              {specialty.count} doctors
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Pending Verifications */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <Card className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="flex items-center text-gray-900">
                                <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
                                Pending Doctor Verifications
                              </CardTitle>
                              <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                                {pendingDoctors.length}
                              </span>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {pendingDoctors.slice(0, 3).map((doctor: any) => (
                                <motion.div
                                  key={doctor.id}
                                  whileHover={{ scale: 1.02 }}
                                  className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-200"
                                >
                                  <div className="flex items-center">
                                    <div className="text-2xl mr-3">
                                      {doctor.avatar}
                                    </div>
                                    <div>
                                      <p className="font-semibold text-gray-900">
                                        {doctor.name}
                                      </p>
                                      <p className="text-sm text-gray-600">
                                        {doctor.specialty}
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    className="bg-gradient-to-r from-blue-500 to-purple-500"
                                  >
                                    Review
                                  </Button>
                                </motion.div>
                              ))}
                            </div>
                            <Button
                              variant="outline"
                              className="w-full mt-4 rounded-2xl"
                            >
                              View All Verifications
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>

                      {/* Recent Activity */}
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        <Card className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30">
                          <CardHeader>
                            <CardTitle className="text-gray-900">
                              Recent Activity
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {[
                                {
                                  icon: UserCheck,
                                  color: "green",
                                  event: "Dr. Fatima Rahman verified",
                                  time: "2 hours ago",
                                },
                                {
                                  icon: Users,
                                  color: "blue",
                                  event: "25 new patient registrations",
                                  time: "Today",
                                },
                                {
                                  icon: Calendar,
                                  color: "purple",
                                  event: "156 appointments completed",
                                  time: "This week",
                                },
                                {
                                  icon: DollarSign,
                                  color: "green",
                                  event: "Revenue target achieved",
                                  time: "Today",
                                },
                              ].map((activity, index) => (
                                <motion.div
                                  key={index}
                                  initial={{ opacity: 0, x: 20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.5 + index * 0.1 }}
                                  className="flex items-center p-3 hover:bg-white/50 rounded-2xl transition-all duration-200"
                                >
                                  <div
                                    className={`bg-${activity.color}-100 rounded-2xl p-3 mr-4`}
                                  >
                                    <activity.icon
                                      className={`h-5 w-5 text-${activity.color}-600`}
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900">
                                      {activity.event}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {activity.time}
                                    </p>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </div>

                    {/* Platform Health */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                    >
                      {[
                        {
                          value: "99.9%",
                          label: "Platform Uptime",
                          color: "from-green-500 to-emerald-500",
                        },
                        {
                          value: 4.7, // We'll calculate this from real reviews later
                          label: "Average Rating",
                          color: "from-blue-500 to-cyan-500",
                        },
                        {
                          value: "2.3s",
                          label: "Avg Response Time",
                          color: "from-purple-500 to-violet-500",
                        },
                      ].map((health, index) => (
                        <motion.div
                          key={health.label}
                          whileHover={{ scale: 1.05 }}
                          className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-6 text-center"
                        >
                          <div
                            className={`text-3xl font-bold bg-gradient-to-r ${health.color} bg-clip-text text-transparent mb-2`}
                          >
                            {health.value}
                          </div>
                          <p className="text-gray-600 font-medium">
                            {health.label}
                          </p>
                        </motion.div>
                      ))}
                    </motion.div>
                  </motion.div>
                )}

                {/* Doctor Verification Tab */}
                {activeTab === "doctor-verification" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          Doctor Verification
                        </h1>
                        <p className="text-gray-600 mt-2">
                          Review and verify doctor applications
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {pendingDoctors.map((doctor: any, index: number) => (
                        <motion.div
                          key={doctor.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ y: -5 }}
                          className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-6"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start">
                              <motion.div
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                className="text-4xl mr-6"
                              >
                                {doctor.avatar}
                              </motion.div>
                              <div>
                                <h3 className="text-xl font-bold text-gray-900">
                                  {doctor.name}
                                </h3>
                                <p className="text-blue-600 font-medium">
                                  {doctor.specialty}
                                </p>
                                <p className="text-gray-600">
                                  {doctor.experience} years experience
                                </p>
                                <p className="text-sm text-gray-500">
                                  {doctor.email}
                                </p>
                                <div className="mt-3 space-y-2">
                                  <p className="text-sm text-gray-600">
                                    <strong>Qualifications:</strong>{" "}
                                    {doctor.qualifications.join(", ")}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    <strong>Hospital:</strong> {doctor.hospital}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    <strong>Submitted:</strong>{" "}
                                    {formatDate(doctor.submittedAt)}
                                  </p>
                                </div>
                                <div className="mt-3">
                                  <p className="text-sm text-gray-600 mb-2">
                                    Documents:
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {doctor.documents?.map(
                                      (doc: string, docIndex: number) => (
                                        <motion.span
                                          key={docIndex}
                                          whileHover={{ scale: 1.05 }}
                                          className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium border border-blue-200"
                                        >
                                          {doc}
                                        </motion.span>
                                      )
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col space-y-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Documents
                              </Button>
                              <Button
                                size="sm"
                                className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Approve
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="rounded-xl"
                              >
                                <X className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Medicines Tab */}
                {activeTab === "medicines" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          Medicine Management
                        </h1>
                        <p className="text-gray-600 mt-2">
                          Manage available medicines and their details
                        </p>
                      </div>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Medicine
                        </Button>
                      </motion.div>
                    </div>

                    <Card className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30">
                      <CardHeader>
                        <CardTitle>Medicine Database</CardTitle>
                        <CardDescription>
                          Manage available medicines and their details
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Medicine
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Category
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Price
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Stock
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Prescription
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {medicines
                                .slice(0, 10)
                                .map((medicine: Medicine) => (
                                  <tr key={medicine.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div>
                                        <div className="text-sm font-medium text-gray-900">
                                          {medicine.name}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                          {medicine.generic_name}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                          {medicine.manufacturer}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className="text-sm text-gray-900">
                                        {medicine.category}
                                      </span>
                                      <div className="text-xs text-gray-500">
                                        {medicine.strength}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {formatCurrency(
                                        Number(medicine.unit_price)
                                      )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span
                                        className={`text-sm ${
                                          medicine.stock_quantity > 100
                                            ? "text-green-600"
                                            : medicine.stock_quantity > 50
                                            ? "text-yellow-600"
                                            : "text-red-600"
                                        }`}
                                      >
                                        {medicine.stock_quantity}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span
                                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                          medicine.prescription_required
                                            ? "bg-red-100 text-red-800"
                                            : "bg-green-100 text-green-800"
                                        }`}
                                      >
                                        {medicine.prescription_required
                                          ? "Required"
                                          : "Not Required"}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="mr-2 rounded-xl"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="rounded-xl"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Lab Packages Tab */}
                {activeTab === "lab-packages" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          Lab Package Management
                        </h1>
                        <p className="text-gray-600 mt-2">
                          Manage laboratory test packages and pricing
                        </p>
                      </div>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Package
                        </Button>
                      </motion.div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {labPackages
                        .slice(0, 6)
                        .map((pkg: LabPackage, index: number) => (
                          <motion.div
                            key={pkg.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ y: -5, scale: 1.02 }}
                          >
                            <Card className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 h-full">
                              <CardHeader>
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-lg text-gray-900">
                                    {pkg.name}
                                  </CardTitle>
                                  <div className="flex items-center space-x-2">
                                    <span
                                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        pkg.is_active
                                          ? "bg-green-100 text-green-800"
                                          : "bg-gray-100 text-gray-800"
                                      }`}
                                    >
                                      {pkg.is_active ? "Active" : "Inactive"}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="rounded-xl"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                <CardDescription>
                                  {pkg.category}
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-4">
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium text-gray-700">
                                      Price:
                                    </span>
                                    <span className="text-xl font-bold text-blue-600">
                                      {formatCurrency(pkg.price)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700">
                                      Tests Included:
                                    </span>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                      {pkg.tests_included.map(
                                        (test: string, testIndex: number) => (
                                          <span
                                            key={testIndex}
                                            className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium border border-blue-200"
                                          >
                                            {test}
                                          </span>
                                        )
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                                    <span className="font-medium text-gray-700">
                                      Reporting Time:
                                    </span>
                                    <span className="text-sm text-gray-600">
                                      {pkg.reporting_time}
                                    </span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                    </div>
                  </motion.div>
                )}

                {/* User Management Tab */}
                {activeTab === "users" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          User Management
                        </h1>
                        <p className="text-gray-600 mt-2">
                          Manage all system users - patients, doctors, and
                          admins
                        </p>
                      </div>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl">
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add User
                        </Button>
                      </motion.div>
                    </div>

                    <Card className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>All Users</CardTitle>
                          <div className="flex items-center space-x-2">
                            <Input
                              placeholder="Search users..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="w-64"
                            />
                            <Button variant="outline" size="sm">
                              <Filter className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Joined
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {users
                                .filter(
                                  (user) =>
                                    user.name
                                      .toLowerCase()
                                      .includes(searchTerm.toLowerCase()) ||
                                    user.email
                                      .toLowerCase()
                                      .includes(searchTerm.toLowerCase())
                                )
                                .slice(0, 20)
                                .map((user: User) => (
                                  <tr
                                    key={user.id}
                                    className="hover:bg-gray-50"
                                  >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center">
                                        <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                          {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="ml-4">
                                          <div className="text-sm font-medium text-gray-900">
                                            {user.name}
                                          </div>
                                          <div className="text-sm text-gray-500">
                                            {user.email}
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span
                                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                          user.role === "DOCTOR"
                                            ? "bg-blue-100 text-blue-800"
                                            : user.role === "PATIENT"
                                            ? "bg-green-100 text-green-800"
                                            : "bg-purple-100 text-purple-800"
                                        }`}
                                      >
                                        {user.role}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span
                                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                          user.is_active
                                            ? "bg-green-100 text-green-800"
                                            : "bg-red-100 text-red-800"
                                        }`}
                                      >
                                        {user.is_active ? "Active" : "Inactive"}
                                      </span>
                                      {user.is_verified && (
                                        <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                          Verified
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {formatDate(user.created_at)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="rounded-xl"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="rounded-xl"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="rounded-xl text-red-600 hover:text-red-700"
                                      >
                                        {user.is_active ? (
                                          <XCircle className="h-4 w-4" />
                                        ) : (
                                          <CheckCircle className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Additional CRUD Management Tabs */}
                {activeTab === "appointments" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Appointments Management
                      </h1>
                      <ResponsiveButton className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                        <Calendar className="w-4 h-4 mr-2" />
                        Schedule Appointment
                      </ResponsiveButton>
                    </div>

                    <ResponsiveCard>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Patient
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Doctor
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Date & Time
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Status
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {appointments
                              .slice(0, 5)
                              .map((appointment, index) => (
                                <tr
                                  key={appointment.id}
                                  className="hover:bg-gray-50"
                                >
                                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    Patient #{appointment.patient_id.slice(-8)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    Dr. #{appointment.doctor_id.slice(-8)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {formatDate(appointment.scheduled_at)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                      className={`px-2 py-1 text-xs rounded-full ${
                                        appointment.status === "CONFIRMED"
                                          ? "bg-green-100 text-green-800"
                                          : "bg-yellow-100 text-yellow-800"
                                      }`}
                                    >
                                      {appointment.status}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                    <ResponsiveButton
                                      size="xs"
                                      variant="outline"
                                    >
                                      <Eye className="w-3 h-3" />
                                    </ResponsiveButton>
                                    <ResponsiveButton
                                      size="xs"
                                      variant="outline"
                                    >
                                      <Edit className="w-3 h-3" />
                                    </ResponsiveButton>
                                    <ResponsiveButton
                                      size="xs"
                                      variant="outline"
                                      className="text-red-600"
                                    >
                                      <X className="w-3 h-3" />
                                    </ResponsiveButton>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-4">
                        <ExportButton
                          data={prepareExportData(
                            appointments,
                            [
                              { key: "patient_id", label: "Patient ID" },
                              { key: "doctor_id", label: "Doctor ID" },
                              {
                                key: "scheduled_at",
                                label: "Date",
                                format: (value) => formatDate(value),
                              },
                              { key: "status", label: "Status" },
                            ],
                            "appointments-export"
                          )}
                        />
                      </div>
                    </ResponsiveCard>
                  </motion.div>
                )}

                {/* Orders Management Tab */}
                {activeTab === "orders" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Orders Management
                    </h1>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <ResponsiveCard>
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                          <Pill className="w-5 h-5 mr-2 text-blue-600" />
                          Medicine Orders
                        </h3>
                        <div className="space-y-3">
                          {[1, 2, 3, 4, 5].map((order) => (
                            <div
                              key={order}
                              className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                            >
                              <div>
                                <p className="font-medium">
                                  Order #MED00{order}
                                </p>
                                <p className="text-sm text-gray-600">
                                  3 items • $45.99
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                                  Processing
                                </span>
                                <ResponsiveButton size="xs" variant="outline">
                                  <Eye className="w-3 h-3" />
                                </ResponsiveButton>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ResponsiveCard>

                      <ResponsiveCard>
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                          <TestTube className="w-5 h-5 mr-2 text-green-600" />
                          Lab Test Orders
                        </h3>
                        <div className="space-y-3">
                          {[1, 2, 3, 4, 5].map((order) => (
                            <div
                              key={order}
                              className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                            >
                              <div>
                                <p className="font-medium">
                                  Order #LAB00{order}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Blood Test Package • $120.00
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                  Scheduled
                                </span>
                                <ResponsiveButton size="xs" variant="outline">
                                  <Eye className="w-3 h-3" />
                                </ResponsiveButton>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ResponsiveCard>
                    </div>
                  </motion.div>
                )}

                {/* Reviews Management Tab */}
                {activeTab === "reviews" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Reviews Management
                    </h1>

                    <ResponsiveGrid cols={{ default: 1, lg: 2 }}>
                      {[1, 2, 3, 4, 5, 6].map((review) => (
                        <ResponsiveCard key={review}>
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center">
                              <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full w-10 h-10 flex items-center justify-center mr-3">
                                <span className="text-white font-medium">
                                  P{review}
                                </span>
                              </div>
                              <div>
                                <h4 className="font-medium">
                                  Patient Review #{review}
                                </h4>
                                <div className="flex items-center mt-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`w-4 h-4 ${
                                        star <= 4
                                          ? "text-yellow-400 fill-current"
                                          : "text-gray-300"
                                      }`}
                                    />
                                  ))}
                                  <span className="ml-2 text-sm text-gray-600">
                                    4.0
                                  </span>
                                </div>
                              </div>
                            </div>
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                              Pending
                            </span>
                          </div>

                          <p className="text-gray-600 text-sm mb-4">
                            "Great service and very professional doctor. Highly
                            recommended!"
                          </p>

                          <div className="flex space-x-2">
                            <ResponsiveButton
                              size="sm"
                              className="bg-green-600 text-white hover:bg-green-700"
                            >
                              <Check className="w-4 h-4 mr-2" />
                              Approve
                            </ResponsiveButton>
                            <ResponsiveButton
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-600 hover:bg-red-50"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Reject
                            </ResponsiveButton>
                          </div>
                        </ResponsiveCard>
                      ))}
                    </ResponsiveGrid>
                  </motion.div>
                )}

                {/* Stock Management Tab */}
                {activeTab === "stock-management" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Stock Management
                      </h1>
                      <ResponsiveButton className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                        <Package className="w-4 h-4 mr-2" />
                        Add Stock
                      </ResponsiveButton>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <ResponsiveCard>
                        <div className="flex items-center">
                          <div className="bg-red-100 rounded-lg p-3 mr-4">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-red-600">
                              {stats.lowStockMedicines}
                            </p>
                            <p className="text-sm text-gray-600">
                              Low Stock Items
                            </p>
                          </div>
                        </div>
                      </ResponsiveCard>

                      <ResponsiveCard>
                        <div className="flex items-center">
                          <div className="bg-green-100 rounded-lg p-3 mr-4">
                            <Package className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-green-600">
                              {stats.totalMedicines}
                            </p>
                            <p className="text-sm text-gray-600">Total Items</p>
                          </div>
                        </div>
                      </ResponsiveCard>

                      <ResponsiveCard>
                        <div className="flex items-center">
                          <div className="bg-blue-100 rounded-lg p-3 mr-4">
                            <TrendingUp className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-blue-600">
                              $45,230
                            </p>
                            <p className="text-sm text-gray-600">Stock Value</p>
                          </div>
                        </div>
                      </ResponsiveCard>
                    </div>

                    <ResponsiveCard>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Medicine
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Current Stock
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Unit Price
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Status
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {medicines.slice(0, 10).map((medicine, index) => (
                              <tr
                                key={medicine.id}
                                className="hover:bg-gray-50"
                              >
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {medicine.name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {medicine.strength}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`text-sm font-medium ${
                                      medicine.stock_quantity < 10
                                        ? "text-red-600"
                                        : medicine.stock_quantity < 50
                                        ? "text-yellow-600"
                                        : "text-green-600"
                                    }`}
                                  >
                                    {medicine.stock_quantity}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  ${Number(medicine.unit_price).toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                      medicine.stock_quantity < 10
                                        ? "bg-red-100 text-red-800"
                                        : medicine.stock_quantity < 50
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-green-100 text-green-800"
                                    }`}
                                  >
                                    {medicine.stock_quantity < 10
                                      ? "Critical"
                                      : medicine.stock_quantity < 50
                                      ? "Low"
                                      : "Good"}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <ResponsiveButton
                                    size="xs"
                                    className="bg-blue-600 text-white hover:bg-blue-700"
                                  >
                                    Restock
                                  </ResponsiveButton>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </ResponsiveCard>
                  </motion.div>
                )}

                {/* Categories Management Tab */}
                {activeTab === "categories" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Categories Management
                      </h1>
                      <ResponsiveButton className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Category
                      </ResponsiveButton>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <ResponsiveCard>
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                          <Pill className="w-5 h-5 mr-2 text-blue-600" />
                          Medicine Categories
                        </h3>
                        <div className="space-y-2">
                          {[
                            "Tablets",
                            "Capsules",
                            "Syrups",
                            "Injections",
                            "Ointments",
                          ].map((category, index) => (
                            <div
                              key={category}
                              className="flex justify-between items-center p-2 bg-gray-50 rounded"
                            >
                              <span className="text-sm">{category}</span>
                              <div className="flex space-x-1">
                                <ResponsiveButton size="xs" variant="outline">
                                  <Edit className="w-3 h-3" />
                                </ResponsiveButton>
                                <ResponsiveButton
                                  size="xs"
                                  variant="outline"
                                  className="text-red-600"
                                >
                                  <X className="w-3 h-3" />
                                </ResponsiveButton>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ResponsiveCard>

                      <ResponsiveCard>
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                          <TestTube className="w-5 h-5 mr-2 text-green-600" />
                          Lab Test Categories
                        </h3>
                        <div className="space-y-2">
                          {[
                            "Blood Tests",
                            "Urine Tests",
                            "X-Ray",
                            "MRI",
                            "CT Scan",
                          ].map((category, index) => (
                            <div
                              key={category}
                              className="flex justify-between items-center p-2 bg-gray-50 rounded"
                            >
                              <span className="text-sm">{category}</span>
                              <div className="flex space-x-1">
                                <ResponsiveButton size="xs" variant="outline">
                                  <Edit className="w-3 h-3" />
                                </ResponsiveButton>
                                <ResponsiveButton
                                  size="xs"
                                  variant="outline"
                                  className="text-red-600"
                                >
                                  <X className="w-3 h-3" />
                                </ResponsiveButton>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ResponsiveCard>

                      <ResponsiveCard>
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                          <Heart className="w-5 h-5 mr-2 text-red-600" />
                          Medical Specialties
                        </h3>
                        <div className="space-y-2">
                          {[
                            "Cardiology",
                            "Neurology",
                            "Orthopedics",
                            "Pediatrics",
                            "Dermatology",
                          ].map((specialty, index) => (
                            <div
                              key={specialty}
                              className="flex justify-between items-center p-2 bg-gray-50 rounded"
                            >
                              <span className="text-sm">{specialty}</span>
                              <div className="flex space-x-1">
                                <ResponsiveButton size="xs" variant="outline">
                                  <Edit className="w-3 h-3" />
                                </ResponsiveButton>
                                <ResponsiveButton
                                  size="xs"
                                  variant="outline"
                                  className="text-red-600"
                                >
                                  <X className="w-3 h-3" />
                                </ResponsiveButton>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ResponsiveCard>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ResponsiveLayout>
  );
}
