"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/Button";
import { Video, ArrowLeft, Users, PhoneOff } from "lucide-react";

const AgoraVideoCall = dynamic(() => import("@/components/AgoraVideoCall"), {
  ssr: false,
});

interface Appointment {
  id: string;
  doctor: {
    id: string;
    name: string;
  };
  patient: {
    id: string;
    name: string;
  };
  scheduled_at: string;
  status: string;
  meeting_token?: string;
  symptoms?: string;
  notes?: string;
}

export default function VideoConsultationPage() {
  const router = useRouter();
  const [activeCall, setActiveCall] = useState<Appointment | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [authToken, setAuthToken] = useState("");
  const [userId, setUserId] = useState("");
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem("authToken");
    const role = localStorage.getItem("userRole");
    const id = localStorage.getItem("userId");

    if (!token) {
      router.push("/auth/login");
      return;
    }

    setAuthToken(token);
    setUserRole(role || "");
    setUserId(id || "");
    fetchAppointments(token);
  }, []);

  const fetchAppointments = async (token: string) => {
    try {
      setLoading(true);
      const response = await fetch("/api/appointments", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch appointments");
      }

      const data = await response.json();
      // Filter for today's appointments or active ones
      const today = new Date();
      const todayAppointments = data.appointments.filter((apt: Appointment) => {
        const aptDate = new Date(apt.scheduled_at);
        return (
          aptDate.toDateString() === today.toDateString() ||
          apt.status === "CONFIRMED" ||
          apt.status === "IN_PROGRESS"
        );
      });

      setAppointments(todayAppointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const startVideoCall = (appointment: Appointment) => {
    // Generate a unique channel name for this appointment
    const channelName = `appointment_${appointment.id}`;
    setActiveCall({
      ...appointment,
      meeting_token: channelName,
    });
  };

  const endVideoCall = () => {
    setActiveCall(null);
  };

  const handlePrescriptionCreate = () => {
    // Redirect to prescription creation page
    router.push(`/doctor/prescriptions/create/${activeCall?.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If there's an active call, show the video call component
  if (activeCall) {
    return (
      <AgoraVideoCall
        channelName={activeCall.meeting_token || `appointment_${activeCall.id}`}
        appointmentId={activeCall.id}
        userRole={userRole as "patient" | "doctor"}
        userId={userId}
        authToken={authToken}
        onCallEnd={endVideoCall}
        onPrescriptionCreate={
          userRole === "DOCTOR" ? handlePrescriptionCreate : undefined
        }
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button onClick={() => router.back()} variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Video Consultation
                </h1>
                <p className="text-gray-600">
                  Start or join your video consultation
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Video className="h-4 w-4" />
              <span>HD Video & Audio</span>
            </div>
          </div>
        </div>

        {/* Available Appointments */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Today's Appointments
            </h2>
            <p className="text-sm text-gray-600">
              Click "Join Call" to start your video consultation
            </p>
          </div>

          {appointments.length === 0 ? (
            <div className="p-8 text-center">
              <Video className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Video Calls Available
              </h3>
              <p className="text-gray-600 mb-6">
                You don't have any video consultations scheduled for today.
              </p>
              <div className="space-y-3">
                <Button
                  onClick={() => router.push("/doctors")}
                  className="mr-3"
                >
                  Book New Appointment
                </Button>
                <Button
                  onClick={() => router.push("/patient/appointments")}
                  variant="outline"
                >
                  View All Appointments
                </Button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {userRole === "PATIENT"
                            ? `Dr. ${appointment.doctor.name}`
                            : appointment.patient.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Scheduled:{" "}
                          {new Date(appointment.scheduled_at).toLocaleString()}
                        </p>
                        <div className="flex items-center mt-1">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              appointment.status === "CONFIRMED"
                                ? "bg-green-100 text-green-800"
                                : appointment.status === "IN_PROGRESS"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {appointment.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-right text-sm text-gray-600">
                        <p>
                          {userRole === "PATIENT"
                            ? "Consultation"
                            : "Patient Visit"}
                        </p>
                        <p className="font-medium">Video Call Ready</p>
                      </div>
                      <Button
                        onClick={() => startVideoCall(appointment)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Video className="h-4 w-4 mr-2" />
                        Join Call
                      </Button>
                    </div>
                  </div>

                  {appointment.symptoms && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Symptoms:
                      </p>
                      <p className="text-sm text-gray-600">
                        {appointment.symptoms}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Video className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">HD Video Quality</h3>
                <p className="text-sm text-gray-600">
                  Crystal clear video calls
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <PhoneOff className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Secure Connection</h3>
                <p className="text-sm text-gray-600">End-to-end encrypted</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Real-time Chat</h3>
                <p className="text-sm text-gray-600">Text during video calls</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
