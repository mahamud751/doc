"use client";

import ExportButton, { prepareExportData } from "@/components/ExportButton";
import {
  ResponsiveButton,
  ResponsiveCard,
  ResponsiveInput,
  ResponsiveModal,
} from "@/components/ResponsiveComponents";
import { formatDate } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Calendar,
  Check,
  Clock,
  Edit,
  Eye,
  Plus,
  Stethoscope,
  User,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  slot_id?: string;
  status:
    | "PENDING"
    | "CONFIRMED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED"
    | "NO_SHOW";
  payment_status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  meeting_type: "VIDEO" | "AUDIO" | "CHAT";
  scheduled_at: string;
  started_at?: string;
  ended_at?: string;
  notes?: string;
  symptoms?: string;
  diagnosis?: string;
  created_at: string;
  patient: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  doctor: {
    id: string;
    name: string;
    email: string;
    phone: string;
    doctor_profile?: {
      specialties: string[];
      consultation_fee: number;
    };
  };
}

interface Doctor {
  id: string;
  name: string;
  email: string;
  phone: string;
  profile?: {
    specialties?: string[];
    // Add other properties as needed
  };
}

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  // Add other properties as needed
}

interface AppointmentFormData {
  patient_id: string;
  doctor_id: string;
  scheduled_at: string;
  meeting_type: "VIDEO" | "AUDIO" | "CHAT";
  symptoms: string;
  notes: string;
}

