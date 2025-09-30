"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import {
  Calendar,
  Clock,
  Video,
  FileText,
  Pill,
  TestTube,
  User,
  Settings,
  Bell,
  LogOut,
  Star,
  MapPin,
  Phone,
  Mail,
  Stethoscope,
  Plus,
  Download,
  Eye,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

// Mock data for demonstration
const mockPatientData = {
  id: "1",
  name: "Sarah Ahmed",
  email: "sarah.ahmed@email.com",
  phone: "+880 1712 345678",
  dateOfBirth: "1990-05-15",
  gender: "Female",
  bloodGroup: "A+",
  address: "House 123, Road 456, Dhanmondi, Dhaka",
  emergencyContact: "+880 1987 654321",
};

const mockAppointments = [
  {
    id: "1",
    doctor: {
      name: "Dr. Ahmed Kabir",
      specialty: "Cardiologist",
      image: "/api/placeholder/doctor-1",
    },
    date: "2024-01-15",
    time: "02:00 PM",
    type: "Video Consultation",
    status: "upcoming",
    fee: 800,
    meetingLink: "https://mediconnect.com/meet/abc123",
  },
  {
    id: "2",
    doctor: {
      name: "Dr. Fatima Rahman",
      specialty: "Dermatologist",
      image: "/api/placeholder/doctor-2",
    },
    date: "2024-01-10",
    time: "10:00 AM",
    type: "Video Consultation",
    status: "completed",
    fee: 600,
    rating: 5,
  },
];

const mockPrescriptions = [
  {
    id: "1",
    doctor: "Dr. Ahmed Kabir",
    date: "2024-01-10",
    diagnosis: "Hypertension",
    medicines: [
      {
        name: "Amlodipine",
        dosage: "5mg",
        frequency: "Once daily",
        duration: "30 days",
      },
      {
        name: "Metformin",
        dosage: "500mg",
        frequency: "Twice daily",
        duration: "30 days",
      },
    ],
    instructions: "Take medicines after meals. Monitor blood pressure daily.",
  },
];

const mockLabReports = [
  {
    id: "1",
    testName: "Complete Blood Count (CBC)",
    date: "2024-01-08",
    status: "completed",
    reportUrl: "/api/reports/cbc-report.pdf",
  },
  {
    id: "2",
    testName: "Lipid Profile",
    date: "2024-01-12",
    status: "pending",
    expectedDate: "2024-01-15",
  },
];

