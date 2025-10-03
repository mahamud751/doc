"use client";

import {
  ResponsiveButton,
  ResponsiveCard,
  ResponsiveModal,
} from "@/components/ResponsiveComponents";
import { formatDate } from "@/lib/utils";
import { motion } from "framer-motion";
import { Calendar, FileText, Mail, Phone, User } from "lucide-react";
import React, { useEffect, useState } from "react";

interface Document {
  name: string;
  url: string;
  type: string;
}

interface PendingDoctor {
  id: string;
  doctor_id: string;
  name: string;
  email: string;
  phone: string;
  specialties: string[];
  qualifications: string[];
  experience_years: number;
  consultation_fee: number;
  medical_license: string;
  documents: Document[];
  bio: string;
  submitted_at: string;
  status: string;
}

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: PendingDoctor | null;
  onVerify: (
    doctorId: string,
    action: "APPROVED" | "REJECTED",
    rejectionReason?: string
  ) => void;
}

const VerificationModal: React.FC<VerificationModalProps> = ({
  isOpen,
  onClose,
  doctor,
  onVerify,
}) => {
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!doctor) return null;

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await onVerify(doctor.id, "APPROVED");
      onClose();
    } catch (error) {
      console.error("Error approving doctor:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }

    setIsSubmitting(true);
    try {
      await onVerify(doctor.id, "REJECTED", rejectionReason);
      setRejectionReason("");
      onClose();
    } catch (error) {
      console.error("Error rejecting doctor:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="Doctor Verification"
      size="lg"
    >
      <div className="space-y-6">
        <ResponsiveCard>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Dr. {doctor.name}
              </h3>
              <p className="text-gray-600">
                Medical License: {doctor.medical_license}
              </p>
            </div>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
              Pending
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center text-gray-600">
              <Mail className="w-4 h-4 mr-2" />
              <span>{doctor.email}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Phone className="w-4 h-4 mr-2" />
              <span>{doctor.phone}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Calendar className="w-4 h-4 mr-2" />
              <span>Experience: {doctor.experience_years} years</span>
            </div>
            <div className="flex items-center text-gray-600">
              <span>Consultation Fee: ${doctor.consultation_fee}</span>
            </div>
          </div>

          <div className="mt-4">
            <h4 className="font-medium text-gray-900 mb-2">Specialties</h4>
            <div className="flex flex-wrap gap-2">
              {doctor.specialties.map((specialty, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                >
                  {specialty}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <h4 className="font-medium text-gray-900 mb-2">Qualifications</h4>
            <div className="flex flex-wrap gap-2">
              {doctor.qualifications.map((qualification, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                >
                  {qualification}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <h4 className="font-medium text-gray-900 mb-2">Bio</h4>
            <p className="text-gray-600">{doctor.bio || "No bio provided"}</p>
          </div>

          <div className="mt-4">
            <h4 className="font-medium text-gray-900 mb-2">Documents</h4>
            {doctor.documents && doctor.documents.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {doctor.documents.map((doc, index) => (
                  <div
                    key={index}
                    className="flex items-center px-3 py-2 bg-gray-100 rounded-lg"
                  >
                    <FileText className="w-4 h-4 mr-2 text-gray-600" />
                    <span className="text-sm text-gray-700">
                      {doc.name || `Document ${index + 1}`}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No documents submitted</p>
            )}
          </div>

          <div className="mt-4">
            <h4 className="font-medium text-gray-900 mb-2">Submitted At</h4>
            <p className="text-gray-600">{formatDate(doctor.submitted_at)}</p>
          </div>
        </ResponsiveCard>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rejection Reason (required for rejection)
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason for rejection..."
              rows={3}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
          <ResponsiveButton
            onClick={onClose}
            variant="outline"
            disabled={isSubmitting}
          >
            Cancel
          </ResponsiveButton>
          <ResponsiveButton
            onClick={handleReject}
            className="bg-red-600 hover:bg-red-700 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Rejecting..." : "Reject Doctor"}
          </ResponsiveButton>
          <ResponsiveButton
            onClick={handleApprove}
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Approving..." : "Approve Doctor"}
          </ResponsiveButton>
        </div>
      </div>
    </ResponsiveModal>
  );
};

export default function DoctorVerificationTab() {
  const [pendingDoctors, setPendingDoctors] = useState<PendingDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<PendingDoctor | null>(
    null
  );
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchPendingDoctors();
  }, []);

  const fetchPendingDoctors = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/admin/doctors/pending", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPendingDoctors(data.doctors || []);
      } else {
        setError("Failed to fetch pending doctors");
      }
    } catch (err) {
      setError("Error loading pending doctors");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDoctor = async (
    verificationId: string,
    action: "APPROVED" | "REJECTED",
    rejectionReason?: string
  ) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/admin/doctors/pending", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          verification_id: verificationId,
          action,
          rejection_reason: rejectionReason,
        }),
      });

      if (response.ok) {
        await fetchPendingDoctors();
        // Show success message
      } else {
        setError("Failed to verify doctor");
      }
    } catch (err) {
      setError("Error verifying doctor");
    }
  };

  const openVerificationModal = (doctor: PendingDoctor) => {
    setSelectedDoctor(doctor);
    setShowModal(true);
  };

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
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Doctor Verification
        </h1>
        <p className="text-gray-600 mt-2">
          Review and verify pending doctor applications
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Pending Doctors List */}
      {pendingDoctors.length === 0 ? (
        <ResponsiveCard>
          <div className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No pending verifications
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              All doctors have been verified or there are no new applications.
            </p>
          </div>
        </ResponsiveCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingDoctors.map((doctor, index) => (
            <motion.div
              key={doctor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <ResponsiveCard>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Dr. {doctor.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {doctor.specialties[0] || "General Medicine"}
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                    Pending
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-4 h-4 mr-2" />
                    {doctor.email}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-2" />
                    {doctor.phone}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <FileText className="w-4 h-4 mr-2" />
                    License: {doctor.medical_license}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-1">
                  {doctor.specialties.slice(0, 3).map((specialty, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {specialty}
                    </span>
                  ))}
                  {doctor.specialties.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{doctor.specialties.length - 3} more
                    </span>
                  )}
                </div>

                <div className="mt-4 flex space-x-2">
                  <ResponsiveButton
                    size="sm"
                    onClick={() => openVerificationModal(doctor)}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                    fullWidth
                  >
                    Review
                  </ResponsiveButton>
                </div>
              </ResponsiveCard>
            </motion.div>
          ))}
        </div>
      )}

      <VerificationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        doctor={selectedDoctor}
        onVerify={handleVerifyDoctor}
      />
    </motion.div>
  );
}
