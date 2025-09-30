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
  Users,
  DollarSign,
  Settings,
  Bell,
  LogOut,
  Star,
  Plus,
  Edit,
  Eye,
  Stethoscope,
  TrendingUp,
  Activity,
  Award,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

// Mock data for demonstration
const mockDoctorData = {
  id: "1",
  name: "Dr. Ahmed Kabir",
  specialty: "Cardiologist",
  qualifications: ["MBBS", "FCPS", "FRCP"],
  experience: 15,
  rating: 4.8,
  totalReviews: 120,
  consultationFee: 800,
  hospital: "Dhaka Medical College Hospital",
  isVerified: true,
  totalPatients: 450,
  monthlyEarnings: 125000,
  completedConsultations: 89,
};

const mockAppointments = [
  {
    id: "1",
    patient: {
      name: "Sarah Ahmed",
      age: 34,
      gender: "Female",
    },
    date: "2024-01-15",
    time: "02:00 PM",
    type: "Video Consultation",
    status: "upcoming",
    symptoms: "Chest pain, shortness of breath",
    duration: 30,
  },
  {
    id: "2",
    patient: {
      name: "Mohammad Rahman",
      age: 45,
      gender: "Male",
    },
    date: "2024-01-15",
    time: "03:30 PM",
    type: "Video Consultation",
    status: "upcoming",
    symptoms: "High blood pressure, dizziness",
    duration: 30,
  },
  {
    id: "3",
    patient: {
      name: "Fatima Khatun",
      age: 28,
      gender: "Female",
    },
    date: "2024-01-14",
    time: "10:00 AM",
    type: "Video Consultation",
    status: "completed",
    diagnosis: "Hypertension",
    prescriptionGiven: true,
    rating: 5,
  },
];

const mockPatients = [
  {
    id: "1",
    name: "Sarah Ahmed",
    age: 34,
    lastVisit: "2024-01-10",
    totalVisits: 3,
    condition: "Hypertension",
  },
  {
    id: "2",
    name: "Mohammad Rahman",
    age: 45,
    lastVisit: "2024-01-08",
    totalVisits: 5,
    condition: "Diabetes",
  },
];

const mockSchedule = [
  { day: "Monday", slots: ["09:00 AM - 12:00 PM", "02:00 PM - 06:00 PM"] },
  { day: "Tuesday", slots: ["09:00 AM - 12:00 PM", "02:00 PM - 06:00 PM"] },
  { day: "Wednesday", slots: ["09:00 AM - 12:00 PM"] },
  { day: "Thursday", slots: ["09:00 AM - 12:00 PM", "02:00 PM - 06:00 PM"] },
  { day: "Friday", slots: ["09:00 AM - 12:00 PM", "02:00 PM - 06:00 PM"] },
  { day: "Saturday", slots: ["09:00 AM - 01:00 PM"] },
  { day: "Sunday", slots: ["Closed"] },
];

