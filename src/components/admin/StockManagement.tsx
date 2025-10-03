"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Package,
  AlertTriangle,
  TrendingUp,
  Plus,
  Edit,
  Search,
  Filter,
  RefreshCw,
  BarChart3,
  Pill,
  ShoppingCart,
  DollarSign,
} from "lucide-react";
import {
  ResponsiveCard,
  ResponsiveButton,
  ResponsiveInput,
  ResponsiveModal,
  ResponsiveGrid,
} from "@/components/ResponsiveComponents";
import ExportButton, { prepareExportData } from "@/components/ExportButton";
import { formatDate, formatCurrency } from "@/lib/utils";

interface Medicine {
  id: string;
  name: string;
  generic_name?: string;
  manufacturer?: string;
  category: string;
  strength: string;
  unit_price: number;
  stock_quantity: number;
  reorder_level: number;
  prescription_required: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface StockTransaction {
  id: string;
  medicine_id: string;
  medicine_name: string;
  type: "IN" | "OUT" | "CURRENT_STOCK";
  quantity: number;
  unit_price?: number;
  total_value?: number;
  reason?: string;
  date: string;
  status?: string;
  stock_level?: string;
}

interface StockFormData {
  medicine_id: string;
  quantity: number;
  unit_price: number;
  reason: string;
  type: "IN" | "OUT";
}

export default function StockManagement() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(
    null
  );
  const [stockFormData, setStockFormData] = useState<StockFormData>({
    medicine_id: "",
    quantity: 0,
    unit_price: 0,
    reason: "",
    type: "IN",
  });

  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    criticalStockItems: 0,
    totalStockValue: 0,
  });

  useEffect(() => {
    fetchMedicines();
    fetchTransactions();
    calculateStats();
  }, []);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/medicines", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMedicines(data.medicines || []);
      } else {
        setError("Failed to fetch medicines");
      }
    } catch (err) {
      setError("Error loading medicines");
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/admin/stock/transactions", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
    }
  };

  const calculateStats = () => {
    const totalItems = medicines.length;
    const lowStockItems = medicines.filter(
      (m) => m.stock_quantity < 50 && m.stock_quantity >= 10
    ).length;
    const criticalStockItems = medicines.filter(
      (m) => m.stock_quantity < 10
    ).length;
    const totalStockValue = medicines.reduce(
      (sum, m) => sum + Number(m.unit_price) * m.stock_quantity,
      0
    );

    setStats({
      totalItems,
      lowStockItems,
      criticalStockItems,
      totalStockValue,
    });
  };

  const handleStockUpdate = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/admin/stock/update", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(stockFormData),
      });

      if (response.ok) {
        await fetchMedicines();
        await fetchTransactions();
        setShowTransactionModal(false);
        resetStockForm();
      } else {
        setError("Failed to update stock");
      }
    } catch (err) {
      setError("Error updating stock");
    }
  };

  const handleRestockMedicine = async (
    medicineId: string,
    quantity: number
  ) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/admin/stock/restock", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          medicine_id: medicineId,
          quantity,
          reason: "Manual restock",
        }),
      });

      if (response.ok) {
        await fetchMedicines();
        await fetchTransactions();
      } else {
        setError("Failed to restock medicine");
      }
    } catch (err) {
      setError("Error restocking medicine");
    }
  };

  const resetStockForm = () => {
    setStockFormData({
      medicine_id: "",
      quantity: 0,
      unit_price: 0,
      reason: "",
      type: "IN",
    });
  };

  const openStockModal = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setStockFormData({
      medicine_id: medicine.id,
      quantity: 0,
      unit_price: Number(medicine.unit_price),
      reason: "",
      type: "IN",
    });
    setShowTransactionModal(true);
  };

  const getStockStatus = (medicine: Medicine) => {
    if (medicine.stock_quantity < 10)
      return { status: "Critical", color: "bg-red-100 text-red-800" };
    if (medicine.stock_quantity < 50)
      return { status: "Low", color: "bg-yellow-100 text-yellow-800" };
    return { status: "Good", color: "bg-green-100 text-green-800" };
  };

  const filteredMedicines = medicines.filter((medicine) => {
    const matchesSearch =
      medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medicine.category.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesFilter = true;
    if (filterStatus === "critical")
      matchesFilter = medicine.stock_quantity < 10;
    else if (filterStatus === "low")
      matchesFilter =
        medicine.stock_quantity < 50 && medicine.stock_quantity >= 10;
    else if (filterStatus === "good")
      matchesFilter = medicine.stock_quantity >= 50;

    return matchesSearch && matchesFilter;
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
            Stock Management
          </h1>
          <p className="text-gray-600 mt-2">
            Monitor inventory levels and manage stock movements
          </p>
        </div>
        <ResponsiveButton
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-blue-500 to-purple-500 text-white"
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          View Reports
        </ResponsiveButton>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <ResponsiveCard>
          <div className="flex items-center">
            <div className="bg-blue-100 rounded-lg p-3 mr-4">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {stats.totalItems}
              </p>
              <p className="text-sm text-gray-600">Total Items</p>
            </div>
          </div>
        </ResponsiveCard>

        <ResponsiveCard>
          <div className="flex items-center">
            <div className="bg-yellow-100 rounded-lg p-3 mr-4">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">
                {stats.lowStockItems}
              </p>
              <p className="text-sm text-gray-600">Low Stock</p>
            </div>
          </div>
        </ResponsiveCard>

        <ResponsiveCard>
          <div className="flex items-center">
            <div className="bg-red-100 rounded-lg p-3 mr-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">
                {stats.criticalStockItems}
              </p>
              <p className="text-sm text-gray-600">Critical Stock</p>
            </div>
          </div>
        </ResponsiveCard>

        <ResponsiveCard>
          <div className="flex items-center">
            <div className="bg-green-100 rounded-lg p-3 mr-4">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.totalStockValue)}
              </p>
              <p className="text-sm text-gray-600">Stock Value</p>
            </div>
          </div>
        </ResponsiveCard>
      </div>

      {/* Filters */}
      <ResponsiveCard>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <ResponsiveInput
              label="Search medicines"
              placeholder="Search by name or category..."
              value={searchTerm}
              onChange={setSearchTerm}
            />
          </div>
          <div className="w-full sm:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            >
              <option value="">All Status</option>
              <option value="critical">Critical Stock</option>
              <option value="low">Low Stock</option>
              <option value="good">Good Stock</option>
            </select>
          </div>
          <div className="flex items-end">
            <ExportButton
              data={prepareExportData(
                filteredMedicines,
                [
                  { key: "name", label: "Medicine Name" },
                  { key: "category", label: "Category" },
                  { key: "strength", label: "Strength" },
                  { key: "stock_quantity", label: "Current Stock" },
                  {
                    key: "unit_price",
                    label: "Unit Price ($)",
                    format: (value) => Number(value).toFixed(2),
                  },
                ],
                "stock-report"
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

      {/* Stock Table */}
      <ResponsiveCard>
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
                  Current Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Value
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
              {filteredMedicines.map((medicine, index) => {
                const stockStatus = getStockStatus(medicine);
                const stockValue =
                  Number(medicine.unit_price) * medicine.stock_quantity;

                return (
                  <motion.tr
                    key={medicine.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg p-2 mr-3">
                          <Pill className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {medicine.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {medicine.strength}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {medicine.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`text-sm font-medium ${
                          medicine.stock_quantity < 10
                            ? "text-red-600"
                            : medicine.stock_quantity < 50
                            ? "text-yellow-600"
                            : "text-green-600"
                        }`}
                      >
                        {medicine.stock_quantity} units
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(Number(medicine.unit_price))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(stockValue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}
                      >
                        {stockStatus.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <ResponsiveButton
                        size="xs"
                        onClick={() => openStockModal(medicine)}
                        className="bg-blue-600 text-white hover:bg-blue-700"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Update Stock
                      </ResponsiveButton>
                      {medicine.stock_quantity < 50 && (
                        <ResponsiveButton
                          size="xs"
                          onClick={() =>
                            handleRestockMedicine(medicine.id, 100)
                          }
                          className="bg-green-600 text-white hover:bg-green-700"
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Quick Restock
                        </ResponsiveButton>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ResponsiveCard>

      {/* Recent Transactions */}
      <ResponsiveCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Stock Transactions
          </h3>
          <ResponsiveButton
            size="sm"
            variant="outline"
            onClick={fetchTransactions}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </ResponsiveButton>
        </div>
        <div className="space-y-3">
          {transactions.slice(0, 5).map((transaction, index) => (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center">
                <div
                  className={`rounded-full p-2 mr-3 ${
                    transaction.type === "IN" ? "bg-green-100" : "bg-red-100"
                  }`}
                >
                  {transaction.type === "IN" ? (
                    <Plus className="w-4 h-4 text-green-600" />
                  ) : (
                    <ShoppingCart className="w-4 h-4 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {transaction.medicine_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {transaction.type === "IN" ? "Stock In" : "Stock Out"} •{" "}
                    {transaction.quantity} units
                  </p>
                  <p className="text-xs text-gray-500">
                    {transaction.reason || "Stock update"} •{" "}
                    {formatDate(transaction.date)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={`font-medium ${
                    transaction.type === "IN"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {transaction.type === "IN" ? "+" : "-"}
                  {transaction.quantity}
                </p>
                {transaction.total_value && (
                  <p className="text-sm text-gray-600">
                    {formatCurrency(Number(transaction.total_value))}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </ResponsiveCard>

      {/* Stock Update Modal */}
      <ResponsiveModal
        isOpen={showTransactionModal}
        onClose={() => {
          setShowTransactionModal(false);
          setSelectedMedicine(null);
          resetStockForm();
        }}
        title={`Update Stock - ${selectedMedicine?.name}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction Type
            </label>
            <select
              value={stockFormData.type}
              onChange={(e) =>
                setStockFormData({
                  ...stockFormData,
                  type: e.target.value as "IN" | "OUT",
                })
              }
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="IN">Stock In (Add Inventory)</option>
              <option value="OUT">Stock Out (Remove Inventory)</option>
            </select>
          </div>

          <ResponsiveInput
            label="Quantity"
            type="number"
            placeholder="Enter quantity"
            value={stockFormData.quantity.toString()}
            onChange={(value) =>
              setStockFormData({
                ...stockFormData,
                quantity: parseInt(value) || 0,
              })
            }
            required
          />

          <ResponsiveInput
            label="Unit Price ($)"
            type="number"
            placeholder="Enter unit price"
            value={stockFormData.unit_price.toString()}
            onChange={(value) =>
              setStockFormData({
                ...stockFormData,
                unit_price: parseFloat(value) || 0,
              })
            }
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason
            </label>
            <textarea
              value={stockFormData.reason}
              onChange={(e) =>
                setStockFormData({ ...stockFormData, reason: e.target.value })
              }
              placeholder="Enter reason for stock movement..."
              rows={3}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <ResponsiveButton
              onClick={handleStockUpdate}
              className="bg-blue-600 text-white hover:bg-blue-700"
              fullWidth
            >
              Update Stock
            </ResponsiveButton>
            <ResponsiveButton
              onClick={() => {
                setShowTransactionModal(false);
                setSelectedMedicine(null);
                resetStockForm();
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
