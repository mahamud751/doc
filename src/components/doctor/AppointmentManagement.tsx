"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Phone,
  Stethoscope,
  User,
  Video,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { callingService, ActiveCall } from "@/lib/calling-service";
import OutgoingCallIndicator from "@/components/OutgoingCallIndicator";

interface Appointment {
  id: string;
  patient: {
    id: string;
    name: string;
    phone?: string;
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

interface AppointmentManagementProps {
  doctorId: string;
  doctorName: string;
}

interface FetchError extends Error {
  message: string;
}

interface AgoraTokenResponse {
  token: string;
  appId: string;
  // Add other properties as needed
}

export default function AppointmentManagement({
  doctorId,
  doctorName,
}: AppointmentManagementProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("PENDING"); // PENDING, CONFIRMED, ALL
  const [outgoingCall, setOutgoingCall] = useState<ActiveCall | null>(null);

  useEffect(() => {
    fetchAppointments();
  }, [filter]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("authToken");
      if (!token) {
        window.location.href = "/auth/login";
        return;
      }

      // Build query parameters
      let queryParams = `doctorId=${doctorId}`;
      if (filter !== "ALL") {
        queryParams += `&status=${filter}`;
      }

      const response = await fetch(`/api/appointments?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch appointments");
      }

      const data = await response.json();
      setAppointments(data.appointments || []);
    } catch (err) {
      const fetchError = err as FetchError;
      console.error("Error fetching appointments:", fetchError);
      setError(fetchError.message || "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (
    appointmentId: string,
    status: string
  ) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        window.location.href = "/auth/login";
        return;
      }

      const response = await fetch("/api/appointments", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: appointmentId, status }),
      });

      if (!response.ok) {
        throw new Error("Failed to update appointment status");
      }

      // Refresh appointments
      fetchAppointments();
    } catch (err) {
      const fetchError = err as FetchError;
      console.error("Error updating appointment:", fetchError);
      setError(fetchError.message || "Failed to update appointment");
    }
  };

  const generateAgoraToken = async (channelName: string, uid: number) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        window.location.href = "/auth/login";
        return null;
      }

      const response = await fetch("/api/agora/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          channelName,
          uid,
          role: "doctor",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate video call token");
      }

      const data = await response.json();
      return data as AgoraTokenResponse;
    } catch (err) {
      const fetchError = err as FetchError;
      console.error("Error generating Agora token:", fetchError);
      setError(fetchError.message || "Failed to generate video call token");
      return null;
    }
  };

  // ❌ REMOVED: Doctor should NOT be able to initiate calls
  // According to project specifications, only patients can initiate calls
  // Doctors can only receive calls from patients

  const handleCancelOutgoingCall = () => {
    if (outgoingCall) {
      callingService.endCall(outgoingCall.callId);
    }
    setOutgoingCall(null);
  };

  const joinVideoCall = async (appointment: Appointment) => {
    try {
      // Generate a unique channel name based on appointment ID
      const channelName = `appointment_${appointment.id}`;
      const uid = Math.floor(Math.random() * 1000000); // Generate a random UID

      // Generate Agora token
      const tokenData = await generateAgoraToken(channelName, uid);

      if (tokenData) {
        // Validate that we have all required data
        if (!tokenData.token || !tokenData.appId || !channelName || !uid) {
          throw new Error("Missing required video call parameters");
        }

        // Redirect to video call page with token data
        // Use the appId from the tokenData response instead of passing it separately
        const callUrl = `/doctor/video-call?channel=${channelName}&token=${tokenData.token}&uid=${uid}&appId=${tokenData.appId}`;
        window.open(callUrl, "_blank");
      }
    } catch (err) {
      const fetchError = err as FetchError;
      console.error("Error joining video call:", fetchError);
      setError(fetchError.message || "Failed to join video call");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "CONFIRMED":
        return "bg-blue-100 text-blue-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <AlertCircle className="h-4 w-4" />;
      case "CONFIRMED":
        return <CheckCircle className="h-4 w-4" />;
      case "COMPLETED":
        return <CheckCircle className="h-4 w-4" />;
      case "CANCELLED":
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
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
      {/* Outgoing call indicator */}
      {outgoingCall && (
        <OutgoingCallIndicator
          call={outgoingCall}
          onCancel={handleCancelOutgoingCall}
        />
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Appointments</h2>
          <p className="text-gray-600 mt-1">
            Manage your upcoming and past appointments
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={filter === "PENDING" ? "default" : "outline"}
            onClick={() => setFilter("PENDING")}
            className="rounded-full"
          >
            Pending
          </Button>
          <Button
            variant={filter === "CONFIRMED" ? "default" : "outline"}
            onClick={() => setFilter("CONFIRMED")}
            className="rounded-full"
          >
            Confirmed
          </Button>
          <Button
            variant={filter === "ALL" ? "default" : "outline"}
            onClick={() => setFilter("ALL")}
            className="rounded-full"
          >
            All Appointments
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {appointments.length === 0 ? (
        <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-lg rounded-2xl">
          <CardContent className="p-12 text-center">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No appointments found
            </h3>
            <p className="text-gray-600">
              {filter === "PENDING"
                ? "You don't have any pending appointments at the moment."
                : filter === "CONFIRMED"
                ? "You don't have any confirmed appointments at the moment."
                : "You don't have any appointments matching the current filter."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <motion.div
              key={appointment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              <Card className="bg-transparent border-0 shadow-none">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Patient Info */}
                    <div className="flex items-center md:w-1/3">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full w-16 h-16 flex items-center justify-center text-white font-bold text-xl mr-4">
                        {appointment.patient.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {appointment.patient.name}
                        </h3>
                        <div className="flex items-center text-gray-600 mt-1">
                          <Phone className="h-4 w-4 mr-2" />
                          <span>
                            {appointment.patient.phone || "No phone provided"}
                          </span>
                        </div>
                        <div className="flex items-center text-gray-600 mt-1">
                          <User className="h-4 w-4 mr-2" />
                          <span>
                            {appointment.patient.patient_profile?.date_of_birth
                              ? `${
                                  new Date().getFullYear() -
                                  new Date(
                                    appointment.patient.patient_profile.date_of_birth
                                  ).getFullYear()
                                } years`
                              : "N/A"}{" "}
                            •{" "}
                            {appointment.patient.patient_profile?.gender ||
                              "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Appointment Details */}
                    <div className="md:w-1/3">
                      <div className="flex items-center text-gray-600 mb-2">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>{formatDate(appointment.scheduled_at)}</span>
                      </div>
                      <div className="flex items-center text-gray-600 mb-2">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>
                          {new Date(
                            appointment.scheduled_at
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Stethoscope className="h-4 w-4 mr-2" />
                        <span>{appointment.meeting_type}</span>
                      </div>
                      {appointment.symptoms && (
                        <div className="mt-3">
                          <p className="text-gray-700">
                            <span className="font-semibold">Symptoms:</span>{" "}
                            {appointment.symptoms}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="md:w-1/3 flex flex-col items-end justify-between">
                      <div className="flex items-center mb-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center ${getStatusColor(
                            appointment.status
                          )}`}
                        >
                          {getStatusIcon(appointment.status)}
                          <span className="ml-2">{appointment.status}</span>
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 justify-end">
                        {appointment.status === "PENDING" && (
                          <>
                            <Button
                              onClick={() =>
                                updateAppointmentStatus(
                                  appointment.id,
                                  "CONFIRMED"
                                )
                              }
                              className="bg-green-500 hover:bg-green-600 rounded-full"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              onClick={() =>
                                updateAppointmentStatus(
                                  appointment.id,
                                  "CANCELLED"
                                )
                              }
                              variant="outline"
                              className="rounded-full border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </>
                        )}

                        {appointment.status === "CONFIRMED" && (
                          <div className="space-y-2">
                            <Button
                              variant="outline"
                              className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-700 rounded-full cursor-default"
                              disabled
                            >
                              <Phone className="h-4 w-4 mr-2" />
                              Waiting for Patient Call
                            </Button>
                            <p className="text-xs text-gray-500 text-center">
                              Patient will initiate the video call
                            </p>
                          </div>
                        )}

                        {(appointment.status === "COMPLETED" ||
                          appointment.status === "CANCELLED") && (
                          <Button
                            variant="outline"
                            className="rounded-full"
                            disabled
                          >
                            {appointment.status}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