export default function DoctorDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  const todayAppointments = mockAppointments.filter(
    (apt) => new Date(apt.date).toDateString() === new Date().toDateString()
  );
  const upcomingAppointments = mockAppointments.filter(
    (apt) => apt.status === "upcoming"
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
              <span className="ml-4 text-sm text-gray-500">Doctor Portal</span>
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
                    <Stethoscope className="h-10 w-10 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold">
                    {mockDoctorData.name}
                  </h2>
                  <p className="text-blue-600">{mockDoctorData.specialty}</p>
                  <div className="flex items-center justify-center mt-2">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="ml-1 text-sm">
                      {mockDoctorData.rating}
                    </span>
                    <span className="ml-1 text-sm text-gray-500">
                      ({mockDoctorData.totalReviews})
                    </span>
                  </div>
                  {mockDoctorData.isVerified && (
                    <div className="flex items-center justify-center mt-2">
                      <Award className="h-4 w-4 text-green-600 mr-1" />
                      <span className="text-sm text-green-600">Verified</span>
                    </div>
                  )}
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
                    <Activity className="h-4 w-4 mr-3" />
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
                    <Calendar className="h-4 w-4 mr-3" />
                    Appointments
                  </button>
                  <button
                    onClick={() => setActiveTab("patients")}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center ${
                      activeTab === "patients"
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Users className="h-4 w-4 mr-3" />
                    My Patients
                  </button>
                  <button
                    onClick={() => setActiveTab("schedule")}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center ${
                      activeTab === "schedule"
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Clock className="h-4 w-4 mr-3" />
                    Schedule
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
                    onClick={() => setActiveTab("earnings")}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center ${
                      activeTab === "earnings"
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <DollarSign className="h-4 w-4 mr-3" />
                    Earnings
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
                    Good morning, Dr. {mockDoctorData.name.split(" ")[1]}!
                  </h1>
                  <p className="text-gray-600">
                    Here's your practice overview for today
                  </p>
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
                            {todayAppointments.length}
                          </p>
                          <p className="text-gray-600">Today</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="bg-green-100 rounded-full p-3">
                          <Users className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-2xl font-bold">
                            {mockDoctorData.totalPatients}
                          </p>
                          <p className="text-gray-600">Total Patients</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="bg-yellow-100 rounded-full p-3">
                          <Star className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-2xl font-bold">
                            {mockDoctorData.rating}
                          </p>
                          <p className="text-gray-600">Rating</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="bg-purple-100 rounded-full p-3">
                          <TrendingUp className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-2xl font-bold">
                            {formatCurrency(mockDoctorData.monthlyEarnings)}
                          </p>
                          <p className="text-gray-600">This Month</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Today's Appointments */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Today's Appointments</CardTitle>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Slot
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {todayAppointments.length > 0 ? (
                      <div className="space-y-4">
                        {todayAppointments.map((appointment) => (
                          <div
                            key={appointment.id}
                            className="flex items-center justify-between p-4 border rounded-lg"
                          >
                            <div className="flex items-center">
                              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mr-4">
                                <Users className="h-6 w-6 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold">
                                  {appointment.patient.name}
                                </h3>
                                <p className="text-gray-600">
                                  {appointment.patient.age} years,{" "}
                                  {appointment.patient.gender}
                                </p>
                                <div className="flex items-center text-sm text-gray-500 mt-1">
                                  <Clock className="h-4 w-4 mr-1" />
                                  {appointment.time} • {appointment.duration}{" "}
                                  min
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                  {appointment.symptoms}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
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
                              <div className="mt-2">
                                <Link href="/video-consultation">
                                  <Button size="sm">
                                    <Video className="h-4 w-4 mr-2" />
                                    Start Call
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">
                          No appointments scheduled for today
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Reviews</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-start">
                          <div className="bg-blue-100 rounded-full w-10 h-10 flex items-center justify-center mr-3">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center mb-1">
                              <span className="font-medium mr-2">
                                Sarah Ahmed
                              </span>
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className="h-4 w-4 text-yellow-400 fill-current"
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600">
                              "Excellent consultation! Very professional and
                              helpful."
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              2 hours ago
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <div className="bg-blue-100 rounded-full w-10 h-10 flex items-center justify-center mr-3">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center mb-1">
                              <span className="font-medium mr-2">
                                Mohammad Rahman
                              </span>
                              <div className="flex">
                                {[...Array(4)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className="h-4 w-4 text-yellow-400 fill-current"
                                  />
                                ))}
                                <Star className="h-4 w-4 text-gray-300" />
                              </div>
                            </div>
                            <p className="text-sm text-gray-600">
                              "Good service, clear explanation of my condition."
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              1 day ago
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Button className="w-full justify-start">
                          <Plus className="h-4 w-4 mr-2" />
                          Create Prescription
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Update Schedule
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                        >
                          <Users className="h-4 w-4 mr-2" />
                          View Patient Records
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Profile Settings
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Appointments Tab */}
            {activeTab === "appointments" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-3xl font-bold text-gray-900">
                    Appointments
                  </h1>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Time Slot
                  </Button>
                </div>

                <div className="space-y-6">
                  {mockAppointments.map((appointment) => (
                    <Card key={appointment.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mr-4">
                              <Users className="h-8 w-8 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold">
                                {appointment.patient.name}
                              </h3>
                              <p className="text-gray-600">
                                {appointment.patient.age} years •{" "}
                                {appointment.patient.gender}
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
                              {appointment.symptoms && (
                                <p className="text-sm text-gray-600 mt-2">
                                  <strong>Symptoms:</strong>{" "}
                                  {appointment.symptoms}
                                </p>
                              )}
                              {appointment.diagnosis && (
                                <p className="text-sm text-gray-600 mt-1">
                                  <strong>Diagnosis:</strong>{" "}
                                  {appointment.diagnosis}
                                </p>
                              )}
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
                            {appointment.status === "upcoming" ? (
                              <div className="space-y-2">
                                <Link href="/video-consultation">
                                  <Button className="w-full">
                                    <Video className="h-4 w-4 mr-2" />
                                    Start Call
                                  </Button>
                                </Link>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {appointment.rating && (
                                  <div className="flex items-center justify-center">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-4 w-4 ${
                                          i < appointment.rating
                                            ? "text-yellow-400 fill-current"
                                            : "text-gray-300"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </Button>
                                {appointment.prescriptionGiven && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                  >
                                    <FileText className="h-4 w-4 mr-2" />
                                    View Prescription
                                  </Button>
                                )}
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

            {/* Schedule Tab */}
            {activeTab === "schedule" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-3xl font-bold text-gray-900">
                    My Schedule
                  </h1>
                  <Button>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Schedule
                  </Button>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Weekly Schedule</CardTitle>
                    <CardDescription>
                      Your availability for consultations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockSchedule.map((day) => (
                        <div
                          key={day.day}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="font-medium w-24">{day.day}</div>
                          <div className="flex-1">
                            {day.slots[0] === "Closed" ? (
                              <span className="text-gray-500 italic">
                                Closed
                              </span>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {day.slots.map((slot, index) => (
                                  <span
                                    key={index}
                                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                                  >
                                    {slot}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
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
