"use client";

import React, { useState, useEffect } from "react";
import {
  ResponsiveButton,
  ResponsiveCard,
  ResponsiveTable,
} from "@/components/ResponsiveComponents";
import { formatDate } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Calendar,
  CheckCircle,
  Clock,
  Phone,
  Stethoscope,
  User,
  Video,
  XCircle,
  FileText,
} from "lucide-react";

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  date_of_birth?: string;
  gender?: string;
  blood_group?: string;
  address?: string;
}

interface Appointment {
  id: string;
  patient_id: string;
  patient: {
    id: string;
    name: string;
    email: string;
    phone: string;
    patient_profile?: {
      date_of_birth?: string;
      gender?: string;
      blood_group?: string;
      address?: string;
    };
  };
  doctor: {
    id: string;
    name: string;
    doctor_profile?: {
      specialties?: string[];
    };
  };
  scheduled_at: string;
  meeting_type: string;
  status: string;
  payment_amount?: number;
  symptoms?: string;
  diagnosis?: string;
}

interface DoctorPatientListProps {
  doctorId?: string;
  doctorName?: string;
  onPrescriptionCreate?: (patient: Patient) => void;
}

export default function DoctorPatientList({
  doctorId,
  doctorName,
  onPrescriptionCreate,
}: DoctorPatientListProps) {
  const [activeTab, setActiveTab] = useState<"patients" | "appointments">(
    "patients"
  );
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (doctorId) {
      fetchDoctorPatientsWithAppointments();
    }
  }, [doctorId]);

  const fetchDoctorPatientsWithAppointments = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("authToken");
      if (!token) {
        window.location.href = "/auth/login";
        return;
      }

      // Fetch confirmed appointments for this doctor
      // Properly encode the status array as a JSON string
      const statusArray = ["CONFIRMED"];
      const statusParam = encodeURIComponent(JSON.stringify(statusArray));
      const response = await fetch(
        `/api/appointments?doctorId=${doctorId}&status=${statusParam}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch appointments");
      }

      const data = await response.json();

      // Extract unique patients from appointments
      const uniquePatients: Patient[] = [];
      const patientMap = new Map<string, Patient>();

      data.appointments.forEach((appointment: Appointment) => {
        if (!patientMap.has(appointment.patient.id)) {
          patientMap.set(appointment.patient.id, {
            id: appointment.patient.id,
            name: appointment.patient.name,
            email: appointment.patient.email,
            phone: appointment.patient.phone,
            date_of_birth: appointment.patient.patient_profile?.date_of_birth,
            gender: appointment.patient.patient_profile?.gender,
            blood_group: appointment.patient.patient_profile?.blood_group,
            address: appointment.patient.patient_profile?.address,
          });
        }
      });

      patientMap.forEach((patient) => uniquePatients.push(patient));

      setPatients(uniquePatients);
      setAppointments(data.appointments);
    } catch (err) {
      console.error("Error fetching patients and appointments:", err);
      setError("Failed to load patient and appointment data");
    } finally {
      setLoading(false);
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
        return <Clock className="h-4 w-4" />;
      case "CONFIRMED":
        return <CheckCircle className="h-4 w-4" />;
      case "COMPLETED":
        return <CheckCircle className="h-4 w-4" />;
      case "CANCELLED":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Function to trigger prescription creation for a patient
  const onCreatePrescription = (patient: Patient) => {
    if (onPrescriptionCreate) {
      onPrescriptionCreate(patient);
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">My Patients</h2>
          <p className="text-gray-600 mt-1">
            View your patients with confirmed appointments
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <ResponsiveButton
            variant={activeTab === "patients" ? "primary" : "outline"}
            onClick={() => setActiveTab("patients")}
            className="rounded-full"
          >
            Patient List
          </ResponsiveButton>
          <ResponsiveButton
            variant={activeTab === "appointments" ? "primary" : "outline"}
            onClick={() => setActiveTab("appointments")}
            className="rounded-full"
          >
            Confirmed Appointments
          </ResponsiveButton>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {activeTab === "patients" ? (
        <ResponsiveCard>
          <div className="overflow-x-auto">
            <ResponsiveTable>
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Personal Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {patients.map((patient) => (
                  <motion.tr
                    key={patient.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full w-10 h-10 flex items-center justify-center text-white font-bold mr-3">
                          {patient.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {patient.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {patient.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {patient.email}
                      </div>
                      <div className="text-sm text-gray-500">
                        {patient.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {patient.gender} ({patient.blood_group})
                      </div>
                      <div className="text-sm text-gray-500">
                        DOB:{" "}
                        {patient.date_of_birth
                          ? formatDate(patient.date_of_birth)
                          : "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <ResponsiveButton
                          size="sm"
                          variant="outline"
                          onClick={() => setActiveTab("appointments")}
                          className="rounded-full"
                        >
                          View Appointments
                        </ResponsiveButton>
                        <ResponsiveButton
                          size="sm"
                          variant="primary"
                          onClick={() => onCreatePrescription(patient)}
                          className="rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Create Prescription
                        </ResponsiveButton>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </ResponsiveTable>
          </div>
        </ResponsiveCard>
      ) : (
        <ResponsiveCard>
          <div className="overflow-x-auto">
            <ResponsiveTable>
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Appointment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
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
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {appointments.map((appointment) => (
                  <motion.tr
                    key={appointment.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        #{appointment.id.substring(0, 8)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-full w-8 h-8 flex items-center justify-center text-white text-xs font-bold mr-2">
                          {appointment.patient.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {appointment.patient.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {appointment.patient.email}
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
                      <div className="flex items-center text-sm text-gray-900">
                        <Stethoscope className="h-4 w-4 mr-1" />
                        {appointment.meeting_type}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          appointment.status
                        )}`}
                      >
                        <span className="flex items-center">
                          {getStatusIcon(appointment.status)}
                          <span className="ml-1">{appointment.status}</span>
                        </span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {appointment.payment_amount
                        ? `$${appointment.payment_amount.toFixed(2)}`
                        : "N/A"}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </ResponsiveTable>
          </div>
        </ResponsiveCard>
      )}
    </div>
  );
}
