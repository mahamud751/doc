"use client";

import AppointmentManagement from "@/components/doctor/AppointmentManagement";
import NavigationHeader from "@/components/NavigationHeader";
import DoctorPatientList from "@/components/patient/PatientListWithAppointments";
import PrescriptionCreator from "@/components/doctor/PrescriptionCreator";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { agoraCallingService } from "@/lib/agora-calling-service";
import { callNotifications } from "@/lib/call-notifications";
import { formatCurrency, formatDate } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Award,
  Calendar,
  Clock,
  Clock4,
  DollarSign,
  Download,
  Edit,
  FileText,
  Loader2,
  Phone,
  Plus,
  Settings,
  Star,
  Stethoscope,
  TrendingUp,
  User,
  Users,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import IncomingCallModal from "@/components/IncomingCallModal";
import { callingService, ActiveCall } from "@/lib/calling-service";
import OutgoingCallIndicator from "@/components/OutgoingCallIndicator";
import IncomingCallsDisplay from "@/components/IncomingCallsDisplay";

// Define interfaces for the data structures
interface DoctorProfile {
  specialties?: string[];
  date_of_birth?: string;
  gender?: string;
  verification_status?: string;
}

interface DoctorData {
  id: string;
  name: string;
  email: string;
  phone: string;
  profile?: DoctorProfile;
  verification_status?: string;
}

interface Appointment {
  id: string;
  patient: {
    id: string;
    name: string;
    patient_profile?: {
      date_of_birth?: string;
      gender?: string;
    };
  };
  scheduled_at: string;
  meeting_type: string;
  status: string;
  payment_amount?: number;
  meeting_link?: string;
  symptoms?: string;
  diagnosis?: string;
  prescription_given?: boolean;
  rating?: number;
  duration_minutes?: number;
}

interface DashboardStats {
  todayAppointments: number;
  totalPatients: number;
  pendingAppointments: number;
  rating: number;
  totalReviews: number;
  totalRevenue: number;
}

