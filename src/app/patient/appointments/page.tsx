"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Video,
  User,
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const AgoraVideoCall = dynamic(() => import("@/components/AgoraVideoCall"), {
  ssr: false,
});

interface Appointment {
  id: string;
  doctor: {
    id: string;
    name: string;
  };
  scheduled_at: string;
  status: string;
  meeting_token?: string;
  symptoms?: string;
  notes?: string;
}

export default function PatientAppointments() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [authToken, setAuthToken] = useState("");
  const [userId, setUserId] = useState("");
  const [activeCall, setActiveCall] = useState<Appointment | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem("authToken");
    const role = localStorage.getItem("userRole");
    const id = localStorage.getItem("userId");

    if (!token || role !== "PATIENT") {
      router.push("/auth/login");
      return;
    }

    setAuthToken(token);
    setUserId(id || "");
    fetchAppointments(token);

    // Check for successful booking
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("booking") === "success") {
      // Show success message or highlight new appointment
      setTimeout(() => {
        window.history.replaceState({}, "", "/patient/appointments");
      }, 3000);
    }
  }, []);

  const fetchAppointments = async (token: string) => {
    try {
      setLoading(true);

      // For demo, create some mock appointments with proper structure
      const mockAppointments: Appointment[] = [
        {
          id: "apt_" + Date.now() + "_1",
          doctor: {
            id: "doc_001",
            name: "Dr. Sarah Wilson",
          },
          scheduled_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
          status: "CONFIRMED",
          meeting_token: `channel_${Date.now()}_demo_1`,
          symptoms: "Chest pain and shortness of breath",
          notes: "Patient reports symptoms started yesterday",
        },
        {
          id: "apt_" + Date.now() + "_2",
          doctor: {
            id: "doc_002",
            name: "Dr. Michael Chen",
          },
          scheduled_at: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
          status: "PENDING",
          meeting_token: `channel_${Date.now()}_demo_2`,
          symptoms: "Regular checkup",
          notes: "Annual health screening",
        },
        {
          id: "apt_" + Date.now() + "_3",
          doctor: {
            id: "doc_001",
            name: "Dr. Sarah Wilson",
          },
          scheduled_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          status: "COMPLETED",
          meeting_token: `channel_${Date.now()}_demo_3`,
          symptoms: "Follow-up consultation",
          notes: "Medication review",
        },
      ];

      setAppointments(mockAppointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setError("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  const startVideoCall = (appointment: Appointment) => {
    if (appointment.status === "CONFIRMED") {
      setActiveCall(appointment);
      // Update appointment status to IN_PROGRESS
      updateAppointmentStatus(appointment.id, "IN_PROGRESS");
    }
  };

  const endVideoCall = () => {
    if (activeCall) {
      // Update appointment status to COMPLETED
      updateAppointmentStatus(activeCall.id, "COMPLETED");
    }
    setActiveCall(null);
  };

  const updateAppointmentStatus = (appointmentId: string, status: string) => {
    setAppointments((prev) =>
      prev.map((apt) => (apt.id === appointmentId ? { ...apt, status } : apt))
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "PENDING":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case "COMPLETED":
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case "CANCELLED":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "IN_PROGRESS":
        return <Video className="w-5 h-5 text-blue-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "COMPLETED":
        return "bg-blue-100 text-blue-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      case "IN_PROGRESS":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  };

  if (activeCall) {
    return (
      <AgoraVideoCall
        channelName={activeCall.meeting_token || ""}
        appointmentId={activeCall.id}
        userRole="patient"
        userId={userId}
        authToken={authToken}
        onCallEnd={endVideoCall}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                My Appointments
              </h1>
              <p className="text-gray-600">
                Manage your consultations and video calls
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/patient/dashboard">
                <Button variant="outline">Dashboard</Button>
              </Link>
              <Link href="/booking">
                <Button>
                  <Plus size={16} className="mr-2" />
                  Book Appointment
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* Success Message */}
        {new URLSearchParams(window.location.search).get("booking") ===
          "success" && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md mb-6">
            Appointment booked successfully! Your doctor will confirm the
            appointment soon.
          </div>
        )}

        {/* Appointments List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {appointments.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No appointments
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                You don't have any appointments scheduled.
              </p>
              <div className="mt-6">
                <Link href="/booking">
                  <Button>
                    <Plus size={16} className="mr-2" />
                    Book Your First Appointment
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {appointments.map((appointment) => {
                const { date, time } = formatDateTime(appointment.scheduled_at);
                const isUpcoming =
                  new Date(appointment.scheduled_at) > new Date();
                const canStartCall =
                  appointment.status === "CONFIRMED" && isUpcoming;

                return (
                  <div key={appointment.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-blue-600" />
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {appointment.doctor.name}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {date}
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {time}
                            </div>
                          </div>
                          {appointment.symptoms && (
                            <p className="text-sm text-gray-600 mt-2">
                              <strong>Symptoms:</strong> {appointment.symptoms}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(appointment.status)}
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                              appointment.status
                            )}`}
                          >
                            {appointment.status}
                          </span>
                        </div>

                        {canStartCall && (
                          <Button
                            onClick={() => startVideoCall(appointment)}
                            className="flex items-center space-x-2"
                          >
                            <Video size={16} />
                            <span>Join Call</span>
                          </Button>
                        )}

                        {appointment.status === "PENDING" && (
                          <span className="text-sm text-gray-500">
                            Awaiting doctor confirmation
                          </span>
                        )}

                        {appointment.status === "COMPLETED" && (
                          <Button variant="outline" className="text-xs">
                            View Details
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/booking">
            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center space-x-3">
                <Calendar className="w-8 h-8 text-blue-600" />
                <div>
                  <h3 className="font-medium text-gray-900">
                    Book Appointment
                  </h3>
                  <p className="text-sm text-gray-600">
                    Schedule a new consultation
                  </p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/video-consultation">
            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center space-x-3">
                <Video className="w-8 h-8 text-green-600" />
                <div>
                  <h3 className="font-medium text-gray-900">
                    Video Consultation
                  </h3>
                  <p className="text-sm text-gray-600">
                    Test video calling features
                  </p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/patient/dashboard">
            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center space-x-3">
                <User className="w-8 h-8 text-purple-600" />
                <div>
                  <h3 className="font-medium text-gray-900">Dashboard</h3>
                  <p className="text-sm text-gray-600">
                    View your health summary
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
