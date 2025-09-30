"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

// Mock data for demonstration
const mockStats = {
  totalUsers: 1250,
  totalDoctors: 45,
  totalPatients: 1205,
  pendingVerifications: 12,
  totalAppointments: 890,
  monthlyRevenue: 450000,
  completedConsultations: 756,
  averageRating: 4.7,
};

const mockPendingDoctors = [
  {
    id: "1",
    name: "Dr. Rashida Begum",
    email: "rashida.begum@email.com",
    specialty: "Gynecologist",
    experience: 18,
    qualifications: ["MBBS", "FCPS (Gynae)"],
    hospital: "United Hospital",
    submittedAt: "2024-01-12",
    documents: ["Medical License", "ID Card", "Photo"],
  },
  {
    id: "2",
    name: "Dr. Karim Rahman",
    email: "karim.rahman@email.com",
    specialty: "Neurologist",
    experience: 22,
    qualifications: ["MBBS", "FCPS (Neurology)", "PhD"],
    hospital: "Square Hospital",
    submittedAt: "2024-01-11",
    documents: ["Medical License", "ID Card", "Photo", "Certificate"],
  },
];

const mockRecentAppointments = [
  {
    id: "1",
    patient: "Sarah Ahmed",
    doctor: "Dr. Ahmed Kabir",
    date: "2024-01-15",
    time: "02:00 PM",
    status: "upcoming",
    amount: 800,
    type: "Video Consultation",
  },
  {
    id: "2",
    patient: "Mohammad Rahman",
    doctor: "Dr. Fatima Rahman",
    date: "2024-01-15",
    time: "10:00 AM",
    status: "completed",
    amount: 600,
    type: "Video Consultation",
  },
];

const mockUsers = [
  {
    id: "1",
    name: "Sarah Ahmed",
    email: "sarah.ahmed@email.com",
    role: "PATIENT",
    status: "active",
    joinDate: "2024-01-10",
    lastLogin: "2024-01-15",
  },
  {
    id: "2",
    name: "Dr. Ahmed Kabir",
    email: "ahmed.kabir@email.com",
    role: "DOCTOR",
    status: "active",
    joinDate: "2024-01-05",
    lastLogin: "2024-01-15",
  },
];

const mockMedicines = [
  {
    id: "1",
    name: "Paracetamol",
    genericName: "Acetaminophen",
    manufacturer: "Square Pharmaceuticals",
    category: "Tablet",
    strength: "500mg",
    price: 2.5,
    stock: 1000,
    prescriptionRequired: false,
  },
  {
    id: "2",
    name: "Amlodipine",
    genericName: "Amlodipine Besylate",
    manufacturer: "Beximco Pharmaceuticals",
    category: "Tablet",
    strength: "5mg",
    price: 8.0,
    stock: 500,
    prescriptionRequired: true,
  },
];

