"use client";

import ExportButton, { prepareExportData } from "@/components/ExportButton";
import {
  ResponsiveButton,
  ResponsiveCard,
  ResponsiveGrid,
  ResponsiveInput,
  ResponsiveModal,
} from "@/components/ResponsiveComponents";
import { formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Activity,
  Clock,
  DollarSign,
  Edit,
  Home,
  Plus,
  TestTube,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";

type LabPackage = {
  id: string;
  name: string;
  description?: string;
  category: string;
  tests_included: string[];
  price: number;
  preparation_required: boolean;
  preparation_instructions?: string;
  sample_type?: string;
  reporting_time?: string;
  is_home_collection: boolean;
  is_active: boolean;
  created_at: string;
} & Record<string, unknown>;

interface LabPackageFormData {
  name: string;
  description?: string;
  category: string;
  tests_included: string[];
  price: number;
  preparation_required: boolean;
  preparation_instructions?: string;
  sample_type?: string;
  reporting_time?: string;
  is_home_collection: boolean;
  is_active: boolean;
}

export default function LabPackageManagement() {
  const [labPackages, setLabPackages] = useState<LabPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<LabPackage | null>(null);

  const [formData, setFormData] = useState<LabPackageFormData>({
    name: "",
    description: "",
    category: "",
    tests_included: [],
    price: 0,
    preparation_required: false,
    preparation_instructions: "",
    sample_type: "",
    reporting_time: "",
    is_home_collection: false,
    is_active: true,
  });

  const [stats, setStats] = useState({
    totalPackages: 0,
    activePackages: 0,
    homeCollectionPackages: 0,
    totalValue: 0,
  });

  const categoriesList = [
    "Blood Test",
    "Urine Test",
    "X-Ray",
    "MRI",
    "CT Scan",
    "Ultrasound",
    "ECG",
    "Pathology",
  ];

  const commonTests = [
    "Complete Blood Count (CBC)",
    "Blood Sugar",
    "Cholesterol",
    "Liver Function Test",
    "Kidney Function Test",
    "Thyroid Function Test",
    "Vitamin D",
    "Vitamin B12",
    "ECG",
    "X-Ray Chest",
  ];

  useEffect(() => {
    fetchLabPackages();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [labPackages]);

  const fetchLabPackages = async () => {
    try {
      setLoading(true);
      setError("");

      // Get token from localStorage or cookies
      const token =
        localStorage.getItem("authToken") ||
        sessionStorage.getItem("authToken");

      if (!token) {
        setError("Authentication token not found. Please log in again.");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/admin/lab-packages", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLabPackages(data.packages || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch lab packages");
      }
    } catch (err) {
      console.error("Error fetching lab packages:", err);
      setError("Network error while loading lab packages");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const totalPackages = labPackages.length;
    const activePackages = labPackages.filter((pkg) => pkg.is_active).length;
    const homeCollectionPackages = labPackages.filter(
      (pkg) => pkg.is_home_collection
    ).length;
    const totalValue = labPackages.reduce(
      (sum, pkg) => sum + Number(pkg.price || 0),
      0
    );

    setStats({
      totalPackages,
      activePackages,
      homeCollectionPackages,
      totalValue,
    });
  };

  const handleCreatePackage = async () => {
    try {
      const token =
        localStorage.getItem("authToken") ||
        sessionStorage.getItem("authToken");
      if (!token) {
        setError("Authentication required. Please log in again.");
        return;
      }

      const response = await fetch("/api/admin/lab-packages", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchLabPackages();
        setShowModal(false);
        resetForm();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to create lab package");
      }
    } catch (err) {
      setError("Error creating lab package");
    }
  };

  const handleUpdatePackage = async () => {
    if (!editingPackage) return;

    try {
      const token =
        localStorage.getItem("authToken") ||
        sessionStorage.getItem("authToken");
      if (!token) {
        setError("Authentication required. Please log in again.");
        return;
      }

      const response = await fetch(
        `/api/admin/lab-packages/${editingPackage.id}`,
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
        await fetchLabPackages();
        setShowModal(false);
        setEditingPackage(null);
        resetForm();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to update lab package");
      }
    } catch (err) {
      setError("Error updating lab package");
    }
  };

  const handleDeletePackage = async (packageId: string) => {
    if (!confirm("Are you sure you want to delete this lab package?")) return;

    try {
      const token =
        localStorage.getItem("authToken") ||
        sessionStorage.getItem("authToken");
      if (!token) {
        setError("Authentication required. Please log in again.");
        return;
      }

      const response = await fetch(`/api/admin/lab-packages/${packageId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchLabPackages();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to delete lab package");
      }
    } catch (err) {
      setError("Error deleting lab package");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
      tests_included: [],
      price: 0,
      preparation_required: false,
      preparation_instructions: "",
      sample_type: "",
      reporting_time: "",
      is_home_collection: false,
      is_active: true,
    });
  };

  const openEditModal = (labPackage: LabPackage) => {
    setEditingPackage(labPackage);
    setFormData({
      name: labPackage.name,
      description: labPackage.description || "",
      category: labPackage.category,
      tests_included: labPackage.tests_included,
      price: labPackage.price,
      preparation_required: labPackage.preparation_required,
      preparation_instructions: labPackage.preparation_instructions || "",
      sample_type: labPackage.sample_type || "",
      reporting_time: labPackage.reporting_time || "",
      is_home_collection: labPackage.is_home_collection,
      is_active: labPackage.is_active,
    });
    setShowModal(true);
  };

  const addTest = (testName: string) => {
    if (!formData.tests_included.includes(testName)) {
      setFormData({
        ...formData,
        tests_included: [...formData.tests_included, testName],
      });
    }
  };

  const removeTest = (testName: string) => {
    setFormData({
      ...formData,
      tests_included: formData.tests_included.filter(
        (test) => test !== testName
      ),
    });
  };

  const filteredPackages = labPackages.filter((labPackage) => {
    const matchesSearch =
      labPackage.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      labPackage.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      !selectedCategory || labPackage.category === selectedCategory;

    return matchesSearch && matchesCategory;
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
            Lab Package Management
          </h1>
          <p className="text-gray-600 mt-2">
            Manage lab test packages, categories, and pricing
          </p>
        </div>
        <ResponsiveButton
          onClick={() => {
            resetForm();
            setEditingPackage(null);
            setShowModal(true);
          }}
          className="bg-gradient-to-r from-blue-500 to-purple-500 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Package
        </ResponsiveButton>
      </div>

      {/* Stats */}
      <ResponsiveGrid cols={{ default: 1, sm: 2, lg: 4 }}>
        {[
          {
            label: "Total Packages",
            value: stats.totalPackages,
            icon: TestTube,
            color: "blue",
          },
          {
            label: "Active Packages",
            value: stats.activePackages,
            icon: Activity,
            color: "green",
          },
          {
            label: "Home Collection",
            value: stats.homeCollectionPackages,
            icon: Home,
            color: "orange",
          },
          {
            label: "Total Value",
            value: formatCurrency(stats.totalValue),
            icon: DollarSign,
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
              label="Search packages"
              placeholder="Search by name or description..."
              value={searchTerm}
              onChange={setSearchTerm}
            />
          </div>
          <div className="w-full sm:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            >
              <option value="">All Categories</option>
              {categoriesList.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <ExportButton
              data={prepareExportData(
                filteredPackages,
                [
                  { key: "name", label: "Package Name" },
                  { key: "category", label: "Category" },
                  {
                    key: "price",
                    label: "Price",
                    format: (value) => formatCurrency(Number(value || 0)),
                  },
                  {
                    key: "tests_included",
                    label: "Tests Count",
                    format: (value) =>
                      Array.isArray(value) ? value.length.toString() : "0",
                  },
                  {
                    key: "is_active",
                    label: "Active",
                    format: (value) => (value ? "Yes" : "No"),
                  },
                ],
                "lab-packages-export"
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

      {/* Packages Grid */}
      <ResponsiveGrid cols={{ default: 1, md: 2, lg: 3 }}>
        {filteredPackages.map((labPackage, index) => (
          <motion.div
            key={labPackage.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -5 }}
          >
            <ResponsiveCard className="h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full w-12 h-12 flex items-center justify-center mr-3">
                    <TestTube className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {labPackage.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {labPackage.category}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      labPackage.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {labPackage.is_active ? "Active" : "Inactive"}
                  </span>
                  {labPackage.is_home_collection && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      Home Collection
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3 mb-4">
                {labPackage.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {labPackage.description}
                  </p>
                )}

                <div className="text-sm text-gray-600">
                  <span className="font-medium">Tests:</span>{" "}
                  {labPackage.tests_included.length} included
                </div>

                {labPackage.reporting_time && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>{labPackage.reporting_time}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-green-600 text-lg">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    {formatCurrency(Number(labPackage.price || 0))}
                  </span>
                  {labPackage.preparation_required && (
                    <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                      Prep Required
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <ResponsiveButton
                  size="sm"
                  variant="outline"
                  onClick={() => openEditModal(labPackage)}
                  fullWidth
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </ResponsiveButton>
                <ResponsiveButton
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeletePackage(labPackage.id)}
                  className="text-red-600 border-red-600 hover:bg-red-50"
                  fullWidth
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
          setEditingPackage(null);
          resetForm();
        }}
        title={editingPackage ? "Edit Lab Package" : "Add New Lab Package"}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ResponsiveInput
              label="Package Name"
              placeholder="Enter package name"
              value={formData.name}
              onChange={(value) => setFormData({ ...formData, name: value })}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="">Select Category</option>
                {categoriesList.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ResponsiveInput
              label="Price"
              type="number"
              placeholder="Enter package price"
              value={formData.price.toString()}
              onChange={(value) =>
                setFormData({ ...formData, price: parseFloat(value) || 0 })
              }
              required
            />
            <ResponsiveInput
              label="Reporting Time"
              placeholder="e.g., 24 hours, 3-5 days"
              value={formData.reporting_time || ""}
              onChange={(value) =>
                setFormData({ ...formData, reporting_time: value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Enter package description..."
              rows={3}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Tests Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Included Tests
            </label>
            <div className="space-y-2">
              {/* Selected tests */}
              {formData.tests_included.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-md">
                  {formData.tests_included.map((test) => (
                    <span
                      key={test}
                      className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                    >
                      {test}
                      <button
                        type="button"
                        onClick={() => removeTest(test)}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Common tests to add */}
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {commonTests
                  .filter((test) => !formData.tests_included.includes(test))
                  .map((test) => (
                    <button
                      key={test}
                      type="button"
                      onClick={() => addTest(test)}
                      className="text-left p-2 text-xs border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-300"
                    >
                      + {test}
                    </button>
                  ))}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.preparation_required}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    preparation_required: e.target.checked,
                  })
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Preparation Required
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_home_collection}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    is_home_collection: e.target.checked,
                  })
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Home Collection
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Active</span>
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <ResponsiveButton
              onClick={
                editingPackage ? handleUpdatePackage : handleCreatePackage
              }
              className="bg-blue-600 text-white hover:bg-blue-700"
              fullWidth
            >
              {editingPackage ? "Update Package" : "Create Package"}
            </ResponsiveButton>
            <ResponsiveButton
              onClick={() => {
                setShowModal(false);
                setEditingPackage(null);
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