export default function AppointmentManagement() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingAppointment, setEditingAppointment] =
    useState<Appointment | null>(null);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [formData, setFormData] = useState<AppointmentFormData>({
    patient_id: "",
    doctor_id: "",
    scheduled_at: "",
    meeting_type: "VIDEO",
    symptoms: "",
    notes: "",
  });

  const [stats, setStats] = useState({
    totalAppointments: 0,
    todayAppointments: 0,
    pendingAppointments: 0,
    completedAppointments: 0,
  });

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
    fetchPatients();
    calculateStats();
  }, [appointments]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/appointments", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAppointments(data.appointments || []);
      } else {
        setError("Failed to fetch appointments");
      }
    } catch (err) {
      console.error("Error loading appointments:", err);
      setError("Error loading appointments");
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/admin/doctors", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDoctors(data.doctors || []);
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
  };

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/admin/users?role=PATIENT", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPatients(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
    }
  };

  const calculateStats = () => {
    const totalAppointments = appointments.length;
    const today = new Date().toISOString().split("T")[0];
    const todayAppointments = appointments.filter((apt) =>
      apt.scheduled_at.startsWith(today)
    ).length;
    const pendingAppointments = appointments.filter(
      (apt) => apt.status === "PENDING" || apt.status === "CONFIRMED"
    ).length;
    const completedAppointments = appointments.filter(
      (apt) => apt.status === "COMPLETED"
    ).length;

    setStats({
      totalAppointments,
      todayAppointments,
      pendingAppointments,
      completedAppointments,
    });
  };

  const handleCreateAppointment = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          doctorId: formData.doctor_id,
          patientId: formData.patient_id,
          appointmentDate: formData.scheduled_at.split("T")[0],
          appointmentTime: formData.scheduled_at.split("T")[1],
          reason: formData.symptoms,
          type: formData.meeting_type,
        }),
      });

      if (response.ok) {
        await fetchAppointments();
        setShowModal(false);
        resetForm();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to create appointment");
      }
    } catch (error) {
      console.error("Error creating appointment:", error);
      setError("Error creating appointment");
    }
  };

  const handleUpdateAppointment = async () => {
    if (!editingAppointment) return;

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/appointments", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingAppointment.id,
          status: editingAppointment.status,
          appointmentDate: formData.scheduled_at.split("T")[0],
          appointmentTime: formData.scheduled_at.split("T")[1],
          reason: formData.symptoms,
          notes: formData.notes,
        }),
      });

      if (response.ok) {
        await fetchAppointments();
        setShowModal(false);
        setEditingAppointment(null);
        resetForm();
      } else {
        setError("Failed to update appointment");
      }
    } catch (error) {
      console.error("Error updating appointment:", error);
      setError("Error updating appointment");
    }
  };

  const handleStatusUpdate = async (
    appointmentId: string,
    status: Appointment["status"]
  ) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/appointments", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: appointmentId,
          status,
        }),
      });

      if (response.ok) {
        await fetchAppointments();
      } else {
        setError("Failed to update appointment status");
      }
    } catch (error) {
      console.error("Error updating appointment status:", error);
      setError("Error updating appointment status");
    }
  };

  const resetForm = () => {
    setFormData({
      patient_id: "",
      doctor_id: "",
      scheduled_at: "",
      meeting_type: "VIDEO",
      symptoms: "",
      notes: "",
    });
  };

  const openEditModal = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setFormData({
      patient_id: appointment.patient_id,
      doctor_id: appointment.doctor_id,
      scheduled_at: appointment.scheduled_at.replace("Z", "").slice(0, 16),
      meeting_type: appointment.meeting_type,
      symptoms: appointment.symptoms || "",
      notes: appointment.notes || "",
    });
    setShowModal(true);
  };

  const getStatusColor = (status: Appointment["status"]) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "CONFIRMED":
        return "bg-blue-100 text-blue-800";
      case "IN_PROGRESS":
        return "bg-purple-100 text-purple-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      case "NO_SHOW":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesSearch =
      appointment.patient.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      appointment.doctor.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      appointment.patient.email
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus = !statusFilter || appointment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Appointment Management
          </h1>
          <p className="text-gray-600 mt-2">
            Manage patient appointments and schedules
          </p>
        </div>
        <ResponsiveButton
          onClick={() => {
            resetForm();
            setEditingAppointment(null);
            setShowModal(true);
          }}
          className="bg-gradient-to-r from-blue-500 to-purple-500 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Schedule Appointment
        </ResponsiveButton>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <ResponsiveCard>
          <div className="flex items-center">
            <div className="bg-blue-100 rounded-lg p-3 mr-4">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {stats.totalAppointments}
              </p>
              <p className="text-sm text-gray-600">Total Appointments</p>
            </div>
          </div>
        </ResponsiveCard>

        <ResponsiveCard>
          <div className="flex items-center">
            <div className="bg-green-100 rounded-lg p-3 mr-4">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {stats.todayAppointments}
              </p>
              <p className="text-sm text-gray-600">Today&apos;s Appointments</p>
            </div>
          </div>
        </ResponsiveCard>

        <ResponsiveCard>
          <div className="flex items-center">
            <div className="bg-yellow-100 rounded-lg p-3 mr-4">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">
                {stats.pendingAppointments}
              </p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
          </div>
        </ResponsiveCard>

        <ResponsiveCard>
          <div className="flex items-center">
            <div className="bg-purple-100 rounded-lg p-3 mr-4">
              <Check className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">
                {stats.completedAppointments}
              </p>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
          </div>
        </ResponsiveCard>
      </div>

      {/* Filters */}
      <ResponsiveCard>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <ResponsiveInput
              label="Search appointments"
              placeholder="Search by patient name, doctor, or email..."
              value={searchTerm}
              onChange={setSearchTerm}
            />
          </div>
          <div className="w-full sm:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="NO_SHOW">No Show</option>
            </select>
          </div>
          <div className="flex items-end">
            <ExportButton
              data={prepareExportData(
                filteredAppointments.map((appointment) => ({
                  ...appointment,
                  // Flatten nested properties for export
                  patientName: appointment.patient.name,
                  doctorName: appointment.doctor.name,
                })),
                [
                  { key: "patientName", label: "Patient Name" },
                  { key: "doctorName", label: "Doctor Name" },
                  {
                    key: "scheduled_at",
                    label: "Scheduled Date/Time",
                    format: (value) => formatDate(value as string),
                  },
                  { key: "status", label: "Status" },
                  { key: "meeting_type", label: "Meeting Type" },
                  { key: "symptoms", label: "Symptoms" },
                ],
                "appointments-export"
              )}
            />
          </div>
        </div>
      </ResponsiveCard>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Appointments Table */}
      <ResponsiveCard>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Doctor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAppointments.map((appointment, index) => (
                <motion.tr
                  key={appointment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full w-10 h-10 flex items-center justify-center mr-3">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {appointment.patient.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {appointment.patient.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-full w-10 h-10 flex items-center justify-center mr-3">
                        <Stethoscope className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          Dr. {appointment.doctor.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {appointment.doctor.doctor_profile
                            ?.specialties?.[0] || "General"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(appointment.scheduled_at)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(appointment.scheduled_at).toLocaleTimeString(
                        [],
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        appointment.meeting_type === "VIDEO"
                          ? "bg-blue-100 text-blue-800"
                          : appointment.meeting_type === "AUDIO"
                          ? "bg-green-100 text-green-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {appointment.meeting_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        appointment.status
                      )}`}
                    >
                      {appointment.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <ResponsiveButton
                      size="xs"
                      variant="outline"
                      onClick={() => {
                        setSelectedAppointment(appointment);
                        setShowDetailsModal(true);
                      }}
                    >
                      <Eye className="w-3 h-3" />
                    </ResponsiveButton>
                    <ResponsiveButton
                      size="xs"
                      variant="outline"
                      onClick={() => openEditModal(appointment)}
                    >
                      <Edit className="w-3 h-3" />
                    </ResponsiveButton>
                    {appointment.status === "PENDING" && (
                      <ResponsiveButton
                        size="xs"
                        onClick={() =>
                          handleStatusUpdate(appointment.id, "CONFIRMED")
                        }
                        className="bg-green-600 text-white hover:bg-green-700"
                      >
                        <Check className="w-3 h-3" />
                      </ResponsiveButton>
                    )}
                    <ResponsiveButton
                      size="xs"
                      onClick={() =>
                        handleStatusUpdate(appointment.id, "CANCELLED")
                      }
                      className="bg-red-600 text-white hover:bg-red-700"
                    >
                      <X className="w-3 h-3" />
                    </ResponsiveButton>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </ResponsiveCard>

      {/* Create/Edit Modal */}
      <ResponsiveModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingAppointment(null);
          resetForm();
        }}
        title={
          editingAppointment ? "Edit Appointment" : "Schedule New Appointment"
        }
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Patient
              </label>
              <select
                value={formData.patient_id}
                onChange={(e) =>
                  setFormData({ ...formData, patient_id: e.target.value })
                }
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="">Select Patient</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name} - {patient.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Doctor
              </label>
              <select
                value={formData.doctor_id}
                onChange={(e) =>
                  setFormData({ ...formData, doctor_id: e.target.value })
                }
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="">Select Doctor</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    Dr. {doctor.name || "Unknown"} -{" "}
                    {doctor.profile?.specialties?.[0] || "General"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ResponsiveInput
              label="Date & Time"
              type="datetime-local"
              value={formData.scheduled_at}
              onChange={(value) =>
                setFormData({ ...formData, scheduled_at: value })
              }
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meeting Type
              </label>
              <select
                value={formData.meeting_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    meeting_type: e.target.value as "VIDEO" | "AUDIO" | "CHAT",
                  })
                }
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="VIDEO">Video Call</option>
                <option value="AUDIO">Audio Call</option>
                <option value="CHAT">Chat Only</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Symptoms/Reason
            </label>
            <textarea
              value={formData.symptoms}
              onChange={(e) =>
                setFormData({ ...formData, symptoms: e.target.value })
              }
              placeholder="Enter patient symptoms or reason for appointment..."
              rows={3}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Additional notes..."
              rows={2}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <ResponsiveButton
              onClick={
                editingAppointment
                  ? handleUpdateAppointment
                  : handleCreateAppointment
              }
              className="bg-blue-600 text-white hover:bg-blue-700"
              fullWidth
            >
              {editingAppointment
                ? "Update Appointment"
                : "Schedule Appointment"}
            </ResponsiveButton>
            <ResponsiveButton
              onClick={() => {
                setShowModal(false);
                setEditingAppointment(null);
                resetForm();
              }}
              variant="outline"
              fullWidth
            >
              Cancel
            </ResponsiveButton>
          </div>
        </div>
      </ResponsiveModal>

      {/* Appointment Details Modal */}
      <ResponsiveModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedAppointment(null);
        }}
        title="Appointment Details"
      >
        {selectedAppointment && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Patient
                </label>
                <p className="text-sm text-gray-900">
                  {selectedAppointment.patient.name}
                </p>
                <p className="text-xs text-gray-500">
                  {selectedAppointment.patient.email}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Doctor
                </label>
                <p className="text-sm text-gray-900">
                  Dr. {selectedAppointment.doctor.name}
                </p>
                <p className="text-xs text-gray-500">
                  {selectedAppointment.doctor.email}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Scheduled
                </label>
                <p className="text-sm text-gray-900">
                  {formatDate(selectedAppointment.scheduled_at)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                    selectedAppointment.status
                  )}`}
                >
                  {selectedAppointment.status.replace("_", " ")}
                </span>
              </div>
            </div>

            {selectedAppointment.symptoms && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Symptoms
                </label>
                <p className="text-sm text-gray-900">
                  {selectedAppointment.symptoms}
                </p>
              </div>
            )}

            {selectedAppointment.notes && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <p className="text-sm text-gray-900">
                  {selectedAppointment.notes}
                </p>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <ResponsiveButton
                onClick={() => {
                  setShowDetailsModal(false);
                  openEditModal(selectedAppointment);
                }}
                className="bg-blue-600 text-white hover:bg-blue-700"
                fullWidth
              >
                Edit Appointment
              </ResponsiveButton>
              <ResponsiveButton
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedAppointment(null);
                }}
                variant="outline"
                fullWidth
              >
                Close
              </ResponsiveButton>
            </div>
          </div>
        )}
      </ResponsiveModal>
    </motion.div>
  );
}
