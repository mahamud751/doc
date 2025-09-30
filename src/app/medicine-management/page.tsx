"use client";

import { useState } from "react";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  Filter,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

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
  const [medicines, setMedicines] = useState<Medicine[]>([
    {
      id: "1",
      name: "Paracetamol",
      generic_name: "Acetaminophen",
      manufacturer: "PharmaCorp Ltd",
      category: "Pain Relief",
      strength: "500mg",
      unit_price: 2.5,
      stock_quantity: 500,
      prescription_required: false,
      expiry_date: "2025-12-31",
      batch_number: "PAR2024001",
      description: "Pain reliever and fever reducer",
      side_effects: "Nausea, stomach upset (rare)",
      contraindications: "Liver disease, alcohol dependency",
      storage_instructions: "Store in cool, dry place",
    },
    {
      id: "2",
      name: "Amoxicillin",
      generic_name: "Amoxicillin",
      manufacturer: "MediGen Pharma",
      category: "Antibiotic",
      strength: "250mg",
      unit_price: 8.75,
      stock_quantity: 200,
      prescription_required: true,
      expiry_date: "2025-08-15",
      batch_number: "AMX2024002",
      description: "Broad-spectrum antibiotic",
      side_effects: "Diarrhea, nausea, skin rash",
      contraindications: "Penicillin allergy",
      storage_instructions: "Store below 25°C",
    },
    {
      id: "3",
      name: "Omeprazole",
      generic_name: "Omeprazole",
      manufacturer: "GastroMed Inc",
      category: "Acid Reducer",
      strength: "20mg",
      unit_price: 12.0,
      stock_quantity: 150,
      prescription_required: true,
      expiry_date: "2026-03-20",
      batch_number: "OME2024003",
      description: "Proton pump inhibitor for acid reflux",
      side_effects: "Headache, diarrhea, abdominal pain",
      contraindications: "Hypersensitivity to substituted benzimidazoles",
      storage_instructions: "Protect from light and moisture",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [sortBy, setSortBy] = useState<
    "name" | "category" | "stock" | "expiry"
  >("name");

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

  const handleAddMedicine = () => {
    if (newMedicine.name && newMedicine.category && newMedicine.unit_price) {
      const medicine: Medicine = {
        id: Date.now().toString(),
        name: newMedicine.name || "",
        generic_name: newMedicine.generic_name || "",
        manufacturer: newMedicine.manufacturer || "",
        category: newMedicine.category || "",
        strength: newMedicine.strength || "",
        unit_price: newMedicine.unit_price || 0,
        stock_quantity: newMedicine.stock_quantity || 0,
        prescription_required: newMedicine.prescription_required || false,
        expiry_date: newMedicine.expiry_date || "",
        batch_number: newMedicine.batch_number || "",
        description: newMedicine.description || "",
        side_effects: newMedicine.side_effects || "",
        contraindications: newMedicine.contraindications || "",
        storage_instructions: newMedicine.storage_instructions || "",
      };
      setMedicines([...medicines, medicine]);
      setNewMedicine({});
      setShowAddForm(false);
    }
  };

  const handleEditMedicine = (medicine: Medicine) => {
    setEditingMedicine(medicine);
    setNewMedicine(medicine);
    setShowAddForm(true);
  };

  const handleUpdateMedicine = () => {
    if (
      editingMedicine &&
      newMedicine.name &&
      newMedicine.category &&
      newMedicine.unit_price
    ) {
      const updatedMedicine: Medicine = {
        ...editingMedicine,
        name: newMedicine.name || "",
        generic_name: newMedicine.generic_name || "",
        manufacturer: newMedicine.manufacturer || "",
        category: newMedicine.category || "",
        strength: newMedicine.strength || "",
        unit_price: newMedicine.unit_price || 0,
        stock_quantity: newMedicine.stock_quantity || 0,
        prescription_required: newMedicine.prescription_required || false,
        expiry_date: newMedicine.expiry_date || "",
        batch_number: newMedicine.batch_number || "",
        description: newMedicine.description || "",
        side_effects: newMedicine.side_effects || "",
        contraindications: newMedicine.contraindications || "",
        storage_instructions: newMedicine.storage_instructions || "",
      };
      setMedicines(
        medicines.map((med) =>
          med.id === editingMedicine.id ? updatedMedicine : med
        )
      );
      setNewMedicine({});
      setShowAddForm(false);
      setEditingMedicine(null);
    }
  };

  const handleDeleteMedicine = (id: string) => {
    if (confirm("Are you sure you want to delete this medicine?")) {
      setMedicines(medicines.filter((med) => med.id !== id));
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Package className="text-blue-600" size={32} />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Medicine Management
                </h1>
                <p className="text-gray-600">
                  Manage inventory, pricing, and medicine information
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button onClick={exportToCSV} variant="outline">
                <Download size={16} className="mr-2" />
                Export CSV
              </Button>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus size={16} className="mr-2" />
                Add Medicine
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">
                    Total Medicines
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    {medicines.length}
                  </p>
                </div>
                <Package className="text-blue-600" size={24} />
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">
                    Total Stock Value
                  </p>
                  <p className="text-2xl font-bold text-green-900">
                    $
                    {medicines
                      .reduce(
                        (sum, med) => sum + med.unit_price * med.stock_quantity,
                        0
                      )
                      .toFixed(2)}
                  </p>
                </div>
                <Package className="text-green-600" size={24} />
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-600 text-sm font-medium">
                    Low Stock
                  </p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {getLowStockCount()}
                  </p>
                </div>
                <AlertTriangle className="text-yellow-600" size={24} />
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600 text-sm font-medium">
                    Expiring Soon
                  </p>
                  <p className="text-2xl font-bold text-red-900">
                    {getExpiringCount()}
                  </p>
                </div>
                <AlertTriangle className="text-red-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search medicines..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <Filter size={16} className="text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="name">Sort by Name</option>
                <option value="category">Sort by Category</option>
                <option value="stock">Sort by Stock</option>
                <option value="expiry">Sort by Expiry</option>
              </select>
            </div>
          </div>
        </div>

        {/* Medicine List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
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
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expiry
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prescription
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMedicines.map((medicine) => (
                  <tr key={medicine.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {medicine.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {medicine.generic_name} - {medicine.strength}
                        </div>
                        <div className="text-xs text-gray-400">
                          {medicine.manufacturer}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {medicine.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {medicine.stock_quantity}
                      </div>
                      {medicine.stock_quantity < 50 && (
                        <div className="text-xs text-red-600">Low Stock</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${medicine.unit_price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {medicine.expiry_date}
                      </div>
                      {new Date(medicine.expiry_date) <=
                        new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000) && (
                        <div className="text-xs text-red-600">
                          Expiring Soon
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {medicine.prescription_required ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Required
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          OTC
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          onClick={() => handleEditMedicine(medicine)}
                          variant="ghost"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          onClick={() => handleDeleteMedicine(medicine.id)}
                          variant="ghost"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-6">
                  {editingMedicine ? "Edit Medicine" : "Add New Medicine"}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
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
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
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
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
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
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
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
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
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
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 500mg, 10ml"
                    />
                  </div>

                  <div>
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
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
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
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
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
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
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
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
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
                  </div>

                  <div className="md:col-span-2">
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
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                    />
                  </div>

                  <div className="md:col-span-2">
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
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                    />
                  </div>

                  <div className="md:col-span-2">
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
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                    />
                  </div>

                  <div className="md:col-span-2">
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
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Store in cool, dry place"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-4 mt-8">
                  <Button
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingMedicine(null);
                      setNewMedicine({});
                    }}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={
                      editingMedicine ? handleUpdateMedicine : handleAddMedicine
                    }
                    disabled={
                      !newMedicine.name ||
                      !newMedicine.category ||
                      !newMedicine.unit_price
                    }
                  >
                    {editingMedicine ? "Update Medicine" : "Add Medicine"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