export default function PatientDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  const upcomingAppointments = mockAppointments.filter(
    (apt) => apt.status === "upcoming"
  );
  const completedAppointments = mockAppointments.filter(
    (apt) => apt.status === "completed"
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Stethoscope className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-2xl font-bold text-gray-900">
                MediConnect
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64">
            <Card>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="bg-blue-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                    <User className="h-10 w-10 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold">
                    {mockPatientData.name}
                  </h2>
                  <p className="text-gray-600">
                    Patient ID: #{mockPatientData.id}
                  </p>
                </div>

                <nav className="space-y-2">
                  <button
                    onClick={() => setActiveTab("overview")}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center ${
                      activeTab === "overview"
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Calendar className="h-4 w-4 mr-3" />
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab("appointments")}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center ${
                      activeTab === "appointments"
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Video className="h-4 w-4 mr-3" />
                    Appointments
                  </button>
                  <button
                    onClick={() => setActiveTab("prescriptions")}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center ${
                      activeTab === "prescriptions"
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <FileText className="h-4 w-4 mr-3" />
                    Prescriptions
                  </button>
                  <button
                    onClick={() => setActiveTab("lab-reports")}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center ${
                      activeTab === "lab-reports"
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <TestTube className="h-4 w-4 mr-3" />
                    Lab Reports
                  </button>
                  <button
                    onClick={() => setActiveTab("medicines")}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center ${
                      activeTab === "medicines"
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Pill className="h-4 w-4 mr-3" />
                    Medicines
                  </button>
                  <button
                    onClick={() => setActiveTab("profile")}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center ${
                      activeTab === "profile"
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <User className="h-4 w-4 mr-3" />
                    Profile
                  </button>
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Welcome back, {mockPatientData.name}!
                  </h1>
                  <p className="text-gray-600">Here's your health overview</p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="bg-blue-100 rounded-full p-3">
                          <Calendar className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-2xl font-bold">
                            {upcomingAppointments.length}
                          </p>
                          <p className="text-gray-600">Upcoming</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="bg-green-100 rounded-full p-3">
                          <FileText className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-2xl font-bold">
                            {mockPrescriptions.length}
                          </p>
                          <p className="text-gray-600">Prescriptions</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="bg-purple-100 rounded-full p-3">
                          <TestTube className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-2xl font-bold">
                            {mockLabReports.length}
                          </p>
                          <p className="text-gray-600">Lab Reports</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="bg-orange-100 rounded-full p-3">
                          <Video className="h-6 w-6 text-orange-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-2xl font-bold">
                            {completedAppointments.length}
                          </p>
                          <p className="text-gray-600">Completed</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Upcoming Appointments */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Upcoming Appointments</CardTitle>
                      <Link href="/doctors">
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Book New
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {upcomingAppointments.length > 0 ? (
                      <div className="space-y-4">
                        {upcomingAppointments.map((appointment) => (
                          <div
                            key={appointment.id}
                            className="flex items-center justify-between p-4 border rounded-lg"
                          >
                            <div className="flex items-center">
                              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mr-4">
                                <Stethoscope className="h-6 w-6 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold">
                                  {appointment.doctor.name}
                                </h3>
                                <p className="text-gray-600">
                                  {appointment.doctor.specialty}
                                </p>
                                <div className="flex items-center text-sm text-gray-500 mt-1">
                                  <Clock className="h-4 w-4 mr-1" />
                                  {formatDate(appointment.date)} at{" "}
                                  {appointment.time}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">
                                {formatCurrency(appointment.fee)}
                              </p>
                              <Link href="/video-consultation">
                                <Button size="sm" className="mt-2">
                                  <Video className="h-4 w-4 mr-2" />
                                  Join Call
                                </Button>
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">
                          No upcoming appointments
                        </p>
                        <Link href="/doctors">
                          <Button className="mt-4">
                            Book Your First Appointment
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <div className="bg-green-100 rounded-full p-2 mr-4">
                          <FileText className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">
                            New prescription received
                          </p>
                          <p className="text-sm text-gray-600">
                            From Dr. Ahmed Kabir • 2 days ago
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="bg-blue-100 rounded-full p-2 mr-4">
                          <TestTube className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">Lab report available</p>
                          <p className="text-sm text-gray-600">
                            Complete Blood Count • 3 days ago
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Appointments Tab */}
            {activeTab === "appointments" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-3xl font-bold text-gray-900">
                    My Appointments
                  </h1>
                  <Link href="/doctors">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Book New Appointment
                    </Button>
                  </Link>
                </div>

                <div className="space-y-6">
                  {mockAppointments.map((appointment) => (
                    <Card key={appointment.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mr-4">
                              <Stethoscope className="h-8 w-8 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold">
                                {appointment.doctor.name}
                              </h3>
                              <p className="text-blue-600">
                                {appointment.doctor.specialty}
                              </p>
                              <div className="flex items-center text-sm text-gray-600 mt-2">
                                <Calendar className="h-4 w-4 mr-1" />
                                {formatDate(appointment.date)} at{" "}
                                {appointment.time}
                              </div>
                              <div className="flex items-center text-sm text-gray-600 mt-1">
                                <Video className="h-4 w-4 mr-1" />
                                {appointment.type}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="mb-4">
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  appointment.status === "upcoming"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {appointment.status === "upcoming"
                                  ? "Upcoming"
                                  : "Completed"}
                              </span>
                            </div>
                            <p className="text-lg font-semibold mb-2">
                              {formatCurrency(appointment.fee)}
                            </p>
                            {appointment.status === "upcoming" ? (
                              <div className="space-y-2">
                                <Button className="w-full">
                                  <Video className="h-4 w-4 mr-2" />
                                  Join Call
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                >
                                  Reschedule
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="flex items-center justify-center">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-4 w-4 ${
                                        i < (appointment.rating || 0)
                                          ? "text-yellow-400 fill-current"
                                          : "text-gray-300"
                                      }`}
                                    />
                                  ))}
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                >
                                  View Details
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Prescriptions Tab */}
            {activeTab === "prescriptions" && (
              <div className="space-y-6">
                <h1 className="text-3xl font-bold text-gray-900">
                  My Prescriptions
                </h1>

                <div className="space-y-6">
                  {mockPrescriptions.map((prescription) => (
                    <Card key={prescription.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold">
                              Prescription #{prescription.id}
                            </h3>
                            <p className="text-gray-600">
                              By {prescription.doctor}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatDate(prescription.date)}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                            <Button size="sm">
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </div>

                        <div className="mb-4">
                          <h4 className="font-medium mb-2">Diagnosis</h4>
                          <p className="text-gray-700">
                            {prescription.diagnosis}
                          </p>
                        </div>

                        <div className="mb-4">
                          <h4 className="font-medium mb-2">Medicines</h4>
                          <div className="space-y-2">
                            {prescription.medicines.map((medicine, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                              >
                                <div>
                                  <p className="font-medium">{medicine.name}</p>
                                  <p className="text-sm text-gray-600">
                                    {medicine.dosage} • {medicine.frequency}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-gray-600">
                                    {medicine.duration}
                                  </p>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-1"
                                  >
                                    <Pill className="h-4 w-4 mr-1" />
                                    Order
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Instructions</h4>
                          <p className="text-gray-700">
                            {prescription.instructions}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>

                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>
                      Manage your personal details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name
                        </label>
                        <p className="text-gray-900">{mockPatientData.name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <p className="text-gray-900">{mockPatientData.email}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone
                        </label>
                        <p className="text-gray-900">{mockPatientData.phone}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date of Birth
                        </label>
                        <p className="text-gray-900">
                          {formatDate(mockPatientData.dateOfBirth)}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Gender
                        </label>
                        <p className="text-gray-900">
                          {mockPatientData.gender}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Blood Group
                        </label>
                        <p className="text-gray-900">
                          {mockPatientData.bloodGroup}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address
                      </label>
                      <p className="text-gray-900">{mockPatientData.address}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Emergency Contact
                      </label>
                      <p className="text-gray-900">
                        {mockPatientData.emergencyContact}
                      </p>
                    </div>
                    <Button>Edit Profile</Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
