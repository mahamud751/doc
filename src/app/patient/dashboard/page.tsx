"use client";

import NavigationHeader from "@/components/NavigationHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { socketClient } from "@/lib/socket-client";
import { formatCurrency, formatDate } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Bell,
  Calendar,
  Clock,
  Download,
  Eye,
  FileText,
  Heart,
  Loader2,
  Pill,
  Plus,
  Shield,
  TestTube,
  TrendingUp,
  User,
  Video,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import IncomingCallModal from "@/components/IncomingCallModal";

interface PatientData {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar_url?: string;
  profile?: {
    date_of_birth?: string;
    gender?: string;
    blood_group?: string;
    address?: string;
    emergency_contact?: string;
    allergies?: string[];
    medical_history?: string;
  };
}

interface Appointment {
  id: string;
  doctor: {
    id: string;
    name: string;
  };
  scheduled_at: string;
  meeting_type: string;
  status: string;
  payment_amount?: number;
  meeting_link?: string;
  symptoms?: string;
  diagnosis?: string;
  prescription?: {
    id: string;
  };
}

interface Prescription {
  id: string;
  doctor: {
    user: {
      name: string;
      id: string;
    };
  };
  appointment: {
    scheduled_at: string;
    id: string;
  };
  diagnosis: string;
  created_at: string;
  drugs?: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }>;
}

interface Order {
  id: string;
  order_type: "MEDICINE" | "TEST";
  total_amount: number;
  status: string;
  created_at: string;
  items?: Array<{
    medicine_name?: string;
    test_name?: string;
    quantity: number;
    price: number;
  }>;
}

interface DashboardStats {
  totalAppointments: number;
  completedAppointments: number;
  upcomingAppointments: number;
  totalPrescriptions: number;
  pendingAppointments?: number;
  canceledAppointments?: number;
}

