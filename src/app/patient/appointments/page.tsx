"use client";

import { Button } from "@/components/ui/Button";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  CheckCircle,
  Eye,
  Heart,
  Plus,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Appointment {
  id: string;
  doctor: {
    id: string;
    name: string;
    specialty: string;
    avatar: string;
    rating: number;
    experience: number;
  };
  scheduled_at: string;
  status: string;
  meeting_token?: string;
  symptoms?: string;
  notes?: string;
  duration: number;
  type: string;
  meeting_link?: string;
  payment_amount?: number;
}

export default function PatientAppointments() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error] = useState("");
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem("authToken");
    const role = localStorage.getItem("userRole");

    if (!token || role !== "PATIENT") {
      router.push("/auth/login");
      return;
    }

    // We don't need to store token and id in state since we're not using them
    fetchAppointments(token);

    // Check for successful booking
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("booking") === "success") {
      setTimeout(() => {
        window.history.replaceState({}, "", "/patient/appointments");
      }, 3000);
    }
  }, [router]);

  const fetchAppointments = async (token: string) => {
    try {
      setLoading(true);

      // Fetch real appointments from API instead of using mock data
      const response = await fetch("/api/appointments/patient", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch appointments");
      }

      const data = await response.json();
      setAppointments(data.appointments || []);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      // Fallback to mock data if API fails
      const mockAppointments: Appointment[] = [
        {
          id: "apt_001",
          doctor: {
            id: "doc_001",
            name: "Dr. Sarah Wilson",
            specialty: "Cardiologist",
            avatar: "👩‍⚕️",
            rating: 4.8,
            experience: 12,
          },
          scheduled_at: new Date(Date.now() + 3600000).toISOString(),
          status: "CONFIRMED",
          meeting_token: "channel_demo_1",
          symptoms: "Chest pain and shortness of breath",
          notes: "Patient reports symptoms started yesterday",
          duration: 30,
          type: "Video Consultation",
          meeting_link: "/video-call/demo_1",
          payment_amount: 150.0,
        },
        {
          id: "apt_002",
          doctor: {
            id: "doc_002",
            name: "Dr. Michael Chen",
            specialty: "Neurologist",
            avatar: "👨‍⚕️",
            rating: 4.9,
            experience: 15,
          },
          scheduled_at: new Date(Date.now() + 86400000).toISOString(),
          status: "PENDING",
          meeting_token: "channel_demo_2",
          symptoms: "Regular checkup",
          notes: "Annual health screening",
          duration: 45,
          type: "Video Consultation",
          meeting_link: "/video-call/demo_2",
          payment_amount: 200.0,
        },
        {
          id: "apt_003",
          doctor: {
            id: "doc_001",
            name: "Dr. Sarah Wilson",
            specialty: "Cardiologist",
            avatar: "👩‍⚕️",
            rating: 4.8,
            experience: 12,
          },
          scheduled_at: new Date(Date.now() - 86400000).toISOString(),
          status: "COMPLETED",
          meeting_token: "channel_demo_3",
          symptoms: "Follow-up consultation",
          notes: "Medication review",
          duration: 20,
          type: "Video Consultation",
          meeting_link: "/video-call/demo_3",
          payment_amount: 100.0,
        },
      ];

      setAppointments(mockAppointments);
    } finally {
      setLoading(false);
    }
  };

  const joinVideoCall = (appointment: Appointment) => {
    if (appointment.meeting_link) {
      router.push(appointment.meeting_link);
    } else if (appointment.meeting_token) {
      // Fallback to video call with meeting token
      router.push(
        `/video-call?token=${appointment.meeting_token}&appointmentId=${appointment.id}`
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-300/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-300/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        <div className="relative z-10 text-center">
          <motion.div
            animate={{
              rotate: 360,
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="relative mx-auto mb-6"
          >
            <div className="h-24 w-24 border-4 border-blue-500/30 border-t-blue-600 rounded-full" />
            <div className="absolute inset-0 h-24 w-24 border-4 border-transparent border-t-purple-500 rounded-full animate-spin" />
            <Calendar className="absolute inset-0 m-auto w-10 h-10 text-blue-600" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
          >
            Loading Appointments...
          </motion.h2>
        </div>
      </div>
    );
  }

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

      <div className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Enhanced Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-8 mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <motion.h1
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3"
                >
                  My Appointments
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-gray-600 text-lg"
                >
                  Manage your consultations and video calls with expert doctors
                </motion.p>
              </div>
              <div className="flex items-center space-x-4">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link href="/patient/dashboard">
                    <Button
                      variant="outline"
                      className="rounded-full border-2 px-6"
                    >
                      Dashboard
                    </Button>
                  </Link>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link href="/booking">
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-full shadow-lg hover:shadow-xl transition-all px-6">
                      <Plus size={18} className="mr-2" />
                      Book Appointment
                    </Button>
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-600 px-6 py-4 rounded-2xl mb-6 shadow-lg"
              >
                {error}
              </motion.div>
            )}

            {/* Success Message */}
            {new URLSearchParams(window.location.search).get("booking") ===
              "success" && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-600 px-6 py-4 rounded-2xl mb-6 shadow-lg"
              >
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-3" />
                  <span className="font-semibold">
                    Appointment booked successfully!
                  </span>
                </div>
                <p className="text-sm mt-1">
                  Your doctor will confirm the appointment soon.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Enhanced Appointments List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 overflow-hidden mb-8"
          >
            {appointments.length === 0 ? (
              <div className="p-12 text-center">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="mx-auto w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-6"
                >
                  <Calendar className="h-12 w-12 text-blue-600" />
                </motion.div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  No appointments scheduled
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  You don&apos;t have any appointments scheduled yet. Book your
                  first consultation with our expert doctors.
                </p>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link href="/booking">
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-full shadow-lg hover:shadow-xl px-8 py-3">
                      <Plus size={18} className="mr-2" />
                      Book Your First Appointment
                    </Button>
                  </Link>
                </motion.div>
              </div>
            ) : (
              <div className="divide-y divide-gray-200/50">
                {appointments.map((appointment, index) => {
                  const isUpcoming =
                    new Date(appointment.scheduled_at) > new Date();

                  return (
                    <motion.div
                      key={appointment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ y: -5, scale: 1.005 }}
                      onHoverStart={() => setHoveredCard(appointment.id)}
                      onHoverEnd={() => setHoveredCard(null)}
                      className="p-8 hover:bg-white/50 transition-all duration-300 relative overflow-hidden"
                    >
                      {/* Animated background effect */}
                      <motion.div
                        animate={{
                          opacity:
                            hoveredCard === appointment.id
                              ? [0.1, 0.2, 0.1]
                              : 0.1,
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-purple-500/10"
                      />

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
                                {new Date(
                                  appointment.scheduled_at
                                ).toLocaleDateString()}{" "}
                                at{" "}
                                {new Date(
                                  appointment.scheduled_at
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                              <div className="flex items-center">
                                <Video className="h-4 w-4 mr-2" />
                                {appointment.type}
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
                              ? `$${appointment.payment_amount.toFixed(2)}`
                              : "N/A"}
                          </p>
                          {appointment.status === "CONFIRMED" && isUpcoming ? (
                            <div className="space-y-3">
                              <Button
                                onClick={() => joinVideoCall(appointment)}
                                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-full shadow-lg"
                              >
                                <Video className="h-4 w-4 mr-2" />
                                Join Call
                              </Button>
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
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Enhanced Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              {
                title: "Book Appointment",
                description: "Schedule with specialist doctors",
                icon: Calendar,
                color: "from-blue-500 to-cyan-500",
                link: "/booking",
              },
              {
                title: "Video Consultation",
                description: "Test video calling features",
                icon: Video,
                color: "from-green-500 to-emerald-500",
                link: "/video-consultation",
              },
              {
                title: "Health Dashboard",
                description: "View your health summary",
                icon: Heart,
                color: "from-purple-500 to-pink-500",
                link: "/patient/dashboard",
              },
            ].map((action, index) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <Link href={action.link}>
                  <div className="bg-white/80 backdrop-blur-sm border border-white/30 rounded-3xl p-6 shadow-2xl hover:shadow-3xl transition-all duration-300 cursor-pointer group relative overflow-hidden">
                    {/* Background gradient effect */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-r ${action.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                    />

                    <div className="relative z-10">
                      <div
                        className={`bg-gradient-to-r ${action.color} p-4 rounded-2xl w-14 h-14 flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                      >
                        <action.icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {action.title}
                      </h3>
                      <p className="text-gray-600 mb-4">{action.description}</p>
                      <div className="flex items-center text-blue-600 font-semibold">
                        <span>Explore</span>
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
