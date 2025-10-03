"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Package,
  AlertTriangle,
  Filter,
  Download,
  Clock,
  Shield,
  TrendingUp,
  ArrowLeft,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import NavigationHeader from "@/components/NavigationHeader";
import Link from "next/link";
import MedicineCard from "@/components/MedicineCard";

interface Medicine {
  id: string;
  name: string;
  generic_name: string;
  manufacturer: string;
  category: string;
  strength: string;
  unit_price: number;
  stock_quantity: number;
  prescription_required: boolean;
  expiry_date: string;
  batch_number: string;
  description: string;
  side_effects: string;
  contraindications: string;
  storage_instructions: string;
}

export default function MedicineManagement() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [sortBy, setSortBy] = useState<
    "name" | "category" | "stock" | "expiry"
  >("name");
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    "Pain Relief",
    "Antibiotic",
    "Acid Reducer",
    "Anti-inflammatory",
    "Diabetes",
    "Blood Pressure",
    "Cholesterol",
  ];

  const [newMedicine, setNewMedicine] = useState<Partial<Medicine>>({
    name: "",
    generic_name: "",
    manufacturer: "",
    category: "",
    strength: "",
    unit_price: 0,
    stock_quantity: 0,
    prescription_required: false,
    expiry_date: "",
    batch_number: "",
    description: "",
    side_effects: "",
    contraindications: "",
    storage_instructions: "",
  });

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/medicines");
      if (!response.ok) {
        throw new Error("Failed to fetch medicines");
      }

      const data = await response.json();
      setMedicines(data.medicines || []);
    } catch (error: any) {
      console.error("Error fetching medicines:", error);
      setError(error.message || "Failed to load medicines");
    } finally {
      setLoading(false);
    }
  };

  const filteredMedicines = medicines
    .filter(
      (medicine) =>
        medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicine.generic_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        medicine.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(
      (medicine) =>
        selectedCategory === "" || medicine.category === selectedCategory
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "category":
          return a.category.localeCompare(b.category);
        case "stock":
          return b.stock_quantity - a.stock_quantity;
        case "expiry":
          return (
            new Date(a.expiry_date).getTime() -
            new Date(b.expiry_date).getTime()
          );
        default:
          return 0;
      }
    });

  const handleAddMedicine = async () => {
    if (!newMedicine.name || !newMedicine.category || !newMedicine.unit_price) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("authToken");

      const response = await fetch("/api/medicines", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newMedicine),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add medicine");
      }

      const data = await response.json();
      setMedicines([...medicines, data.medicine]);
      setNewMedicine({});
      setShowAddForm(false);
    } catch (error: any) {
      console.error("Error adding medicine:", error);
      alert(error.message || "Failed to add medicine");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditMedicine = (medicine: Medicine) => {
    setEditingMedicine(medicine);
    setNewMedicine(medicine);
    setShowAddForm(true);
  };

  const handleUpdateMedicine = async () => {
    if (
      !editingMedicine ||
      !newMedicine.name ||
      !newMedicine.category ||
      !newMedicine.unit_price
    ) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("authToken");

      const response = await fetch("/api/medicines", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: editingMedicine.id,
          ...newMedicine,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update medicine");
      }

      const data = await response.json();
      setMedicines(
        medicines.map((med) =>
          med.id === editingMedicine.id ? data.medicine : med
        )
      );
      setNewMedicine({});
      setShowAddForm(false);
      setEditingMedicine(null);
    } catch (error: any) {
      console.error("Error updating medicine:", error);
      alert(error.message || "Failed to update medicine");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMedicine = async (id: string) => {
    if (!confirm("Are you sure you want to delete this medicine?")) {
      return;
    }

    try {
      const token = localStorage.getItem("authToken");

      const response = await fetch(`/api/medicines?id=${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete medicine");
      }

      setMedicines(medicines.filter((med) => med.id !== id));
    } catch (error: any) {
      console.error("Error deleting medicine:", error);
      alert(error.message || "Failed to delete medicine");
    }
  };

  const getLowStockCount = () =>
    medicines.filter((med) => med.stock_quantity < 50).length;
  const getExpiringCount = () => {
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
    return medicines.filter(
      (med) => new Date(med.expiry_date) <= sixMonthsFromNow
    ).length;
  };

  const totalStockValue = medicines
    .reduce(
      (sum, med) => sum + Number(med.unit_price) * Number(med.stock_quantity),
      0
    )
    .toFixed(2);

  const stats = [
    {
      label: "Total Medicines",
      value: medicines.length,
      icon: Package,
      color: "from-blue-500 to-cyan-500",
      bgColor: "from-blue-50 to-cyan-50",
    },
    {
      label: "Stock Value",
      value: `$${totalStockValue}`,
      icon: TrendingUp,
      color: "from-green-500 to-emerald-500",
      bgColor: "from-green-50 to-emerald-50",
    },
    {
      label: "Low Stock",
      value: getLowStockCount(),
      icon: AlertTriangle,
      color: "from-yellow-500 to-orange-500",
      bgColor: "from-yellow-50 to-orange-50",
    },
    {
      label: "Expiring Soon",
      value: getExpiringCount(),
      icon: Clock,
      color: "from-red-500 to-pink-500",
      bgColor: "from-red-50 to-pink-50",
    },
  ];

  const exportToCSV = () => {
    const headers = [
      "Name",
      "Generic Name",
      "Manufacturer",
      "Category",
      "Strength",
      "Price",
      "Stock",
      "Prescription Required",
      "Expiry Date",
    ];
    const csvContent = [
      headers.join(","),
      ...filteredMedicines.map((med) =>
        [
          med.name,
          med.generic_name,
          med.manufacturer,
          med.category,
          med.strength,
          med.unit_price,
          med.stock_quantity,
          med.prescription_required,
          med.expiry_date,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "medicines-inventory.csv";
    a.click();
  };

  const isLowStock = (stock: number) => stock < 50;
  const isExpiringSoon = (expiry: string) => {
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
    return new Date(expiry) <= sixMonthsFromNow;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0">
          <motion.div
            animate={{
              background: [
                "radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.05) 0%, transparent 50%)",
                "radial-gradient(circle at 80% 20%, rgba(168, 85, 247, 0.05) 0%, transparent 50%)",
                "radial-gradient(circle at 40% 80%, rgba(14, 165, 233, 0.05) 0%, transparent 50%)",
                "radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.05) 0%, transparent 50%)",
              ],
            }}
            transition={{ duration: 15, repeat: Infinity }}
            className="absolute inset-0"
          />
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center relative z-10"
        >
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-3xl shadow-2xl mb-6 mx-auto w-24 h-24 flex items-center justify-center">
            <Loader2 className="h-12 w-12 text-white animate-spin" />
          </div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Loading Medicines...
          </h3>
          <p className="text-gray-600 mt-2">Fetching inventory data</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-white/30"
        >
          <div className="bg-red-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <Package className="w-10 h-10 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Error Loading Medicines
          </h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={fetchMedicines}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-full shadow-lg"
            >
              Try Again
            </Button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0">
        <motion.div
          animate={{
            background: [
              "radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.05) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 20%, rgba(168, 85, 247, 0.05) 0%, transparent 50%)",
              "radial-gradient(circle at 40% 80%, rgba(14, 165, 233, 0.05) 0%, transparent 50%)",
              "radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.05) 0%, transparent 50%)",
            ],
          }}
          transition={{ duration: 15, repeat: Infinity }}
          className="absolute inset-0"
        />
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 left-0 w-96 h-96 bg-blue-300/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-0 right-0 w-96 h-96 bg-purple-300/10 rounded-full blur-3xl"
        />
      </div>

      {/* Navigation Header */}
      <NavigationHeader currentPage="medicine-management" />

      <div className="relative z-10 p-6 pt-32">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <Link href="/admin/dashboard">
              <Button
                variant="outline"
                className="rounded-full border-2 px-6 py-3 flex items-center space-x-2"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Dashboard</span>
              </Button>
            </Link>
          </motion.div>

          {/* Enhanced Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-8 mb-8"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl"
                >
                  <Package className="text-white" size={32} />
                </motion.div>
                <div>
                  <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2"
                  >
                    Medicine Management
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-gray-600 text-lg"
                  >
                    Manage inventory, pricing, and medicine information with
                    advanced analytics
                  </motion.p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={exportToCSV}
                    variant="outline"
                    className="rounded-2xl px-6 py-3 border-2"
                  >
                    <Download size={20} className="mr-2" />
                    Export CSV
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={() => setShowAddForm(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-2xl px-6 py-3 font-semibold shadow-lg"
                  >
                    <Plus size={20} className="mr-2" />
                    Add Medicine
                  </Button>
                </motion.div>
              </div>
            </div>

            {/* Enhanced Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className={`bg-gradient-to-br ${stat.bgColor} rounded-3xl p-6 border border-white/50 shadow-lg`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium mb-2">
                        {stat.label}
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {stat.value}
                      </p>
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.2, rotate: 10 }}
                      className={`p-3 bg-gradient-to-r ${stat.color} rounded-2xl shadow-lg`}
                    >
                      <stat.icon className="text-white" size={24} />
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/30 p-8 mb-8"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 text-black">
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 flex-1">
                <motion.div
                  whileFocus={{ scale: 1.02 }}
                  className="relative flex-1 max-w-md"
                >
                  <Search
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Search medicines by name, generic or manufacturer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                  />
                </motion.div>
                <motion.select
                  whileFocus={{ scale: 1.02 }}
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </motion.select>
              </div>
              <div className="flex items-center space-x-2">
                <Filter size={20} className="text-gray-400" />
                <motion.select
                  whileFocus={{ scale: 1.02 }}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                >
                  <option value="name">Sort by Name</option>
                  <option value="category">Sort by Category</option>
                  <option value="stock">Sort by Stock</option>
                  <option value="expiry">Sort by Expiry</option>
                </motion.select>
              </div>
            </div>
          </motion.div>

          {/* Medicine Cards Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
          >
            {filteredMedicines.map((medicine, index) => (
              <MedicineCard
                key={medicine.id}
                medicine={medicine}
                onEdit={handleEditMedicine}
                onDelete={handleDeleteMedicine}
              />
            ))}
          </motion.div>

          {/* Add/Edit Medicine Modal */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="bg-white/80 backdrop-blur-xl rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl border border-white/30"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                        <Plus className="text-white" size={24} />
                      </div>
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {editingMedicine ? "Edit Medicine" : "Add New Medicine"}
                      </h2>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setShowAddForm(false);
                        setEditingMedicine(null);
                        setNewMedicine({});
                      }}
                      className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <X className="h-6 w-6 text-gray-600" />
                    </motion.button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-black">
                    <motion.div whileFocus={{ scale: 1.02 }}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Medicine Name *
                      </label>
                      <input
                        type="text"
                        value={newMedicine.name || ""}
                        onChange={(e) =>
                          setNewMedicine((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 bg-white/50 backdrop-blur-sm"
                      />
                    </motion.div>

                    <motion.div whileFocus={{ scale: 1.02 }}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Generic Name
                      </label>
                      <input
                        type="text"
                        value={newMedicine.generic_name || ""}
                        onChange={(e) =>
                          setNewMedicine((prev) => ({
                            ...prev,
                            generic_name: e.target.value,
                          }))
                        }
                        className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 bg-white/50 backdrop-blur-sm"
                      />
                    </motion.div>

                    <motion.div whileFocus={{ scale: 1.02 }}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Manufacturer
                      </label>
                      <input
                        type="text"
                        value={newMedicine.manufacturer || ""}
                        onChange={(e) =>
                          setNewMedicine((prev) => ({
                            ...prev,
                            manufacturer: e.target.value,
                          }))
                        }
                        className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 bg-white/50 backdrop-blur-sm"
                      />
                    </motion.div>

                    <motion.div whileFocus={{ scale: 1.02 }}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category *
                      </label>
                      <select
                        value={newMedicine.category || ""}
                        onChange={(e) =>
                          setNewMedicine((prev) => ({
                            ...prev,
                            category: e.target.value,
                          }))
                        }
                        className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 bg-white/50 backdrop-blur-sm"
                      >
                        <option value="">Select Category</option>
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </motion.div>

                    <motion.div whileFocus={{ scale: 1.02 }}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Strength
                      </label>
                      <input
                        type="text"
                        value={newMedicine.strength || ""}
                        onChange={(e) =>
                          setNewMedicine((prev) => ({
                            ...prev,
                            strength: e.target.value,
                          }))
                        }
                        className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 bg-white/50 backdrop-blur-sm"
                        placeholder="e.g., 500mg, 10ml"
                      />
                    </motion.div>

                    <motion.div whileFocus={{ scale: 1.02 }}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unit Price *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={newMedicine.unit_price || ""}
                        onChange={(e) =>
                          setNewMedicine((prev) => ({
                            ...prev,
                            unit_price: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 bg-white/50 backdrop-blur-sm"
                      />
                    </motion.div>

                    <motion.div whileFocus={{ scale: 1.02 }}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Stock Quantity
                      </label>
                      <input
                        type="number"
                        value={newMedicine.stock_quantity || ""}
                        onChange={(e) =>
                          setNewMedicine((prev) => ({
                            ...prev,
                            stock_quantity: parseInt(e.target.value) || 0,
                          }))
                        }
                        className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 bg-white/50 backdrop-blur-sm"
                      />
                    </motion.div>

                    <motion.div whileFocus={{ scale: 1.02 }}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expiry Date
                      </label>
                      <input
                        type="date"
                        value={newMedicine.expiry_date || ""}
                        onChange={(e) =>
                          setNewMedicine((prev) => ({
                            ...prev,
                            expiry_date: e.target.value,
                          }))
                        }
                        className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 bg-white/50 backdrop-blur-sm"
                      />
                    </motion.div>

                    <motion.div whileFocus={{ scale: 1.02 }}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Batch Number
                      </label>
                      <input
                        type="text"
                        value={newMedicine.batch_number || ""}
                        onChange={(e) =>
                          setNewMedicine((prev) => ({
                            ...prev,
                            batch_number: e.target.value,
                          }))
                        }
                        className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 bg-white/50 backdrop-blur-sm"
                      />
                    </motion.div>

                    <motion.div
                      className="md:col-span-2"
                      whileFocus={{ scale: 1.02 }}
                    >
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={newMedicine.prescription_required || false}
                          onChange={(e) =>
                            setNewMedicine((prev) => ({
                              ...prev,
                              prescription_required: e.target.checked,
                            }))
                          }
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Prescription Required
                        </span>
                      </label>
                    </motion.div>

                    <motion.div
                      className="md:col-span-2"
                      whileFocus={{ scale: 1.02 }}
                    >
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={newMedicine.description || ""}
                        onChange={(e) =>
                          setNewMedicine((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 bg-white/50 backdrop-blur-sm resize-none"
                        rows={3}
                      />
                    </motion.div>

                    <motion.div
                      className="md:col-span-2"
                      whileFocus={{ scale: 1.02 }}
                    >
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Side Effects
                      </label>
                      <textarea
                        value={newMedicine.side_effects || ""}
                        onChange={(e) =>
                          setNewMedicine((prev) => ({
                            ...prev,
                            side_effects: e.target.value,
                          }))
                        }
                        className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 bg-white/50 backdrop-blur-sm resize-none"
                        rows={2}
                      />
                    </motion.div>

                    <motion.div
                      className="md:col-span-2"
                      whileFocus={{ scale: 1.02 }}
                    >
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contraindications
                      </label>
                      <textarea
                        value={newMedicine.contraindications || ""}
                        onChange={(e) =>
                          setNewMedicine((prev) => ({
                            ...prev,
                            contraindications: e.target.value,
                          }))
                        }
                        className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 bg-white/50 backdrop-blur-sm resize-none"
                        rows={2}
                      />
                    </motion.div>

                    <motion.div
                      className="md:col-span-2"
                      whileFocus={{ scale: 1.02 }}
                    >
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Storage Instructions
                      </label>
                      <input
                        type="text"
                        value={newMedicine.storage_instructions || ""}
                        onChange={(e) =>
                          setNewMedicine((prev) => ({
                            ...prev,
                            storage_instructions: e.target.value,
                          }))
                        }
                        className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 bg-white/50 backdrop-blur-sm"
                        placeholder="e.g., Store in cool, dry place"
                      />
                    </motion.div>
                  </div>

                  <div className="flex items-center justify-end space-x-4 mt-8">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        onClick={() => {
                          setShowAddForm(false);
                          setEditingMedicine(null);
                          setNewMedicine({});
                        }}
                        variant="outline"
                        className="rounded-2xl px-6 py-3 border-2"
                      >
                        Cancel
                      </Button>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        onClick={
                          editingMedicine
                            ? handleUpdateMedicine
                            : handleAddMedicine
                        }
                        disabled={
                          !newMedicine.name ||
                          !newMedicine.category ||
                          !newMedicine.unit_price ||
                          isSubmitting
                        }
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-2xl px-6 py-3 font-semibold shadow-lg flex items-center"
                      >
                        {isSubmitting && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {editingMedicine ? (
                          <>Update Medicine</>
                        ) : (
                          <>
                            <Plus size={18} className="mr-2" />
                            Add Medicine
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