export default function PatientDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState<
    Appointment[]
  >([]);
  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>(
    []
  );
  const [recentPrescriptions, setRecentPrescriptions] = useState<
    Prescription[]
  >([]);
  const [, setRecentOrders] = useState<Order[]>([]);
  // For orders tab - separate pharmacy and lab orders
  const [activeOrdersTab, setActiveOrdersTab] = useState<"pharmacy" | "lab">(
    "pharmacy"
  );
  const [pharmacyOrders, setPharmacyOrders] = useState<Order[]>([]);
  const [labOrders, setLabOrders] = useState<Order[]>([]);
  const [, setMedicalHistory] = useState<string[]>([]);
  const [, setAllergies] = useState<string[]>([]);

  const [, setNotifications] = useState<Record<string, unknown>[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  // For order details modal
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const handleAppointmentUpdate = useCallback(() => {
    // Update appointment list in real-time
    fetchDashboardData();
  }, []);

  const handleNewMessage = useCallback(() => {
    setUnreadMessages((prev) => prev + 1);
  }, []);

  const handleOrderUpdate = useCallback(() => {
    // Handle order status updates
    fetchRecentOrders();
  }, []);

  const handleNotification = useCallback(
    (notification: Record<string, unknown>) => {
      setNotifications((prev: Record<string, unknown>[]) => [
        notification,
        ...prev,
      ]);
    },
    []
  );

  useEffect(() => {
    fetchDashboardData();
    fetchRecentOrders();

    // Initialize socket connection
    const token = localStorage.getItem("authToken");
    const userId = localStorage.getItem("userId");

    if (token && userId) {
      try {
        socketClient.connect(token, userId);
        socketClient.joinNotifications();

        // Listen for appointment updates
        socketClient.on("appointment-update", handleAppointmentUpdate);
        socketClient.on("new-message", handleNewMessage);
        socketClient.on("order-update", handleOrderUpdate);
        socketClient.on("notification", handleNotification);

        // Send heartbeat periodically
        const heartbeatInterval = setInterval(() => {
          if (socketClient.isConnected()) {
            socketClient.sendHeartbeat();
          }
        }, 30000); // Every 30 seconds

        return () => {
          clearInterval(heartbeatInterval);
          socketClient.off("appointment-update", handleAppointmentUpdate);
          socketClient.off("new-message", handleNewMessage);
          socketClient.off("order-update", handleOrderUpdate);
          socketClient.off("notification", handleNotification);
          // Don't disconnect the socket here as it might be used elsewhere
        };
      } catch (error) {
        console.error("Error initializing socket connection:", error);
        // Continue with the app even if socket fails
      }
    }
  }, [
    handleAppointmentUpdate,
    handleNewMessage,
    handleOrderUpdate,
    handleNotification,
  ]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("authToken");
      if (!token) {
        window.location.href = "/auth/login";
        return;
      }

      const response = await fetch("/api/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const data = await response.json();

      setPatientData(data.patient);
      setStats(data.stats);
      setUpcomingAppointments(data.upcomingAppointments || []);
      setRecentAppointments(data.recentAppointments || []);
      setRecentPrescriptions(data.recentPrescriptions || []);

      // Set medical history and allergies from patient profile
      if (data.patient?.profile) {
        setMedicalHistory(
          data.patient.profile.medical_history
            ? [data.patient.profile.medical_history]
            : []
        );
        setAllergies(data.patient.profile.allergies || []);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load dashboard data"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentOrders = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const userId = localStorage.getItem("userId");

      if (!token || !userId) return;

      const response = await fetch(`/api/orders?patient_id=${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      const data = await response.json();
      // Separate pharmacy and lab orders
      const pharmacyOrders = data.orders.filter(
        (order: Order) => order.order_type === "MEDICINE"
      );
      const labOrders = data.orders.filter(
        (order: Order) => order.order_type === "TEST"
      );

      setPharmacyOrders(pharmacyOrders);
      setLabOrders(labOrders);
      // Keep the recent orders for backward compatibility
      setRecentOrders(data.orders.slice(0, 5));
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const handleViewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const handleDownloadInvoice = async (order: Order) => {
    try {
      // In a real implementation, this would call an API to generate and download the invoice
      // For now, we'll show an alert
      alert(`Downloading invoice for Order #${order.id.substring(0, 8)}...`);

      // In a real app, you would do something like:
      // const response = await fetch(`/api/orders/${order.id}/invoice`, {
      //   headers: {
      //     Authorization: `Bearer ${token}`,
      //   },
      // });
      // const blob = await response.blob();
      // const url = window.URL.createObjectURL(blob);
      // const a = document.createElement('a');
      // a.href = url;
      // a.download = `invoice-${order.id.substring(0, 8)}.pdf`;
      // document.body.appendChild(a);
      // a.click();
      // window.URL.revokeObjectURL(url);
      // document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading invoice:", error);
      alert("Failed to download invoice. Please try again.");
    }
  };

  const handleDownloadReport = async (order: Order) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        alert("You must be logged in to download reports.");
        return;
      }

      console.log("Downloading report for order:", order.id);

      // Show loading message
      alert("Generating report... Please wait.");

      // Call the new PDF generation API
      const response = await fetch(`/api/orders/${order.id}/generate-pdf`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      // Get the PDF blob
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lab-report-${order.id.substring(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading report:", error);
      alert(
        `Failed to download report: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const joinVideoCall = async (appointment: Appointment) => {
    try {
      // If there's a meeting link, use it directly
      if (appointment.meeting_link) {
        window.open(appointment.meeting_link, "_blank");
        return;
      }

      // Generate Agora token for video call
      const token = localStorage.getItem("authToken");
      if (!token) {
        router.push("/auth/login");
        return;
      }

      // Generate a unique channel name based on appointment ID
      const channelName = `appointment_${appointment.id}`;
      const uid = Math.floor(Math.random() * 1000000); // Generate a random UID

      const response = await fetch("/api/agora/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          channelName,
          uid,
          role: "patient",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to generate video call token"
        );
      }

      const tokenData = await response.json();

      // Validate that we have all required data
      if (!tokenData.token || !tokenData.appId || !channelName || !uid) {
        throw new Error("Missing required video call parameters");
      }

      // Redirect to video call page with token data
      const callUrl = `/patient/video-call?channel=${channelName}&token=${tokenData.token}&uid=${uid}&appId=${tokenData.appId}`;
      window.open(callUrl, "_blank");
    } catch (error) {
      console.error("Error joining video call:", error);

      // Provide more specific error messages
      let errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      if (errorMessage.includes("vendor key")) {
        errorMessage =
          "Video call service error. Please contact support or try the debugging tool.";
        // Open the debug page in a new tab to help diagnose the issue
        window.open("/agora-debug", "_blank");
      }

      alert(`Failed to join video call: ${errorMessage}. Please try again.`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center relative overflow-hidden">
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
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center relative z-10"
        >
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-3xl shadow-2xl mb-6 mx-auto w-24 h-24 flex items-center justify-center">
            <Loader2 className="h-12 w-12 text-white animate-spin" />
          </div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Loading Dashboard...
          </h3>
          <p className="text-gray-600 mt-2">Fetching your health information</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-white/30"
        >
          <div className="bg-red-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Error Loading Dashboard
          </h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={fetchDashboardData}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-full shadow-lg"
            >
              Try Again
            </Button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  if (!patientData || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-white/30"
        >
          <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-gray-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            No Data Available
          </h3>
          <p className="text-gray-600 mb-6">
            Unable to load your dashboard information
          </p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={fetchDashboardData}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-full shadow-lg"
            >
              Refresh
            </Button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  const statItems = [
    {
      title: "Upcoming Appointments",
      value: stats.upcomingAppointments,
      icon: Calendar,
      color: "from-blue-500 to-cyan-500",
      bg: "from-blue-50/90 to-cyan-50/90",
    },
    {
      title: "Active Prescriptions",
      value: stats.totalPrescriptions,
      icon: FileText,
      color: "from-green-500 to-emerald-500",
      bg: "from-green-50/90 to-emerald-50/90",
    },
    {
      title: "Lab Reports",
      value: 0, // This would need to be added to the API
      icon: TestTube,
      color: "from-purple-500 to-pink-500",
      bg: "from-purple-50/90 to-pink-50/90",
    },
    {
      title: "Completed Visits",
      value: stats.completedAppointments,
      icon: Video,
      color: "from-orange-500 to-amber-500",
      bg: "from-orange-50/90 to-amber-50/90",
    },
  ];

  const quickActions = [
    {
      title: "Book Appointment",
      icon: Calendar,
      color: "from-blue-500 to-cyan-500",
      description: "Schedule with specialist",
      link: "/doctors",
    },
    {
      title: "Order Medicines",
      icon: Pill,
      color: "from-green-500 to-emerald-500",
      description: "Get prescriptions delivered",
      link: "/medicines",
    },
    {
      title: "Lab Tests",
      icon: TestTube,
      color: "from-purple-500 to-pink-500",
      description: "Book diagnostic tests",
      link: "/lab-tests",
    },
    {
      title: "Health Records",
      icon: FileText,
      color: "from-orange-500 to-amber-500",
      description: "View medical history",
      link: "/records",
    },
  ];

  const healthMetrics = [
    {
      title: "Heart Rate",
      value: "72 bpm",
      icon: Heart,
      status: "normal",
      color: "from-red-500 to-pink-500",
    },
    {
      title: "Blood Pressure",
      value: "120/80",
      icon: Activity,
      status: "normal",
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "Blood Sugar",
      value: "98 mg/dL",
      icon: Zap,
      status: "normal",
      color: "from-green-500 to-emerald-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
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

      {/* Navigation Header */}
      <NavigationHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Enhanced Sidebar */}
          <div className="lg:w-80">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-2xl rounded-3xl overflow-hidden">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4 shadow-2xl"
                    >
                      <span className="text-3xl">
                        {patientData.name.charAt(0)}
                      </span>
                    </motion.div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {patientData.name}
                    </h2>
                    <p className="text-gray-600">
                      Patient ID:{" "}
                      <span className="font-semibold">#{patientData.id}</span>
                    </p>
                    <div className="flex items-center justify-center mt-3">
                      <Shield className="h-5 w-5 text-green-600 mr-2" />
                      <span className="text-green-600 font-semibold">
                        Verified Patient
                      </span>
                    </div>
                    {/* Notification Indicator */}
                    <div className="flex items-center justify-center space-x-2 mt-2">
                      <div className="relative">
                        <Bell className="h-5 w-5 text-gray-600" />
                        {unreadMessages > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                            {unreadMessages}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-600">
                        {unreadMessages > 0
                          ? `${unreadMessages} unread`
                          : "No new messages"}
                      </span>
                    </div>
                  </div>

                  <nav className="space-y-3">
                    {[
                      { id: "overview", label: "Overview", icon: Activity },
                      {
                        id: "appointments",
                        label: "Appointments",
                        icon: Calendar,
                      },
                      {
                        id: "prescriptions",
                        label: "Prescriptions",
                        icon: FileText,
                      },
                      {
                        id: "orders",
                        label: "Orders",
                        icon: Pill,
                      },
                      {
                        id: "lab-reports",
                        label: "Lab Reports",
                        icon: TestTube,
                      },
                      { id: "medicines", label: "Medicines", icon: Pill },
                      { id: "profile", label: "Profile", icon: User },
                    ].map((item) => (
                      <motion.button
                        key={item.id}
                        whileHover={{ x: 5, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full text-left px-4 py-4 rounded-2xl flex items-center transition-all duration-300 ${
                          activeTab === item.id
                            ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                            : "text-gray-700 hover:bg-white/50 hover:shadow-md"
                        }`}
                      >
                        <item.icon className="h-5 w-5 mr-4" />
                        <span className="font-medium">{item.label}</span>
                        {activeTab === item.id && (
                          <motion.div
                            layoutId="activeTab"
                            className="ml-auto w-2 h-2 bg-white rounded-full"
                          />
                        )}
                      </motion.button>
                    ))}
                  </nav>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Enhanced Main Content */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {/* Overview Tab */}
              {activeTab === "overview" && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  {/* Welcome Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden"
                  >
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="relative z-10">
                      <h1 className="text-4xl font-bold mb-3">
                        Welcome back, {patientData.name}! 👋
                      </h1>
                      <p className="text-blue-100 text-lg mb-6">
                        {upcomingAppointments.length > 0
                          ? `You have ${
                              upcomingAppointments.length
                            } upcoming appointment${
                              upcomingAppointments.length > 1 ? "s" : ""
                            }. Stay healthy!`
                          : "No appointments scheduled. Book your next health checkup!"}
                      </p>
                      <div className="flex items-center space-x-4">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Link href="/doctors">
                            <Button className="bg-white text-blue-600 hover:bg-gray-100 rounded-full px-6 font-semibold">
                              Book Appointment
                            </Button>
                          </Link>
                        </motion.div>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            variant="outline"
                            className="border-white text-white hover:bg-white/20 rounded-full px-6"
                          >
                            Health Tips
                          </Button>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statItems.map((stat, index) => (
                      <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 30, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -8, scale: 1.02 }}
                        className={`bg-gradient-to-br ${stat.bg} backdrop-blur-sm border border-white/30 rounded-3xl p-6 shadow-2xl cursor-pointer transition-all duration-300 hover:shadow-3xl relative overflow-hidden`}
                        onHoverStart={() => setHoveredCard(stat.title)}
                        onHoverEnd={() => setHoveredCard(null)}
                      >
                        <motion.div
                          animate={{
                            opacity:
                              hoveredCard === stat.title
                                ? [0.1, 0.2, 0.1]
                                : 0.1,
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-purple-500/10"
                        />
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-4">
                            <div
                              className={`bg-gradient-to-r ${stat.color} p-3 rounded-2xl shadow-lg`}
                            >
                              <stat.icon className="h-6 w-6 text-white" />
                            </div>
                            <motion.div
                              animate={{
                                rotate: hoveredCard === stat.title ? 360 : 0,
                              }}
                              transition={{ duration: 0.5 }}
                            >
                              <TrendingUp className="h-5 w-5 text-gray-400" />
                            </motion.div>
                          </div>
                          <p className="text-3xl font-bold text-gray-900 mb-2">
                            {stat.value}
                          </p>
                          <p className="text-gray-600 font-medium">
                            {stat.title}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Upcoming Appointments */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                      className="lg:col-span-2"
                    >
                      <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-2xl rounded-3xl overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-2xl font-bold text-gray-900">
                              Upcoming Appointments
                            </CardTitle>
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Link href="/doctors">
                                <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-full shadow-lg">
                                  <Plus className="h-4 w-4 mr-2" />
                                  Book New
                                </Button>
                              </Link>
                            </motion.div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6">
                          {upcomingAppointments.length > 0 ? (
                            <div className="space-y-4">
                              {upcomingAppointments.map(
                                (appointment, index) => (
                                  <motion.div
                                    key={appointment.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{ y: -4, scale: 1.01 }}
                                    className="flex items-center justify-between p-5 bg-white rounded-2xl shadow-lg hover:shadow-xl border border-gray-100 transition-all duration-300"
                                  >
                                    <div className="flex items-center">
                                      <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full w-12 h-12 flex items-center justify-center text-white font-bold text-lg mr-4">
                                        {appointment.doctor.name.charAt(0)}
                                      </div>
                                      <div>
                                        <h3 className="font-bold text-gray-900 text-lg">
                                          {appointment.doctor.name}
                                        </h3>
                                        <div className="flex items-center text-sm text-gray-500 mt-1">
                                          <Clock className="h-4 w-4 mr-1" />
                                          {formatDate(
                                            appointment.scheduled_at
                                          )}{" "}
                                          at{" "}
                                          {new Date(
                                            appointment.scheduled_at
                                          ).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-bold text-gray-900 text-lg">
                                        {appointment.payment_amount
                                          ? formatCurrency(
                                              appointment.payment_amount
                                            )
                                          : "N/A"}
                                      </p>
                                      <div className="mt-3">
                                        {appointment.meeting_link ? (
                                          <Link href={appointment.meeting_link}>
                                            <motion.div
                                              whileHover={{ scale: 1.05 }}
                                              whileTap={{ scale: 0.95 }}
                                            >
                                              <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-full shadow-lg">
                                                <Video className="h-4 w-4 mr-2" />
                                                Join Call
                                              </Button>
                                            </motion.div>
                                          </Link>
                                        ) : (
                                          <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-full shadow-lg">
                                            <Video className="h-4 w-4 mr-2" />
                                            Join Call
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </motion.div>
                                )
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-12">
                              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                              <p className="text-gray-600 text-lg mb-4">
                                No upcoming appointments
                              </p>
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Link href="/doctors">
                                  <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-full">
                                    Book Your First Appointment
                                  </Button>
                                </Link>
                              </motion.div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>

                    {/* Quick Actions & Health Metrics */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 }}
                      className="space-y-6"
                    >
                      {/* Quick Actions */}
                      <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-2xl rounded-3xl overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                          <CardTitle className="text-xl font-bold text-gray-900">
                            Quick Actions
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            {quickActions.map((action, index) => (
                              <motion.div
                                key={action.title}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.6 + index * 0.1 }}
                                whileHover={{ x: 5, scale: 1.02 }}
                                className="flex items-center p-4 bg-white rounded-2xl shadow-sm hover:shadow-md border border-gray-100 cursor-pointer transition-all duration-300"
                                onClick={() =>
                                  (window.location.href = action.link)
                                }
                              >
                                <div
                                  className={`bg-gradient-to-r ${action.color} p-3 rounded-2xl mr-4 shadow-lg`}
                                >
                                  <action.icon className="h-5 w-5 text-white" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900">
                                    {action.title}
                                  </h4>
                                  <p className="text-sm text-gray-600">
                                    {action.description}
                                  </p>
                                </div>
                                <ArrowRight className="h-4 w-4 text-gray-400" />
                              </motion.div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Health Metrics */}
                      <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-2xl rounded-3xl overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
                          <CardTitle className="text-xl font-bold text-gray-900">
                            Health Metrics
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            {healthMetrics.map((metric) => (
                              <div
                                key={metric.title}
                                className="flex items-center justify-between"
                              >
                                <div className="flex items-center">
                                  <div
                                    className={`bg-gradient-to-r ${metric.color} p-2 rounded-xl mr-3`}
                                  >
                                    <metric.icon className="h-4 w-4 text-white" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      {metric.title}
                                    </p>
                                    <p className="text-2xl font-bold text-gray-900">
                                      {metric.value}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                                    Normal
                                  </span>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Last updated
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="mt-4"
                          >
                            <Button
                              variant="outline"
                              className="w-full rounded-full border-2"
                            >
                              Update Metrics
                            </Button>
                          </motion.div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {/* Orders Tab */}
              {activeTab === "orders" && (
                <motion.div
                  key="orders"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h1 className="text-4xl font-bold text-gray-900">
                      My Orders
                    </h1>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Link href="/medicines">
                        <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-full shadow-lg">
                          <Plus className="h-4 w-4 mr-2" />
                          New Order
                        </Button>
                      </Link>
                    </motion.div>
                  </div>

                  {/* Orders Tab Navigation */}
                  <div className="flex border-b border-gray-200">
                    <button
                      className={`px-4 py-2 font-medium text-sm rounded-t-lg ${
                        activeOrdersTab === "pharmacy"
                          ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                      onClick={() => setActiveOrdersTab("pharmacy")}
                    >
                      <div className="flex items-center">
                        <Pill className="w-4 h-4 mr-2" />
                        Pharmacy ({pharmacyOrders.length})
                      </div>
                    </button>
                    <button
                      className={`px-4 py-2 font-medium text-sm rounded-t-lg ${
                        activeOrdersTab === "lab"
                          ? "text-purple-600 border-b-2 border-purple-600 bg-purple-50"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                      onClick={() => setActiveOrdersTab("lab")}
                    >
                      <div className="flex items-center">
                        <TestTube className="w-4 h-4 mr-2" />
                        Lab Tests ({labOrders.length})
                      </div>
                    </button>
                  </div>

                  {/* Orders Content */}
                  <div className="space-y-6">
                    {activeOrdersTab === "pharmacy" ? (
                      pharmacyOrders.length > 0 ? (
                        pharmacyOrders.map((order, index) => (
                          <motion.div
                            key={order.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ y: -5, scale: 1.01 }}
                          >
                            <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-2xl rounded-3xl overflow-hidden hover:shadow-3xl transition-all duration-300">
                              <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full w-16 h-16 flex items-center justify-center text-white font-bold text-xl mr-6">
                                      <Pill className="h-8 w-8" />
                                    </div>
                                    <div>
                                      <h3 className="text-xl font-bold text-gray-900">
                                        Order #{order.id.substring(0, 8)}
                                      </h3>
                                      <p className="text-gray-600">
                                        Medicine Order
                                      </p>
                                      <p className="text-sm text-gray-500">
                                        {formatDate(order.created_at)}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right space-y-2">
                                    <div>
                                      <span
                                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                          order.status === "PENDING"
                                            ? "bg-yellow-100 text-yellow-800"
                                            : order.status === "PROCESSING"
                                            ? "bg-blue-100 text-blue-800"
                                            : order.status === "DELIVERED"
                                            ? "bg-green-100 text-green-800"
                                            : "bg-gray-100 text-gray-800"
                                        }`}
                                      >
                                        {order.status}
                                      </span>
                                    </div>
                                    <p className="text-xl font-bold text-gray-900">
                                      {formatCurrency(order.total_amount)}
                                    </p>
                                  </div>
                                </div>

                                {order.items && order.items.length > 0 && (
                                  <div className="mt-6 pt-6 border-t border-gray-200">
                                    <h4 className="font-bold text-gray-900 mb-3">
                                      Items:
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {order.items.map((item, index) => (
                                        <div
                                          key={index}
                                          className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                                        >
                                          <span className="font-medium text-gray-900">
                                            {item.medicine_name ||
                                              item.test_name ||
                                              "Item"}
                                          </span>
                                          <span className="text-gray-600">
                                            Qty: {item.quantity} × $
                                            {Number(item.price || 0).toFixed(2)}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div className="mt-6 flex space-x-3">
                                  <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="rounded-full border-2"
                                      onClick={() =>
                                        handleViewOrderDetails(order)
                                      }
                                    >
                                      <Eye className="h-4 w-4 mr-2" />
                                      View Details
                                    </Button>
                                  </motion.div>
                                  <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <Button
                                      size="sm"
                                      className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-full shadow-lg"
                                      onClick={() =>
                                        handleDownloadInvoice(order)
                                      }
                                    >
                                      <Download className="h-4 w-4 mr-2" />
                                      Download Invoice
                                    </Button>
                                  </motion.div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))
                      ) : (
                        <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-2xl rounded-3xl overflow-hidden">
                          <CardContent className="p-12 text-center">
                            <Pill className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">
                              No Pharmacy Orders Yet
                            </h3>
                            <p className="text-gray-600 mb-6">
                              You haven&apos;t placed any pharmacy orders yet.
                              Start by ordering medicines.
                            </p>
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Link href="/medicines">
                                <Button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-500 rounded-full">
                                  Order Medicines
                                </Button>
                              </Link>
                            </motion.div>
                          </CardContent>
                        </Card>
                      )
                    ) : labOrders.length > 0 ? (
                      labOrders.map((order, index) => (
                        <motion.div
                          key={order.id}
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ y: -5, scale: 1.01 }}
                        >
                          <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-2xl rounded-3xl overflow-hidden hover:shadow-3xl transition-all duration-300">
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full w-16 h-16 flex items-center justify-center text-white font-bold text-xl mr-6">
                                    <TestTube className="h-8 w-8" />
                                  </div>
                                  <div>
                                    <h3 className="text-xl font-bold text-gray-900">
                                      Order #{order.id.substring(0, 8)}
                                    </h3>
                                    <p className="text-gray-600">
                                      Lab Test Order
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      {formatDate(order.created_at)}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right space-y-2">
                                  <div>
                                    <span
                                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                        order.status === "PENDING"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : order.status === "PROCESSING"
                                          ? "bg-blue-100 text-blue-800"
                                          : order.status === "DELIVERED"
                                          ? "bg-green-100 text-green-800"
                                          : "bg-gray-100 text-gray-800"
                                      }`}
                                    >
                                      {order.status}
                                    </span>
                                  </div>
                                  <p className="text-xl font-bold text-gray-900">
                                    {formatCurrency(order.total_amount)}
                                  </p>
                                </div>
                              </div>

                              {order.items && order.items.length > 0 && (
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                  <h4 className="font-bold text-gray-900 mb-3">
                                    {order.items &&
                                    order.items.length > 0 &&
                                    order.items[0].test_name
                                      ?.toLowerCase()
                                      .includes("package")
                                      ? "Package"
                                      : "Tests"}
                                    :
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {order.items.map((item, index) => (
                                      <div
                                        key={index}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                                      >
                                        <span className="font-medium text-gray-900">
                                          {item.test_name || "Lab Test"}
                                        </span>
                                        <span className="text-gray-600">
                                          ${Number(item.price || 0).toFixed(2)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="mt-6 flex space-x-3">
                                <motion.div
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-full border-2"
                                    onClick={() =>
                                      handleViewOrderDetails(order)
                                    }
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </Button>
                                </motion.div>
                                <motion.div
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Button
                                    size="sm"
                                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-full shadow-lg"
                                    onClick={() => handleDownloadReport(order)}
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download Report
                                  </Button>
                                </motion.div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))
                    ) : (
                      <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-2xl rounded-3xl overflow-hidden">
                        <CardContent className="p-12 text-center">
                          <TestTube className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            No Lab Test Orders Yet
                          </h3>
                          <p className="text-gray-600 mb-6">
                            You haven&apos;t placed any lab test orders yet.
                            Start by booking lab tests.
                          </p>
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Link href="/lab-tests">
                              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-full">
                                Book Lab Tests
                              </Button>
                            </Link>
                          </motion.div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Appointments Tab */}
              {activeTab === "appointments" && (
                <motion.div
                  key="appointments"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h1 className="text-4xl font-bold text-gray-900">
                      My Appointments
                    </h1>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Link href="/doctors">
                        <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-full shadow-lg">
                          <Plus className="h-4 w-4 mr-2" />
                          Book New Appointment
                        </Button>
                      </Link>
                    </motion.div>
                  </div>

                  <div className="space-y-6">
                    {recentAppointments.map((appointment, index) => (
                      <motion.div
                        key={appointment.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -5, scale: 1.01 }}
                      >
                        <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-2xl rounded-3xl overflow-hidden hover:shadow-3xl transition-all duration-300">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full w-16 h-16 flex items-center justify-center text-white font-bold text-xl mr-6">
                                  {appointment.doctor.name.charAt(0)}
                                </div>
                                <div>
                                  <h3 className="text-xl font-bold text-gray-900">
                                    {appointment.doctor.name}
                                  </h3>
                                  <div className="flex items-center text-gray-600 mt-3 space-x-4">
                                    <div className="flex items-center">
                                      <Calendar className="h-4 w-4 mr-2" />
                                      {formatDate(
                                        appointment.scheduled_at
                                      )} at{" "}
                                      {new Date(
                                        appointment.scheduled_at
                                      ).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </div>
                                    <div className="flex items-center">
                                      <Video className="h-4 w-4 mr-2" />
                                      {appointment.meeting_type}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right space-y-4">
                                <div>
                                  <span
                                    className={`px-4 py-2 rounded-full text-sm font-semibold ${
                                      appointment.status === "PENDING" ||
                                      appointment.status === "CONFIRMED"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {appointment.status}
                                  </span>
                                </div>
                                <p className="text-xl font-bold text-gray-900">
                                  {appointment.payment_amount
                                    ? formatCurrency(appointment.payment_amount)
                                    : "N/A"}
                                </p>
                                {appointment.status === "PENDING" ||
                                appointment.status === "CONFIRMED" ? (
                                  <div className="space-y-3">
                                    {appointment.meeting_link ? (
                                      <Link href={appointment.meeting_link}>
                                        <motion.div
                                          whileHover={{ scale: 1.05 }}
                                          whileTap={{ scale: 0.95 }}
                                        >
                                          <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-full shadow-lg">
                                            <Video className="h-4 w-4 mr-2" />
                                            Join Call
                                          </Button>
                                        </motion.div>
                                      </Link>
                                    ) : (
                                      <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                      >
                                        <Button
                                          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-full shadow-lg"
                                          onClick={() =>
                                            joinVideoCall(appointment)
                                          }
                                        >
                                          <Video className="h-4 w-4 mr-2" />
                                          Join Call
                                        </Button>
                                      </motion.div>
                                    )}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="w-full rounded-full"
                                    >
                                      Reschedule
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="w-full rounded-full"
                                    >
                                      <Eye className="h-4 w-4 mr-2" />
                                      View Details
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Prescriptions Tab */}
              {activeTab === "prescriptions" && (
                <motion.div
                  key="prescriptions"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <h1 className="text-4xl font-bold text-gray-900">
                    My Prescriptions
                  </h1>

                  <div className="space-y-6">
                    {recentPrescriptions.map((prescription, index) => (
                      <motion.div
                        key={prescription.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -5, scale: 1.01 }}
                      >
                        <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-2xl rounded-3xl overflow-hidden hover:shadow-3xl transition-all duration-300">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-6">
                              <div>
                                <h3 className="text-2xl font-bold text-gray-900">
                                  Prescription #
                                  {prescription.id.substring(0, 8)}
                                </h3>
                                <p className="text-gray-600">
                                  By{" "}
                                  <span className="font-semibold">
                                    {prescription.doctor.user.name}
                                  </span>
                                </p>
                                <p className="text-sm text-gray-500">
                                  {formatDate(
                                    prescription.appointment.scheduled_at
                                  )}
                                </p>
                              </div>
                              <div className="flex space-x-3">
                                <motion.div
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-full border-2"
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View
                                  </Button>
                                </motion.div>
                                <motion.div
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Button
                                    size="sm"
                                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-full shadow-lg"
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                  </Button>
                                </motion.div>
                              </div>
                            </div>

                            <div className="mb-6">
                              <h4 className="font-bold text-gray-900 text-lg mb-3">
                                Diagnosis
                              </h4>
                              <p className="text-gray-700 bg-blue-50 rounded-2xl p-4">
                                {prescription.diagnosis}
                              </p>
                            </div>

                            <div className="mb-6">
                              <h4 className="font-bold text-gray-900 text-lg mb-3">
                                Medicines
                              </h4>
                              <div className="space-y-3">
                                <motion.div
                                  whileHover={{ x: 5 }}
                                  className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-gray-100"
                                >
                                  <div className="flex items-center">
                                    <div className="bg-green-100 p-3 rounded-2xl mr-4">
                                      <Pill className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                      <p className="font-semibold text-gray-900">
                                        Medication Information
                                      </p>
                                      <p className="text-sm text-gray-600">
                                        See prescription details for complete
                                        medication list
                                      </p>
                                    </div>
                                  </div>
                                  <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="mt-2"
                                  >
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="rounded-full"
                                    >
                                      <Pill className="h-4 w-4 mr-1" />
                                      Order
                                    </Button>
                                  </motion.div>
                                </motion.div>
                              </div>

                              <div>
                                <h4 className="font-bold text-gray-900 text-lg mb-3">
                                  Instructions
                                </h4>
                                <p className="text-gray-700 bg-gray-50 rounded-2xl p-4">
                                  Follow the prescribed medication schedule and
                                  consult your doctor if you have any concerns.
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Order Details Modal */}
              {showOrderDetails && selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">
                          Order Details
                        </h2>
                        <button
                          onClick={() => setShowOrderDetails(false)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <X className="h-6 w-6" />
                        </button>
                      </div>

                      <div className="space-y-6">
                        {/* Order Header */}
                        <div className="flex items-center p-4 bg-gray-50 rounded-2xl">
                          <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full w-16 h-16 flex items-center justify-center text-white font-bold text-xl mr-4">
                            {selectedOrder.order_type === "MEDICINE" ? (
                              <Pill className="h-8 w-8" />
                            ) : (
                              <TestTube className="h-8 w-8" />
                            )}
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">
                              Order #{selectedOrder.id.substring(0, 8)}
                            </h3>
                            <p className="text-gray-600">
                              {selectedOrder.order_type === "MEDICINE"
                                ? "Medicine Order"
                                : "Lab Test Order"}
                            </p>
                          </div>
                        </div>

                        {/* Order Information */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Order Date
                            </label>
                            <p className="text-gray-900">
                              {formatDate(selectedOrder.created_at)}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Status
                            </label>
                            <span
                              className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${
                                selectedOrder.status === "PENDING"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : selectedOrder.status === "PROCESSING"
                                  ? "bg-blue-100 text-blue-800"
                                  : selectedOrder.status === "DELIVERED"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {selectedOrder.status}
                            </span>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Total Amount
                            </label>
                            <p className="text-xl font-bold text-gray-900">
                              {formatCurrency(selectedOrder.total_amount)}
                            </p>
                          </div>
                          {selectedOrder.order_type === "TEST" && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Order Type
                              </label>
                              <p className="text-gray-900">Lab Test/Package</p>
                            </div>
                          )}
                        </div>

                        {/* Order Items */}
                        {selectedOrder.items &&
                          selectedOrder.items.length > 0 && (
                            <div>
                              <h4 className="font-bold text-gray-900 text-lg mb-3">
                                {selectedOrder.order_type === "MEDICINE"
                                  ? "Medicines"
                                  : selectedOrder.items &&
                                    selectedOrder.items.length > 0 &&
                                    selectedOrder.items[0].test_name
                                      ?.toLowerCase()
                                      .includes("package")
                                  ? "Package"
                                  : "Test"}
                              </h4>
                              <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                                {selectedOrder.items.map((item, index) => (
                                  <div
                                    key={index}
                                    className="flex justify-between items-center p-3 bg-white rounded-xl border border-gray-200"
                                  >
                                    <div>
                                      <p className="font-medium text-gray-900">
                                        {item.medicine_name ||
                                          item.test_name ||
                                          "Item"}
                                      </p>
                                      <p className="text-sm text-gray-600">
                                        {selectedOrder.order_type === "MEDICINE"
                                          ? `Quantity: ${item.quantity}`
                                          : `Price: ${formatCurrency(
                                              item.price || 0
                                            )}`}
                                      </p>
                                    </div>
                                    <p className="font-semibold text-gray-900">
                                      {selectedOrder.order_type === "MEDICINE"
                                        ? formatCurrency(
                                            (item.price || 0) * item.quantity
                                          )
                                        : formatCurrency(item.price || 0)}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        {/* Action Buttons */}
                        <div className="flex space-x-3 pt-4">
                          <Button
                            variant="outline"
                            className="flex-1 rounded-full"
                            onClick={() => setShowOrderDetails(false)}
                          >
                            Close
                          </Button>
                          <Button
                            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-full"
                            onClick={() => {
                              if (selectedOrder.order_type === "MEDICINE") {
                                handleDownloadInvoice(selectedOrder);
                              } else {
                                handleDownloadReport(selectedOrder);
                              }
                              setShowOrderDetails(false);
                            }}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            {selectedOrder.order_type === "MEDICINE"
                              ? "Download Invoice"
                              : "Download Report"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