export default function DoctorDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [doctorData, setDoctorData] = useState<DoctorData | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState<
    Appointment[]
  >([]);
  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>(
    []
  );
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [notifications, setNotifications] = useState<Record<string, unknown>[]>(
    []
  );
  const [onlineStatus, setOnlineStatus] = useState<"online" | "busy" | "away">(
    "online"
  );

  // Define interface for schedule data
  interface ScheduleDay {
    id: number;
    day: string;
    slots: string[];
  }

  // State for schedule data
  const [scheduleData, setScheduleData] = useState<ScheduleDay[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState("");

  // Fetch doctor's schedule data
  const fetchDoctorSchedule = async () => {
    try {
      setScheduleLoading(true);
      setScheduleError("");

      const token = localStorage.getItem("authToken");
      if (!token) {
        setScheduleError("Authentication required");
        return;
      }

      const response = await fetch(
        `/api/admin/doctors/schedule?doctor_id=${doctorData?.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch schedule data");
      }

      const data = await response.json();

      // Process the schedule data to group by day of week
      const processedSchedule = processScheduleData(data.slots);
      setScheduleData(processedSchedule);
    } catch (err) {
      console.error("Error fetching schedule:", err);
      setScheduleError("Failed to load schedule data");
    } finally {
      setScheduleLoading(false);
    }
  };

  // Process schedule data to group by day of week
  const processScheduleData = (slots: any[]) => {
    // Initialize schedule for all days
    const daysOfWeek: ScheduleDay[] = [
      { id: 0, day: "Sunday", slots: [] },
      { id: 1, day: "Monday", slots: [] },
      { id: 2, day: "Tuesday", slots: [] },
      { id: 3, day: "Wednesday", slots: [] },
      { id: 4, day: "Thursday", slots: [] },
      { id: 5, day: "Friday", slots: [] },
      { id: 6, day: "Saturday", slots: [] },
    ];

    // Group slots by day of week
    const recurringSlots = slots.filter((slot: any) => slot.is_recurring);

    recurringSlots.forEach((slot: any) => {
      const startDate = new Date(slot.start_time);
      const dayOfWeek = startDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const startTime = startDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      const endDate = new Date(slot.end_time);
      const endTime = endDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      const dayEntry = daysOfWeek.find((day) => day.id === dayOfWeek);
      if (dayEntry) {
        dayEntry.slots.push(`${startTime} - ${endTime}`);
      }
    });

    // Mark days with no slots as "Closed"
    daysOfWeek.forEach((day) => {
      if (day.slots.length === 0) {
        day.slots = ["Closed"];
      }
    });

    return daysOfWeek;
  };

  // Fetch schedule when doctor data is available
  useEffect(() => {
    if (doctorData?.id && activeTab === "schedule") {
      fetchDoctorSchedule();
    }
  }, [doctorData?.id, activeTab]);

  // Use ref to store current doctorData for socket event handlers
  const doctorDataRef = useRef<DoctorData | null>(doctorData);

  // Update ref whenever doctorData changes
  useEffect(() => {
    doctorDataRef.current = doctorData;
  }, [doctorData]);

  const fetchDashboardData = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) {
          setLoading(true);
        }
        const token = localStorage.getItem("authToken");
        const userId = localStorage.getItem("userId");

        if (!token || !userId) {
          router.push("/auth/login");
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
        setDoctorData(data.doctor);
        setStats(data.stats);
        setUpcomingAppointments(data.upcomingAppointments || []);
        setRecentAppointments(data.recentAppointments || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard data"
        );
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [router]
  );

  useEffect(() => {
    fetchDashboardData(true); // Show loading for initial load

    // Refresh data every 5 minutes without showing loading spinner
    const refreshInterval = setInterval(() => {
      fetchDashboardData(false); // Don't show loading for periodic refreshes
    }, 300000); // Refresh every 5 minutes (300000 ms)

    return () => {
      clearInterval(refreshInterval);
    };
  }, [fetchDashboardData]); // Removed doctorData from dependencies

  const updateDoctorStatus = (status: "online" | "busy" | "away") => {
    setOnlineStatus(status);
    // With Agora-only approach, status is just local UI state
    console.log(`Doctor status updated to: ${status}`);
  };

  // Filter today's appointments
  const todayAppointments = recentAppointments.filter((appointment) => {
    const today = new Date();
    const appointmentDate = new Date(appointment.scheduled_at);
    return (
      appointmentDate.getDate() === today.getDate() &&
      appointmentDate.getMonth() === today.getMonth() &&
      appointmentDate.getFullYear() === today.getFullYear()
    );
  });

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
          <p className="text-gray-600 mt-2">
            Fetching your practice information
          </p>
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
            <Stethoscope className="w-10 h-10 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Error Loading Dashboard
          </h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => fetchDashboardData()}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-full shadow-lg"
            >
              Try Again
            </Button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  if (!doctorData || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-white/30"
        >
          <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <Stethoscope className="w-10 h-10 text-gray-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            No Data Available
          </h3>
          <p className="text-gray-600 mb-6">
            Unable to load your dashboard information
          </p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => fetchDashboardData()}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-500 rounded-full shadow-lg"
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
      title: "Today&apos;s Appointments",
      value: stats.todayAppointments,
      icon: Calendar,
      color: "from-blue-500 to-cyan-500",
      bg: "from-blue-50/90 to-cyan-50/90",
    },
    {
      title: "Total Patients",
      value: stats.totalPatients,
      icon: Users,
      color: "from-green-500 to-emerald-500",
      bg: "from-green-50/90 to-emerald-50/90",
    },
    {
      title: "Pending Appointments",
      value: stats.pendingAppointments,
      icon: AlertCircle,
      color: "from-yellow-500 to-orange-500",
      bg: "from-yellow-50/90 to-orange-50/90",
    },
    {
      title: "Rating",
      value: stats.rating,
      icon: Star,
      color: "from-amber-500 to-yellow-500",
      bg: "from-amber-50/90 to-yellow-50/90",
    },
    {
      title: "Monthly Earnings",
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: "from-purple-500 to-pink-500",
      bg: "from-purple-50/90 to-pink-50/90",
    },
  ];

  const actionItems = [
    {
      title: "Appointment Requests",
      icon: Calendar,
      color: "from-blue-500 to-cyan-500",
      description: "Review pending appointments",
    },
    {
      title: "Patient Messages",
      icon: Phone,
      color: "from-purple-500 to-pink-500",
      description: "Check patient inquiries",
    },
    {
      title: "Profile Settings",
      icon: Settings,
      color: "from-orange-500 to-amber-500",
      description: "Update profile info",
    },
  ];

  // Define interface for schedule data
  interface ScheduleDay {
    id: number;
    day: string;
    slots: string[];
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 mt-20">
      <NavigationHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                      <Stethoscope className="h-12 w-12 text-white" />
                    </motion.div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {doctorData.name}
                    </h2>
                    <p className="text-blue-600 font-semibold">
                      {doctorData.profile?.specialties?.[0] ||
                        "General Physician"}
                    </p>
                    <div className="flex items-center justify-center mt-3">
                      <Star className="h-5 w-5 text-yellow-400 fill-current" />
                      <span className="ml-2 font-semibold">{stats.rating}</span>
                      <span className="ml-1 text-gray-500">
                        ({stats.totalReviews})
                      </span>
                    </div>
                    {doctorData.verification_status === "APPROVED" && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center justify-center mt-3"
                      >
                        <Award className="h-5 w-5 text-green-600 mr-2" />
                        <span className="text-green-600 font-semibold">
                          Verified Doctor
                        </span>
                      </motion.div>
                    )}
                    {/* Online Status Controls */}
                    <div className="flex items-center justify-center space-x-2 mt-4">
                      <Button
                        onClick={() => updateDoctorStatus("online")}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          onlineStatus === "online"
                            ? "bg-green-500 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-green-100"
                        }`}
                      >
                        Online
                      </Button>
                      <Button
                        onClick={() => updateDoctorStatus("busy")}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          onlineStatus === "busy"
                            ? "bg-yellow-500 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-yellow-100"
                        }`}
                      >
                        Busy
                      </Button>
                      <Button
                        onClick={() => updateDoctorStatus("away")}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          onlineStatus === "away"
                            ? "bg-red-500 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-red-100"
                        }`}
                      >
                        Away
                      </Button>
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
                        id: "incoming-calls",
                        label: "Incoming Calls",
                        icon: Phone,
                      },
                      { id: "patients", label: "My Patients", icon: Users },
                      { id: "schedule", label: "Schedule", icon: Clock },
                      {
                        id: "prescriptions",
                        label: "Prescriptions",
                        icon: FileText,
                      },
                      { id: "earnings", label: "Earnings", icon: DollarSign },
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
                        Good morning, Dr.{" "}
                        {doctorData.name.split(" ")[1] || doctorData.name}! 👋
                      </h1>
                      <p className="text-blue-100 text-lg mb-6">
                        {todayAppointments.length > 0
                          ? `You have ${todayAppointments.length} appointments today. Ready to make a difference!`
                          : "No appointments scheduled for today. Enjoy your day!"}
                      </p>
                      <div className="flex items-center space-x-4">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button className="bg-white text-blue-600 hover:bg-gray-100 rounded-full px-6 font-semibold">
                            View Today&apos;s Schedule
                          </Button>
                        </motion.div>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            variant="outline"
                            className="border-white text-white hover:bg-white/20 rounded-full px-6"
                          >
                            Quick Actions
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
                    {/* Today's Appointments */}
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
                              Today&apos;s Appointments
                            </CardTitle>
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-full shadow-lg">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Slot
                              </Button>
                            </motion.div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6">
                          {todayAppointments.length > 0 ? (
                            <div className="space-y-4">
                              {todayAppointments.map((appointment, index) => (
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
                                      {appointment.patient.name.charAt(0)}
                                    </div>
                                    <div>
                                      <h3 className="font-bold text-gray-900 text-lg">
                                        {appointment.patient.name}
                                      </h3>
                                      <p className="text-gray-600">
                                        {appointment.patient.patient_profile
                                          ?.date_of_birth
                                          ? `${
                                              new Date().getFullYear() -
                                              new Date(
                                                appointment.patient.patient_profile.date_of_birth
                                              ).getFullYear()
                                            } years`
                                          : "N/A"}{" "}
                                        •{" "}
                                        {appointment.patient.patient_profile
                                          ?.gender || "N/A"}
                                      </p>
                                      <div className="flex items-center text-sm text-gray-500 mt-1">
                                        <Clock className="h-4 w-4 mr-1" />
                                        {new Date(
                                          appointment.scheduled_at
                                        ).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </div>
                                      {appointment.symptoms && (
                                        <p className="text-sm text-gray-600 mt-2">
                                          <strong>Symptoms:</strong>{" "}
                                          {appointment.symptoms}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span
                                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                        appointment.status === "PENDING" ||
                                        appointment.status === "CONFIRMED"
                                          ? "bg-green-100 text-green-800"
                                          : "bg-gray-100 text-gray-800"
                                      }`}
                                    >
                                      {appointment.status}
                                    </span>
                                    <div className="mt-3">
                                      {appointment.meeting_link ? (
                                        <Link href={appointment.meeting_link}>
                                          <motion.div
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                          >
                                            <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-full shadow-lg">
                                              <Video className="h-4 w-4 mr-2" />
                                              Start Call
                                            </Button>
                                          </motion.div>
                                        </Link>
                                      ) : (
                                        <div className="text-center py-3">
                                          <p className="text-gray-600 text-sm">
                                            📞 Patient can call you
                                          </p>
                                          <p className="text-gray-500 text-xs mt-1">
                                            Check "Incoming Calls" tab for
                                            real-time notifications
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-12">
                              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                              <p className="text-gray-600 text-lg">
                                No appointments scheduled for today
                              </p>
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="mt-4"
                              >
                                <Button className="rounded-full">
                                  Schedule Appointment
                                </Button>
                              </motion.div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>

                    {/* Quick Actions & Recent Activity */}
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
                            {actionItems.map((action, index) => (
                              <motion.div
                                key={action.title}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.6 + index * 0.1 }}
                                whileHover={{ x: 5, scale: 1.02 }}
                                className="flex items-center p-4 bg-white rounded-2xl shadow-sm hover:shadow-md border border-gray-100 cursor-pointer transition-all duration-300"
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

                      {/* Next Appointment */}
                      <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-2xl rounded-3xl overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
                          <CardTitle className="text-xl font-bold text-gray-900">
                            Next Appointment
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                          {upcomingAppointments.length > 0 ? (
                            <div className="text-center">
                              <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full w-16 h-16 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
                                {upcomingAppointments[0].patient.name.charAt(0)}
                              </div>
                              <h3 className="font-bold text-gray-900 text-lg mb-2">
                                {upcomingAppointments[0].patient.name}
                              </h3>
                              <p className="text-gray-600 mb-4">
                                {upcomingAppointments[0].patient.patient_profile
                                  ?.date_of_birth
                                  ? `${
                                      new Date().getFullYear() -
                                      new Date(
                                        upcomingAppointments[0].patient.patient_profile.date_of_birth
                                      ).getFullYear()
                                    } years`
                                  : "N/A"}{" "}
                                •{" "}
                                {upcomingAppointments[0].patient.patient_profile
                                  ?.gender || "N/A"}
                              </p>
                              <div className="bg-blue-50 rounded-2xl p-4 mb-4">
                                <div className="flex items-center justify-center text-blue-600 font-semibold">
                                  <Clock4 className="h-5 w-5 mr-2" />
                                  {new Date(
                                    upcomingAppointments[0].scheduled_at
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                  {formatDate(
                                    upcomingAppointments[0].scheduled_at
                                  )}
                                </p>
                              </div>
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <div className="w-full text-center py-3 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-full">
                                  <p className="text-blue-800 font-semibold text-sm">
                                    📞 Patient will call you
                                  </p>
                                  <p className="text-blue-600 text-xs">
                                    Check "Incoming Calls" tab
                                  </p>
                                </div>
                              </motion.div>
                            </div>
                          ) : (
                            <div className="text-center py-6">
                              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                              <p className="text-gray-600">
                                You don&apos;t have any upcoming appointments.
                              </p>
                              <p className="text-gray-600">
                                When patients book appointments, they&apos;ll
                                appear here.
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
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
                  <AppointmentManagement
                    doctorId={doctorData?.id || ""}
                    doctorName={doctorData?.name || ""}
                  />
                </motion.div>
              )}

              {/* Incoming Calls Tab */}
              {activeTab === "incoming-calls" && (
                <motion.div
                  key="incoming-calls"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-4xl font-bold text-gray-900">
                        📞 Incoming Calls
                      </h1>
                      <p className="text-gray-600 mt-2">
                        Receive and manage patient call requests in real-time
                      </p>
                    </div>
                  </div>

                  <IncomingCallsDisplay userRole="DOCTOR" />
                </motion.div>
              )}

              {/* Schedule Tab */}
              {activeTab === "schedule" && (
                <motion.div
                  key="schedule"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h1 className="text-4xl font-bold text-gray-900">
                      My Schedule
                    </h1>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-full shadow-lg">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Schedule
                      </Button>
                    </motion.div>
                  </div>

                  {scheduleLoading ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : scheduleError ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-800">{scheduleError}</p>
                      <Button
                        onClick={() => fetchDoctorSchedule()}
                        className="mt-2 bg-red-600 hover:bg-red-700 text-white"
                      >
                        Retry
                      </Button>
                    </div>
                  ) : (
                    <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-2xl rounded-3xl overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                        <CardTitle className="text-2xl font-bold text-gray-900">
                          Weekly Schedule
                        </CardTitle>
                        <CardDescription className="text-gray-600">
                          Your availability for consultations and appointments
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          {scheduleData.map((day, index) => (
                            <motion.div
                              key={day.day}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              whileHover={{ x: 5, scale: 1.01 }}
                              className={`flex items-center justify-between p-5 rounded-2xl transition-all duration-300 ${
                                day.slots[0] !== "Closed"
                                  ? "bg-white shadow-lg hover:shadow-xl border border-gray-100"
                                  : "bg-gray-50 border border-gray-200"
                              }`}
                            >
                              <div className="font-semibold text-gray-900 w-32 text-lg">
                                {day.day}
                              </div>
                              <div className="flex-1">
                                {day.slots[0] === "Closed" ? (
                                  <span className="text-gray-500 italic text-lg">
                                    Closed
                                  </span>
                                ) : (
                                  <div className="flex flex-wrap gap-3">
                                    {day.slots.map((slot, slotIndex) => (
                                      <motion.span
                                        key={slotIndex}
                                        whileHover={{ scale: 1.05 }}
                                        className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold shadow-sm"
                                      >
                                        {slot}
                                      </motion.span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-full border-2"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </motion.div>
                            </motion.div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              )}

              {/* My Patients Tab */}
              {activeTab === "patients" && (
                <motion.div
                  key="patients"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <DoctorPatientList
                    doctorId={doctorData?.id || ""}
                    doctorName={doctorData?.name || ""}
                    onPrescriptionCreate={(patient) => {
                      // Set the selected patient for prescription creation
                      localStorage.setItem(
                        "selectedPatientForPrescription",
                        JSON.stringify(patient)
                      );
                      // Switch to prescriptions tab
                      setActiveTab("prescriptions");
                    }}
                  />
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
                  <PrescriptionsTab doctorId={doctorData?.id || ""} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

// Prescriptions Tab Component
const PrescriptionsTab = ({ doctorId }: { doctorId: string }) => {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("Authentication required");
        return;
      }

      const response = await fetch("/api/doctors/prescriptions", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch prescriptions");
      }

      const data = await response.json();
      setPrescriptions(data.prescriptions || []);

      // Extract unique patients from prescriptions
      const uniquePatients: any[] = [];
      const patientMap = new Map<string, any>();

      (data.prescriptions || []).forEach((prescription: any) => {
        const patient = prescription.appointment?.patient;
        if (patient && !patientMap.has(patient.id)) {
          patientMap.set(patient.id, {
            id: patient.id,
            name: patient.name,
            email: patient.email,
            phone: patient.phone,
            patient_profile: patient.patient_profile,
          });
        }
      });

      patientMap.forEach((patient) => uniquePatients.push(patient));
      setPatients(uniquePatients);
    } catch (err) {
      console.error("Error fetching prescriptions:", err);
      setError("Failed to load prescriptions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (doctorId) {
      fetchPrescriptions();
    }
  }, [doctorId]);

  // Check for selected patient when component mounts
  useEffect(() => {
    const storedPatient = localStorage.getItem(
      "selectedPatientForPrescription"
    );
    if (storedPatient) {
      try {
        const patient = JSON.parse(storedPatient);
        setSelectedPatient(patient);
        setShowCreateForm(true);
        // Clear the stored patient
        localStorage.removeItem("selectedPatientForPrescription");
      } catch (e) {
        console.error("Error parsing stored patient data:", e);
      }
    }
  }, []);

  const handlePrescriptionCreated = () => {
    setShowCreateForm(false);
    setSelectedPatient(null);
    fetchPrescriptions();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const generatePrescriptionPDF = async (prescriptionId: string) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const response = await fetch(
        `/api/prescriptions/${prescriptionId}/generate-pdf`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate prescription PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prescription-${prescriptionId.substring(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setError("Failed to generate prescription PDF");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-gray-900">Prescriptions</h1>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-full shadow-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Prescription
          </Button>
        </motion.div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl">
          {error}
        </div>
      )}

      {showCreateForm ? (
        <PrescriptionCreator
          appointmentId={selectedAppointment?.id || ""}
          patient={selectedPatient || selectedAppointment?.patient || {}}
          onPrescriptionCreated={handlePrescriptionCreated}
        />
      ) : (
        <>
          {patients.length > 0 ? (
            <div className="space-y-6">
              {patients.map((patient) => {
                // Filter prescriptions for this patient
                const patientPrescriptions = prescriptions.filter(
                  (prescription) =>
                    prescription.appointment?.patient?.id === patient.id
                );

                return (
                  <Card
                    key={patient.id}
                    className="bg-white/80 backdrop-blur-sm border-white/30 shadow-2xl rounded-3xl overflow-hidden"
                  >
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                      <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                        <User className="h-5 w-5 mr-2 text-blue-600" />
                        {patient.name}
                      </CardTitle>
                      <CardDescription>
                        {patient.email} • {patient.phone}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      {patientPrescriptions.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {patientPrescriptions.map((prescription) => (
                            <Card
                              key={prescription.id}
                              className="border border-gray-200 hover:shadow-lg transition-shadow duration-300"
                            >
                              <CardHeader className="pb-2">
                                <CardTitle className="text-md font-semibold text-gray-900 flex items-center">
                                  <FileText className="h-4 w-4 mr-2 text-blue-600" />
                                  {formatDate(prescription.created_at)}
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="pb-4">
                                <div className="space-y-2">
                                  <div>
                                    <p className="text-sm text-gray-600">
                                      Diagnosis
                                    </p>
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {prescription.diagnosis || "N/A"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-600">
                                      Medications:{" "}
                                      {prescription.drugs?.length || 0}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex justify-between mt-4">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      generatePrescriptionPDF(prescription.id)
                                    }
                                    className="rounded-full"
                                  >
                                    <Download className="h-3 w-3 mr-1" />
                                    PDF
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-600">
                            No prescriptions for this patient
                          </p>
                        </div>
                      )}
                      <div className="mt-4">
                        <Button
                          onClick={() => {
                            setSelectedPatient(patient);
                            setShowCreateForm(true);
                          }}
                          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create Prescription
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-2xl rounded-3xl overflow-hidden">
              <CardContent className="p-12 text-center">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  No Prescriptions Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  You haven't created any prescriptions. Create your first
                  prescription for a patient.
                </p>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-full shadow-lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Prescription
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
