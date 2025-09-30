"use client";

import { useState } from "react";
import {
  Calendar,
  Video,
  User,
  Phone,
  CheckCircle,
  Clock,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import AgoraVideoCall from "@/components/AgoraVideoCall";

interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: "patient" | "doctor";
}

interface DemoAppointment {
  id: string;
  patientId: string;
  doctorId: string;
  patientName: string;
  doctorName: string;
  scheduledAt: string;
  status: "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED";
  channelName: string;
  symptoms?: string;
}

const DEMO_USERS: DemoUser[] = [
  {
    id: "patient_1",
    name: "John Patient",
    email: "patient@demo.com",
    role: "patient",
  },
  {
    id: "doctor_1",
    name: "Dr. Sarah Wilson",
    email: "doctor@demo.com",
    role: "doctor",
  },
];

export default function WorkingDemo() {
  const [currentUser, setCurrentUser] = useState<DemoUser>(DEMO_USERS[0]);
  const [appointments, setAppointments] = useState<DemoAppointment[]>([
    {
      id: "apt_1",
      patientId: "patient_1",
      doctorId: "doctor_1",
      patientName: "John Patient",
      doctorName: "Dr. Sarah Wilson",
      scheduledAt: new Date(Date.now() + 300000).toISOString(),
      status: "CONFIRMED",
      channelName: `demo_channel_${Date.now()}`,
      symptoms: "Chest pain and shortness of breath",
    },
  ]);
  const [activeCall, setActiveCall] = useState<DemoAppointment | null>(null);
  const [authToken] = useState("demo-token-123");

  const startVideoCall = (appointment: DemoAppointment) => {
    setActiveCall(appointment);
    updateAppointmentStatus(appointment.id, "IN_PROGRESS");
  };

  const endVideoCall = () => {
    if (activeCall) {
      updateAppointmentStatus(activeCall.id, "COMPLETED");
    }
    setActiveCall(null);
  };

  const updateAppointmentStatus = (
    appointmentId: string,
    status: DemoAppointment["status"]
  ) => {
    setAppointments((prev) =>
      prev.map((apt) => (apt.id === appointmentId ? { ...apt, status } : apt))
    );
  };

  const createNewAppointment = () => {
    const newAppointment: DemoAppointment = {
      id: `apt_${Date.now()}`,
      patientId: currentUser.id,
      doctorId: currentUser.role === "patient" ? "doctor_1" : "patient_1",
      patientName:
        currentUser.role === "patient" ? currentUser.name : "John Patient",
      doctorName:
        currentUser.role === "doctor" ? currentUser.name : "Dr. Sarah Wilson",
      scheduledAt: new Date(Date.now() + 1800000).toISOString(),
      status: "CONFIRMED",
      channelName: `demo_channel_${Date.now()}`,
      symptoms: "New consultation request",
    };

    setAppointments((prev) => [...prev, newAppointment]);
  };

  const getStatusColor = (status: DemoAppointment["status"]) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "COMPLETED":
        return "bg-gray-100 text-gray-800";
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

  // Show video call interface
  if (activeCall) {
    return (
      <AgoraVideoCall
        channelName={activeCall.channelName}
        appointmentId={activeCall.id}
        userRole={currentUser.role}
        userId={currentUser.id}
        authToken={authToken}
        onCallEnd={endVideoCall}
      />
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
                🚀 Working Telemedicine Demo
              </h1>
              <p className="text-gray-600">
                Complete video consultation platform with Agora SDK
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Switch Role:</span>
                <select
                  value={currentUser.id}
                  onChange={(e) => {
                    const user = DEMO_USERS.find(
                      (u) => u.id === e.target.value
                    );
                    if (user) setCurrentUser(user);
                  }}
                  className="px-3 py-1 border border-gray-300 rounded text-sm capitalize"
                >
                  {DEMO_USERS.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.role})
                    </option>
                  ))}
                </select>
              </div>
              <Button onClick={createNewAppointment}>
                <Plus size={16} className="mr-2" />
                Book New Appointment
              </Button>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {currentUser.name}
                </h2>
                <p className="text-gray-600">{currentUser.email}</p>
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                  {currentUser.role}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Total Appointments</div>
              <div className="text-2xl font-bold text-blue-600">
                {appointments.length}
              </div>
            </div>
          </div>
        </div>

        {/* Appointments */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {currentUser.role === "patient"
                ? "My Appointments"
                : "Patient Consultations"}
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {appointments.map((appointment) => {
              const { date, time } = formatDateTime(appointment.scheduledAt);
              const otherUserName =
                currentUser.role === "patient"
                  ? appointment.doctorName
                  : appointment.patientName;
              const canStartCall = appointment.status === "CONFIRMED";

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
                          {otherUserName}
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
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          appointment.status
                        )}`}
                      >
                        {appointment.status}
                      </span>

                      {canStartCall && (
                        <Button
                          onClick={() => startVideoCall(appointment)}
                          className="flex items-center space-x-2"
                        >
                          <Video size={16} />
                          <span>Start Video Call</span>
                        </Button>
                      )}

                      {appointment.status === "PENDING" &&
                        currentUser.role === "doctor" && (
                          <Button
                            onClick={() =>
                              updateAppointmentStatus(
                                appointment.id,
                                "CONFIRMED"
                              )
                            }
                            variant="outline"
                          >
                            Confirm
                          </Button>
                        )}

                      {appointment.status === "COMPLETED" && (
                        <div className="flex items-center text-green-600 text-sm">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Completed
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Features Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
            <Video className="w-8 h-8 mb-3" />
            <h3 className="text-lg font-semibold mb-2">Real Video Calling</h3>
            <p className="text-blue-100 text-sm">
              Powered by Agora SDK with full video/audio controls, screen
              sharing, and connection monitoring.
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
            <Calendar className="w-8 h-8 mb-3" />
            <h3 className="text-lg font-semibold mb-2">Smart Booking</h3>
            <p className="text-green-100 text-sm">
              Dynamic appointment creation with status management and role-based
              permissions.
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
            <User className="w-8 h-8 mb-3" />
            <h3 className="text-lg font-semibold mb-2">Role Management</h3>
            <p className="text-purple-100 text-sm">
              Switch between patient and doctor roles to test both perspectives
              seamlessly.
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-green-900 mb-4">
            ✅ How to Test the Platform
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-green-800 mb-2">
                Getting Started
              </h4>
              <ol className="text-sm text-green-700 space-y-1 list-decimal list-inside">
                <li>Switch between Patient/Doctor roles using the dropdown</li>
                <li>Click "Book New Appointment" to create appointments</li>
                <li>Click "Start Video Call" on confirmed appointments</li>
                <li>Test video/audio controls during the call</li>
              </ol>
            </div>
            <div>
              <h4 className="font-medium text-green-800 mb-2">
                Features Available
              </h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>✅ Real Agora SDK video/audio calling</li>
                <li>✅ Screen sharing (doctors)</li>
                <li>✅ Call duration tracking</li>
                <li>✅ Connection status monitoring</li>
                <li>✅ Appointment status updates</li>
                <li>✅ Role-based interface changes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