const mockLabPackages = [
  {
    id: "1",
    name: "Complete Blood Count (CBC)",
    category: "Blood Test",
    price: 800,
    testsIncluded: ["RBC Count", "WBC Count", "Hemoglobin", "Platelet Count"],
    reportingTime: "24 hours",
    isActive: true,
  },
  {
    id: "2",
    name: "Lipid Profile",
    category: "Blood Test",
    price: 1200,
    testsIncluded: ["Total Cholesterol", "HDL", "LDL", "Triglycerides"],
    reportingTime: "24 hours",
    isActive: true,
  },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-red-600" />
              <span className="ml-2 text-2xl font-bold text-gray-900">
                MediConnect Admin
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
                  <div className="bg-red-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-10 w-10 text-red-600" />
                  </div>
                  <h2 className="text-xl font-semibold">Admin Panel</h2>
                  <p className="text-gray-600">System Management</p>
                </div>

                <nav className="space-y-2">
                  <button
                    onClick={() => setActiveTab("overview")}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center ${
                      activeTab === "overview"
                        ? "bg-red-50 text-red-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Activity className="h-4 w-4 mr-3" />
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab("users")}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center ${
                      activeTab === "users"
                        ? "bg-red-50 text-red-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Users className="h-4 w-4 mr-3" />
                    Users
                  </button>
                  <button
                    onClick={() => setActiveTab("doctor-verification")}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center ${
                      activeTab === "doctor-verification"
                        ? "bg-red-50 text-red-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <UserCheck className="h-4 w-4 mr-3" />
                    Doctor Verification
                    {mockPendingDoctors.length > 0 && (
                      <span className="ml-auto bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                        {mockPendingDoctors.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab("appointments")}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center ${
                      activeTab === "appointments"
                        ? "bg-red-50 text-red-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Calendar className="h-4 w-4 mr-3" />
                    Appointments
                  </button>
                  <button
                    onClick={() => setActiveTab("medicines")}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center ${
                      activeTab === "medicines"
                        ? "bg-red-50 text-red-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Pill className="h-4 w-4 mr-3" />
                    Medicines
                  </button>
                  <button
                    onClick={() => setActiveTab("lab-packages")}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center ${
                      activeTab === "lab-packages"
                        ? "bg-red-50 text-red-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <TestTube className="h-4 w-4 mr-3" />
                    Lab Packages
                  </button>
                  <button
                    onClick={() => setActiveTab("analytics")}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center ${
                      activeTab === "analytics"
                        ? "bg-red-50 text-red-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <BarChart3 className="h-4 w-4 mr-3" />
                    Analytics
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
                    Platform Overview
                  </h1>
                  <p className="text-gray-600">
                    Monitor and manage your telemedicine platform
                  </p>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="bg-blue-100 rounded-full p-3">
                          <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-2xl font-bold">
                            {mockStats.totalUsers.toLocaleString()}
                          </p>
                          <p className="text-gray-600">Total Users</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="bg-green-100 rounded-full p-3">
                          <Stethoscope className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-2xl font-bold">
                            {mockStats.totalDoctors}
                          </p>
                          <p className="text-gray-600">Active Doctors</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="bg-purple-100 rounded-full p-3">
                          <Calendar className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-2xl font-bold">
                            {mockStats.totalAppointments}
                          </p>
                          <p className="text-gray-600">Total Appointments</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="bg-yellow-100 rounded-full p-3">
                          <DollarSign className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-2xl font-bold">
                            {formatCurrency(mockStats.monthlyRevenue)}
                          </p>
                          <p className="text-gray-600">Monthly Revenue</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Pending Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center">
                          <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
                          Pending Doctor Verifications
                        </CardTitle>
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-sm font-medium">
                          {mockPendingDoctors.length}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {mockPendingDoctors.slice(0, 3).map((doctor) => (
                          <div
                            key={doctor.id}
                            className="flex items-center justify-between p-3 bg-orange-50 rounded-lg"
                          >
                            <div>
                              <p className="font-medium">{doctor.name}</p>
                              <p className="text-sm text-gray-600">
                                {doctor.specialty}
                              </p>
                            </div>
                            <Button size="sm">Review</Button>
                          </div>
                        ))}
                      </div>
                      <Button variant="outline" className="w-full mt-4">
                        View All
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <div className="bg-green-100 rounded-full p-2 mr-3">
                            <UserCheck className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium">
                              Dr. Fatima Rahman verified
                            </p>
                            <p className="text-sm text-gray-600">2 hours ago</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="bg-blue-100 rounded-full p-2 mr-3">
                            <Users className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">
                              25 new patient registrations
                            </p>
                            <p className="text-sm text-gray-600">Today</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="bg-purple-100 rounded-full p-2 mr-3">
                            <Calendar className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium">
                              156 appointments completed
                            </p>
                            <p className="text-sm text-gray-600">This week</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Platform Health */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        99.9%
                      </div>
                      <p className="text-gray-600">Platform Uptime</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {mockStats.averageRating}
                      </div>
                      <p className="text-gray-600">Average Rating</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-orange-600 mb-2">
                        2.3s
                      </div>
                      <p className="text-gray-600">Avg Response Time</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Doctor Verification Tab */}
            {activeTab === "doctor-verification" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-3xl font-bold text-gray-900">
                    Doctor Verification
                  </h1>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search doctors..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Button variant="outline">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                  </div>
                </div>

                <div className="space-y-6">
                  {mockPendingDoctors.map((doctor) => (
                    <Card key={doctor.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start">
                            <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mr-4">
                              <Stethoscope className="h-8 w-8 text-orange-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold">
                                {doctor.name}
                              </h3>
                              <p className="text-blue-600">
                                {doctor.specialty}
                              </p>
                              <p className="text-gray-600">
                                {doctor.experience} years experience
                              </p>
                              <p className="text-sm text-gray-500">
                                {doctor.email}
                              </p>
                              <div className="mt-2">
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
                                  {doctor.documents.map((doc, index) => (
                                    <span
                                      key={index}
                                      className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                                    >
                                      {doc}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col space-y-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              View Documents
                            </Button>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button variant="destructive" size="sm">
                              <X className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Medicines Tab */}
            {activeTab === "medicines" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-3xl font-bold text-gray-900">
                    Medicine Management
                  </h1>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Medicine
                  </Button>
                </div>

                <Card>
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
                          {mockMedicines.map((medicine) => (
                            <tr key={medicine.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {medicine.name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {medicine.genericName}
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
                                {formatCurrency(medicine.price)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`text-sm ${
                                    medicine.stock > 100
                                      ? "text-green-600"
                                      : medicine.stock > 50
                                      ? "text-yellow-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {medicine.stock}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    medicine.prescriptionRequired
                                      ? "bg-red-100 text-red-800"
                                      : "bg-green-100 text-green-800"
                                  }`}
                                >
                                  {medicine.prescriptionRequired
                                    ? "Required"
                                    : "Not Required"}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="mr-2"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm">
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
              </div>
            )}

            {/* Lab Packages Tab */}
            {activeTab === "lab-packages" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-3xl font-bold text-gray-900">
                    Lab Package Management
                  </h1>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Package
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {mockLabPackages.map((pkg) => (
                    <Card key={pkg.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{pkg.name}</CardTitle>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                pkg.isActive
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {pkg.isActive ? "Active" : "Inactive"}
                            </span>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <CardDescription>{pkg.category}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="font-medium">Price:</span>
                            <span className="text-lg font-bold text-blue-600">
                              {formatCurrency(pkg.price)}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">Tests Included:</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {pkg.testsIncluded.map((test, index) => (
                                <span
                                  key={index}
                                  className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                                >
                                  {test}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Reporting Time:</span>
                            <span>{pkg.reportingTime}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
