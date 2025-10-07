"use client";

import ExportButton, { prepareExportData } from "@/components/ExportButton";
import {
  ResponsiveButton,
  ResponsiveCard,
  ResponsiveGrid,
  ResponsiveInput,
  ResponsiveModal,
} from "@/components/ResponsiveComponents";
import { formatCurrency, formatDate } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  DollarSign,
  Edit,
  Package,
  Pill,
  Plus,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface Medicine extends Record<string, unknown> {
  id: string;
  name: string;
  generic_name?: string;
  brand_name?: string;
  manufacturer?: string;
  category: string;
  strength: string;
  unit_price: number;
  stock_quantity: number;
  description?: string;
  prescription_required: boolean;
  is_active: boolean;
  created_at: string;
}

interface MedicineFormData {
  name: string;
  generic_name?: string;
  brand_name?: string;
  manufacturer?: string;
  category: string;
  strength: string;
  unit_price: number;
  stock_quantity: number;
  description?: string;
  prescription_required: boolean;
  is_active: boolean;
}

export default function MedicineManagement() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);

  const [formData, setFormData] = useState<MedicineFormData>({
    name: "",
    generic_name: "",
    brand_name: "",
    manufacturer: "",
    category: "",
    strength: "",
    unit_price: 0,
    stock_quantity: 0,
    description: "",
    prescription_required: true,
    is_active: true,
  });

  const [stats, setStats] = useState({
    totalMedicines: 0,
    activeMedicines: 0,
    lowStockMedicines: 0,
    totalValue: 0,
  });

  const categoriesList = [
    "Tablet",
    "Capsule",
    "Syrup",
    "Injection",
    "Cream",
    "Ointment",
    "Drops",
    "Inhaler",
  ];

  const fetchMedicines = useCallback(async (retryCount = 0) => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("Authentication required");
        setLoading(false);
        return;
      }

      console.log(`Fetching medicines (attempt ${retryCount + 1})...`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch("/api/admin/medicines", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        setMedicines(data.medicines || []);
        console.log(
          `Successfully fetched ${data.medicines?.length || 0} medicines`
        );
      } else {
        throw new Error(`HTTP ${response.status}: Failed to fetch medicines`);
      }
    } catch (error: unknown) {
      console.error("Error loading medicines:", error);

      if (
        retryCount < 3 &&
        error instanceof Error &&
        !error.message.includes("Authentication")
      ) {
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`Retrying in ${delay}ms... (attempt ${retryCount + 1}/3)`);
        setTimeout(() => {
          fetchMedicines(retryCount + 1);
        }, delay);
        return;
      }

      const errorMessage =
        error instanceof Error ? error.message : "Error loading medicines";
      setError(
        errorMessage.includes("Authentication")
          ? "Authentication required - please log in again"
          : `Failed to load medicines after ${
              retryCount + 1
            } attempts. Please refresh the page.`
      );
    } finally {
      if (retryCount === 0) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchMedicines(0);

    // Add loading timeout
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.warn(
          "Medicine management loading timeout - forcing completion"
        );
        setError("Loading timeout after 15 seconds. Please refresh the page.");
        setLoading(false);
      }
    }, 15000);

    return () => clearTimeout(loadingTimeout);
  }, [fetchMedicines]);

  const calculateStats = useCallback(() => {
    const totalMedicines = medicines.length;
    const activeMedicines = medicines.filter((med) => med.is_active).length;
    const lowStockMedicines = medicines.filter(
      (med) => med.stock_quantity < 10
    ).length;
    const totalValue = medicines.reduce(
      (sum, med) => sum + med.unit_price * med.stock_quantity,
      0
    );

    setStats({
      totalMedicines,
      activeMedicines,
      lowStockMedicines,
      totalValue,
    });
  }, [medicines]);

  useEffect(() => {
    calculateStats();
  }, [medicines, calculateStats]);

  const handleCreateMedicine = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/admin/medicines", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchMedicines(0);
        setShowModal(false);
        resetForm();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to create medicine");
      }
    } catch (_error: unknown) {
      setError("Error creating medicine");
    }
  };

  const handleUpdateMedicine = async () => {
    if (!editingMedicine) return;

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `/api/admin/medicines/${editingMedicine.id}`,
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
        await fetchMedicines(0);
        setShowModal(false);
        setEditingMedicine(null);
        resetForm();
      } else {
        setError("Failed to update medicine");
      }
    } catch (_error: unknown) {
      setError("Error updating medicine");
    }
  };

  const handleDeleteMedicine = async (medicineId: string) => {
    if (!confirm("Are you sure you want to delete this medicine?")) return;

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`/api/admin/medicines/${medicineId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchMedicines(0);
      } else {
        setError("Failed to delete medicine");
      }
    } catch (_error: unknown) {
      setError("Error deleting medicine");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      generic_name: "",
      brand_name: "",
      manufacturer: "",
      category: "",
      strength: "",
      unit_price: 0,
      stock_quantity: 0,
      description: "",
      prescription_required: true,
      is_active: true,
    });
  };

  const openEditModal = (medicine: Medicine) => {
    setEditingMedicine(medicine);
    setFormData({
      name: medicine.name,
      generic_name: medicine.generic_name || "",
      brand_name: medicine.brand_name || "",
      manufacturer: medicine.manufacturer || "",
      category: medicine.category,
      strength: medicine.strength,
      unit_price: medicine.unit_price,
      stock_quantity: medicine.stock_quantity,
      description: medicine.description || "",
      prescription_required: medicine.prescription_required,
      is_active: medicine.is_active,
    });
    setShowModal(true);
  };

  const getStockStatus = (stock: number) => {
    if (stock < 10)
      return { status: "Critical", color: "bg-red-100 text-red-800" };
    if (stock < 50)
      return { status: "Low", color: "bg-yellow-100 text-yellow-800" };
    return { status: "Good", color: "bg-green-100 text-green-800" };
  };

  const filteredMedicines = medicines.filter((medicine) => {
    const matchesSearch =
      medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medicine.generic_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medicine.brand_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      !selectedCategory || medicine.category === selectedCategory;

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
            Medicine Management
          </h1>
          <p className="text-gray-600 mt-2">
            Manage medicine inventory, categories, and stock levels
          </p>
        </div>
        <ResponsiveButton
          onClick={() => {
            resetForm();
            setEditingMedicine(null);
            setShowModal(true);
          }}
          className="bg-gradient-to-r from-blue-500 to-purple-500 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Medicine
        </ResponsiveButton>
      </div>

      {/* Stats */}
      <ResponsiveGrid cols={{ default: 1, sm: 2, lg: 4 }}>
        {[
          {
            label: "Total Medicines",
            value: stats.totalMedicines,
            icon: Pill,
            color: "blue",
          },
          {
            label: "Active Medicines",
            value: stats.activeMedicines,
            icon: Activity,
            color: "green",
          },
          {
            label: "Low Stock",
            value: stats.lowStockMedicines,
            icon: AlertTriangle,
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
              label="Search medicines"
              placeholder="Search by name, generic name, or brand..."
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
                filteredMedicines,
                [
                  { key: "name", label: "Name" },
                  { key: "category", label: "Category" },
                  { key: "strength", label: "Strength" },
                  {
                    key: "unit_price",
                    label: "Unit Price",
                    format: (value) => formatCurrency(Number(value)),
                  },
                  { key: "stock_quantity", label: "Stock Quantity" },
                  {
                    key: "is_active",
                    label: "Active",
                    format: (value) => (value ? "Yes" : "No"),
                  },
                ],
                "medicines-export"
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

      {/* Medicines Grid */}
      <ResponsiveGrid cols={{ default: 1, md: 2, lg: 3 }}>
        {filteredMedicines.map((medicine, index) => {
          const stockStatus = getStockStatus(medicine.stock_quantity);
          return (
            <motion.div
              key={medicine.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <ResponsiveCard className="h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full w-12 h-12 flex items-center justify-center mr-3">
                      <Pill className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {medicine.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {medicine.category} - {medicine.strength}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        medicine.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {medicine.is_active ? "Active" : "Inactive"}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${stockStatus.color}`}
                    >
                      {stockStatus.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  {medicine.generic_name && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Generic:</span>{" "}
                      {medicine.generic_name}
                    </div>
                  )}
                  {medicine.brand_name && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Brand:</span>{" "}
                      {medicine.brand_name}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      <Package className="w-4 h-4 inline mr-1" />
                      Stock: {medicine.stock_quantity}
                    </span>
                    <span className="font-semibold text-green-600">
                      <DollarSign className="w-4 h-4 inline mr-1" />
                      {formatCurrency(medicine.unit_price)}
                    </span>
                  </div>
                  {medicine.prescription_required && (
                    <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                      Prescription Required
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <ResponsiveButton
                    size="sm"
                    variant="outline"
                    onClick={() => openEditModal(medicine)}
                    fullWidth
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </ResponsiveButton>
                  <ResponsiveButton
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteMedicine(medicine.id)}
                    className="text-red-600 border-red-600 hover:bg-red-50"
                    fullWidth
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </ResponsiveButton>
                </div>
              </ResponsiveCard>
            </motion.div>
          );
        })}
      </ResponsiveGrid>

      {/* Create/Edit Modal */}
      <ResponsiveModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingMedicine(null);
          resetForm();
        }}
        title={editingMedicine ? "Edit Medicine" : "Add New Medicine"}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ResponsiveInput
              label="Medicine Name"
              placeholder="Enter medicine name"
              value={formData.name}
              onChange={(value) => setFormData({ ...formData, name: value })}
              required
            />
            <ResponsiveInput
              label="Generic Name"
              placeholder="Enter generic name"
              value={formData.generic_name || ""}
              onChange={(value) =>
                setFormData({ ...formData, generic_name: value })
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ResponsiveInput
              label="Brand Name"
              placeholder="Enter brand name"
              value={formData.brand_name || ""}
              onChange={(value) =>
                setFormData({ ...formData, brand_name: value })
              }
            />
            <ResponsiveInput
              label="Manufacturer"
              placeholder="Enter manufacturer"
              value={formData.manufacturer || ""}
              onChange={(value) =>
                setFormData({ ...formData, manufacturer: value })
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <ResponsiveInput
              label="Strength"
              placeholder="e.g., 500mg, 10ml"
              value={formData.strength}
              onChange={(value) =>
                setFormData({ ...formData, strength: value })
              }
              required
            />
            <ResponsiveInput
              label="Unit Price"
              type="number"
              placeholder="Enter unit price"
              value={formData.unit_price.toString()}
              onChange={(value) =>
                setFormData({ ...formData, unit_price: parseFloat(value) || 0 })
              }
              required
            />
          </div>

          <ResponsiveInput
            label="Stock Quantity"
            type="number"
            placeholder="Enter stock quantity"
            value={formData.stock_quantity.toString()}
            onChange={(value) =>
              setFormData({ ...formData, stock_quantity: parseInt(value) || 0 })
            }
            required
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
              placeholder="Enter medicine description..."
              rows={3}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center space-x-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.prescription_required}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    prescription_required: e.target.checked,
                  })
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Prescription Required
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
              <span className="ml-2 text-sm text-gray-700">
                Active Medicine
              </span>
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <ResponsiveButton
              onClick={
                editingMedicine ? handleUpdateMedicine : handleCreateMedicine
              }
              className="bg-blue-600 text-white hover:bg-blue-700"
              fullWidth
            >
              {editingMedicine ? "Update Medicine" : "Create Medicine"}
            </ResponsiveButton>
            <ResponsiveButton
              onClick={() => {
                setShowModal(false);
                setEditingMedicine(null);
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
