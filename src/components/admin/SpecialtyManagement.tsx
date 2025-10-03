"use client";

import ExportButton, { prepareExportData } from "@/components/ExportButton";
import {
  ResponsiveButton,
  ResponsiveCard,
  ResponsiveGrid,
  ResponsiveInput,
  ResponsiveModal,
} from "@/components/ResponsiveComponents";
import { formatDate } from "@/lib/utils";
import { motion } from "framer-motion";
import { Activity, Archive, Edit, Heart, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

interface Specialty extends Record<string, unknown> {
  id: string;
  name: string;
  description?: string;
  icon_url?: string;
  is_active: boolean;
  created_at: string;
}

interface SpecialtyFormData {
  name: string;
  description?: string;
  icon_url?: string;
  is_active: boolean;
}

export default function SpecialtyManagement() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingSpecialty, setEditingSpecialty] = useState<Specialty | null>(
    null
  );

  const [formData, setFormData] = useState<SpecialtyFormData>({
    name: "",
    description: "",
    icon_url: "",
    is_active: true,
  });

  const [stats, setStats] = useState({
    totalSpecialties: 0,
    activeSpecialties: 0,
    newSpecialtiesThisMonth: 0,
  });

  const calculateStats = () => {
    const totalSpecialties = specialties.length;
    const activeSpecialties = specialties.filter(
      (specialty) => specialty.is_active
    ).length;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const newSpecialtiesThisMonth = specialties.filter((specialty) => {
      const createdDate = new Date(specialty.created_at);
      return (
        createdDate.getMonth() === currentMonth &&
        createdDate.getFullYear() === currentYear
      );
    }).length;

    setStats({ totalSpecialties, activeSpecialties, newSpecialtiesThisMonth });
  };

  useEffect(() => {
    fetchSpecialties();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [specialties, calculateStats]);

  const fetchSpecialties = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/admin/specialties", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSpecialties(data.specialties || []);
      } else {
        setError("Failed to fetch specialties");
      }
    } catch (err: unknown) {
      setError("Error loading specialties");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSpecialty = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/admin/specialties", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchSpecialties();
        setShowModal(false);
        resetForm();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to create specialty");
      }
    } catch (err: unknown) {
      setError("Error creating specialty");
    }
  };

  const handleUpdateSpecialty = async () => {
    if (!editingSpecialty) return;

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `/api/admin/specialties/${editingSpecialty.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        await fetchSpecialties();
        setShowModal(false);
        setEditingSpecialty(null);
        resetForm();
      } else {
        setError("Failed to update specialty");
      }
    } catch (err: unknown) {
      setError("Error updating specialty");
    }
  };

  const handleDeleteSpecialty = async (specialtyId: string) => {
    if (!confirm("Are you sure you want to delete this specialty?")) return;

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`/api/admin/specialties/${specialtyId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchSpecialties();
      } else {
        setError("Failed to delete specialty");
      }
    } catch (err: unknown) {
      setError("Error deleting specialty");
    }
  };

  const handleStatusToggle = async (
    specialtyId: string,
    currentStatus: boolean
  ) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `/api/admin/specialties/${specialtyId}/status`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ is_active: !currentStatus }),
        }
      );

      if (response.ok) {
        await fetchSpecialties();
      } else {
        setError("Failed to update specialty status");
      }
    } catch (err: unknown) {
      setError("Error updating specialty status");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      icon_url: "",
      is_active: true,
    });
  };

  const openEditModal = (specialty: Specialty) => {
    setEditingSpecialty(specialty);
    setFormData({
      name: specialty.name,
      description: specialty.description || "",
      icon_url: specialty.icon_url || "",
      is_active: specialty.is_active,
    });
    setShowModal(true);
  };

  const filteredSpecialties = specialties.filter(
    (specialty) =>
      specialty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      specialty.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            Specialty Management
          </h1>
          <p className="text-gray-600 mt-2">
            Manage medical specialties and categories for doctors
          </p>
        </div>
        <ResponsiveButton
          onClick={() => {
            resetForm();
            setEditingSpecialty(null);
            setShowModal(true);
          }}
          className="bg-gradient-to-r from-blue-500 to-purple-500 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Specialty
        </ResponsiveButton>
      </div>

      {/* Stats */}
      <ResponsiveGrid cols={{ default: 1, sm: 2, lg: 3 }}>
        {[
          {
            label: "Total Specialties",
            value: stats.totalSpecialties,
            icon: Heart,
            color: "blue",
          },
          {
            label: "Active Specialties",
            value: stats.activeSpecialties,
            icon: Activity,
            color: "green",
          },
          {
            label: "Added This Month",
            value: stats.newSpecialtiesThisMonth,
            icon: Plus,
            color: "purple",
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <ResponsiveCard>
              <div className="flex items-center">
                <div className={`bg-${stat.color}-100 rounded-lg p-3`}>
                  <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              </div>
            </ResponsiveCard>
          </motion.div>
        ))}
      </ResponsiveGrid>

      {/* Filters */}
      <ResponsiveCard>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <ResponsiveInput
              label="Search specialties"
              placeholder="Search by name or description..."
              value={searchTerm}
              onChange={setSearchTerm}
            />
          </div>
          <div className="flex items-end">
            <ExportButton
              data={prepareExportData(
                filteredSpecialties,
                [
                  { key: "name", label: "Specialty Name" },
                  { key: "description", label: "Description" },
                  {
                    key: "is_active",
                    label: "Active",
                    format: (value) => (value ? "Yes" : "No"),
                  },
                  {
                    key: "created_at",
                    label: "Created At",
                    format: (value) => formatDate(value as string),
                  },
                ],
                "specialties-export"
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

      {/* Specialties Grid */}
      <ResponsiveGrid cols={{ default: 1, md: 2, lg: 3 }}>
        {filteredSpecialties.map((specialty, index) => (
          <motion.div
            key={specialty.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -5 }}
          >
            <ResponsiveCard className="h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full w-12 h-12 flex items-center justify-center mr-3">
                    {specialty.icon_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={specialty.icon_url}
                        alt={specialty.name}
                        className="w-6 h-6 text-white"
                      />
                    ) : (
                      <Heart className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {specialty.name}
                    </h3>
                    <p className="text-sm text-gray-600">Medical Specialty</p>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    specialty.is_active
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {specialty.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                {specialty.description && (
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {specialty.description}
                  </p>
                )}

                <div className="text-sm text-gray-600">
                  <span className="font-medium">Created:</span>{" "}
                  {formatDate(specialty.created_at)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <ResponsiveButton
                  size="sm"
                  variant="outline"
                  onClick={() => openEditModal(specialty)}
                  fullWidth
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </ResponsiveButton>
                <ResponsiveButton
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    handleStatusToggle(specialty.id, specialty.is_active)
                  }
                  className={
                    specialty.is_active
                      ? "text-orange-600 border-orange-600"
                      : "text-green-600 border-green-600"
                  }
                  fullWidth
                >
                  {specialty.is_active ? (
                    <Archive className="w-4 h-4 mr-2" />
                  ) : (
                    <Activity className="w-4 h-4 mr-2" />
                  )}
                  {specialty.is_active ? "Deactivate" : "Activate"}
                </ResponsiveButton>
              </div>

              <div className="mt-2">
                <ResponsiveButton
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteSpecialty(specialty.id)}
                  className="text-red-600 border-red-600 hover:bg-red-50 w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </ResponsiveButton>
              </div>
            </ResponsiveCard>
          </motion.div>
        ))}
      </ResponsiveGrid>

      {/* Create/Edit Modal */}
      <ResponsiveModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingSpecialty(null);
          resetForm();
        }}
        title={editingSpecialty ? "Edit Specialty" : "Add New Specialty"}
        size="lg"
      >
        <div className="space-y-4">
          <ResponsiveInput
            label="Specialty Name"
            placeholder="Enter specialty name"
            value={formData.name}
            onChange={(value) => setFormData({ ...formData, name: value })}
            required
          />

          <ResponsiveInput
            label="Icon URL (Optional)"
            placeholder="Enter icon URL"
            value={formData.icon_url || ""}
            onChange={(value) => setFormData({ ...formData, icon_url: value })}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Enter specialty description..."
              rows={4}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) =>
                setFormData({ ...formData, is_active: e.target.checked })
              }
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Active Specialty</span>
          </div>

          <div className="flex space-x-3 pt-4">
            <ResponsiveButton
              onClick={
                editingSpecialty ? handleUpdateSpecialty : handleCreateSpecialty
              }
              className="bg-blue-600 text-white hover:bg-blue-700"
              fullWidth
            >
              {editingSpecialty ? "Update Specialty" : "Create Specialty"}
            </ResponsiveButton>
            <ResponsiveButton
              onClick={() => {
                setShowModal(false);
                setEditingSpecialty(null);
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
    </motion.div>
  );
}
