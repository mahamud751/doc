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
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Eye,
  Package,
  TestTube,
  Truck,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

interface PharmacyOrder {
  id: string;
  patient_id: string;
  prescription_id?: string;
  vendor_id?: string;
  status:
    | "PENDING"
    | "PROCESSING"
    | "SHIPPED"
    | "DELIVERED"
    | "CANCELLED"
    | "COMPLETED";
  total_amount: number;
  delivery_address: string;
  delivery_date?: string;
  tracking_number?: string;
  items: Array<{
    drug_name: string;
    quantity: number;
    price: number;
  }>;
  delivery_instructions?: string;
  created_at: string;
  updated_at: string;
  patient: {
    name: string;
    email: string;
    phone: string;
  };
}

interface LabOrder {
  id: string;
  patient_id: string;
  appointment_id?: string;
  package_id: string;
  vendor_id?: string;
  status:
    | "PENDING"
    | "PROCESSING"
    | "SHIPPED"
    | "DELIVERED"
    | "CANCELLED"
    | "COMPLETED";
  total_amount: number;
  sample_collection_date?: string;
  sample_collection_address?: string;
  result_url?: string;
  result_pdf?: string;
  lab_report_date?: string;
  instructions?: string;
  created_at: string;
  updated_at: string;
  patient: {
    name: string;
    email: string;
    phone: string;
  };
}

export default function OrderManagement() {
  const [activeTab, setActiveTab] = useState<"pharmacy" | "lab">("pharmacy");
  const [pharmacyOrders, setPharmacyOrders] = useState<PharmacyOrder[]>([]);
  const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<
    PharmacyOrder | LabOrder | null
  >(null);

  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
  });

  const statusOptions = [
    "PENDING",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "COMPLETED",
  ];

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  useEffect(() => {
    calculateStats();
  }, [pharmacyOrders, labOrders, activeTab]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      const endpoint =
        activeTab === "pharmacy"
          ? "/api/admin/pharmacy-orders"
          : "/api/admin/lab-orders";

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (activeTab === "pharmacy") {
          setPharmacyOrders(data.orders || []);
        } else {
          setLabOrders(data.orders || []);
        }
      } else {
        setError(`Failed to fetch ${activeTab} orders`);
      }
    } catch (err) {
      setError(`Error loading ${activeTab} orders`);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const orders = activeTab === "pharmacy" ? pharmacyOrders : labOrders;
    const totalOrders = orders.length;
    const pendingOrders = orders.filter((order) =>
      ["PENDING", "PROCESSING"].includes(order.status)
    ).length;
    const completedOrders = orders.filter(
      (order) => order.status === "COMPLETED"
    ).length;
    const totalRevenue = orders
      .filter((order) => order.status === "COMPLETED")
      .reduce((sum, order) => sum + order.total_amount, 0);

    setStats({ totalOrders, pendingOrders, completedOrders, totalRevenue });
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem("authToken");
      const endpoint =
        activeTab === "pharmacy"
          ? `/api/admin/pharmacy-orders/${orderId}/status`
          : `/api/admin/lab-orders/${orderId}/status`;

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        await fetchOrders();
      } else {
        setError("Failed to update order status");
      }
    } catch (err) {
      setError("Error updating order status");
    }
  };

  const openDetailsModal = (order: PharmacyOrder | LabOrder) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      PENDING: "bg-yellow-100 text-yellow-800",
      PROCESSING: "bg-blue-100 text-blue-800",
      SHIPPED: "bg-purple-100 text-purple-800",
      DELIVERED: "bg-green-100 text-green-800",
      COMPLETED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="w-4 h-4" />;
      case "PROCESSING":
        return <AlertCircle className="w-4 h-4" />;
      case "SHIPPED":
        return <Truck className="w-4 h-4" />;
      case "DELIVERED":
      case "COMPLETED":
        return <CheckCircle className="w-4 h-4" />;
      case "CANCELLED":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const filteredOrders = (
    activeTab === "pharmacy" ? pharmacyOrders : labOrders
  ).filter((order) => {
    const matchesSearch =
      order.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !selectedStatus || order.status === selectedStatus;

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
            Order Management
          </h1>
          <p className="text-gray-600 mt-2">
            Manage pharmacy and lab orders, track deliveries and payments
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab("pharmacy")}
          className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === "pharmacy"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Package className="w-5 h-5 mr-2" />
          Pharmacy Orders
        </button>
        <button
          onClick={() => setActiveTab("lab")}
          className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === "lab"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <TestTube className="w-5 h-5 mr-2" />
          Lab Orders
        </button>
      </div>

      {/* Stats */}
      <ResponsiveGrid cols={{ default: 1, sm: 2, lg: 4 }}>
        {[
          {
            label: `Total ${
              activeTab === "pharmacy" ? "Pharmacy" : "Lab"
            } Orders`,
            value: stats.totalOrders,
            icon: activeTab === "pharmacy" ? Package : TestTube,
            color: "blue",
          },
          {
            label: "Pending Orders",
            value: stats.pendingOrders,
            icon: Clock,
            color: "orange",
          },
          {
            label: "Completed Orders",
            value: stats.completedOrders,
            icon: CheckCircle,
            color: "green",
          },
          {
            label: "Total Revenue",
            value: formatCurrency(stats.totalRevenue),
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
              label={`Search ${activeTab} orders`}
              placeholder="Search by patient name, email, or order ID..."
              value={searchTerm}
              onChange={setSearchTerm}
            />
          </div>
          <div className="w-full sm:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            >
              <option value="">All Status</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <ExportButton
              data={prepareExportData(
                filteredOrders as unknown as Record<string, unknown>[],
                [
                  { key: "id", label: "Order ID" },
                  { key: "patient.name", label: "Patient Name" },
                  { key: "patient.email", label: "Patient Email" },
                  { key: "status", label: "Status" },
                  {
                    key: "total_amount",
                    label: "Total Amount",
                    format: (value) => formatCurrency(value as number),
                  },
                  {
                    key: "created_at",
                    label: "Order Date",
                    format: (value) => formatDate(value as string | Date),
                  },
                ],
                `${activeTab}-orders-export`
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

      {/* Orders Grid */}
      <ResponsiveGrid cols={{ default: 1, md: 2, lg: 3 }}>
        {filteredOrders.map((order, index) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -5 }}
          >
            <ResponsiveCard className="h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full w-12 h-12 flex items-center justify-center mr-3">
                    {activeTab === "pharmacy" ? (
                      <Package className="w-6 h-6 text-white" />
                    ) : (
                      <TestTube className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Order #{order.id.slice(-8)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {order.patient.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {getStatusIcon(order.status)}
                    <span className="ml-1">
                      {order.status.replace("_", " ")}
                    </span>
                  </span>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Patient:</span>{" "}
                  {order.patient.email}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Order Date:</span>{" "}
                  {formatDate(order.created_at)}
                </div>
                {activeTab === "pharmacy" && "items" in order && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Items:</span>{" "}
                    {(order as PharmacyOrder).items.length} medicine(s)
                  </div>
                )}
                {"delivery_date" in order && order.delivery_date && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Delivery:</span>{" "}
                    {formatDate(order.delivery_date as string)}
                  </div>
                )}
                {"tracking_number" in order && order.tracking_number && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Tracking:</span>{" "}
                    {order.tracking_number as string}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-green-600 text-lg">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    {formatCurrency(order.total_amount)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <ResponsiveButton
                  size="sm"
                  variant="outline"
                  onClick={() => openDetailsModal(order)}
                  fullWidth
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </ResponsiveButton>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Update Status
                  </label>
                  <select
                    value={order.status}
                    onChange={(e) =>
                      handleStatusUpdate(order.id, e.target.value)
                    }
                    className="block w-full text-xs rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </ResponsiveCard>
          </motion.div>
        ))}
      </ResponsiveGrid>

      {/* Order Details Modal */}
      <ResponsiveModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedOrder(null);
        }}
        title={`${activeTab === "pharmacy" ? "Pharmacy" : "Lab"} Order Details`}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full w-16 h-16 flex items-center justify-center mr-4">
                {activeTab === "pharmacy" ? (
                  <Package className="w-8 h-8 text-white" />
                ) : (
                  <TestTube className="w-8 h-8 text-white" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Order #{selectedOrder.id.slice(-8)}
                </h3>
                <p className="text-gray-600">{selectedOrder.patient.name}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Patient Email
                </label>
                <p className="text-sm text-gray-900">
                  {selectedOrder.patient.email}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Patient Phone
                </label>
                <p className="text-sm text-gray-900">
                  {selectedOrder.patient.phone}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Order Date
                </label>
                <p className="text-sm text-gray-900">
                  {formatDate(selectedOrder.created_at)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <span
                  className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                    selectedOrder.status
                  )}`}
                >
                  {getStatusIcon(selectedOrder.status)}
                  <span className="ml-1">
                    {selectedOrder.status.replace("_", " ")}
                  </span>
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Total Amount
                </label>
                <p className="text-sm text-gray-900 font-semibold">
                  {formatCurrency(selectedOrder.total_amount)}
                </p>
              </div>
              {"delivery_date" in selectedOrder &&
                selectedOrder.delivery_date && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Delivery Date
                    </label>
                    <p className="text-sm text-gray-900">
                      {formatDate(selectedOrder.delivery_date as string)}
                    </p>
                  </div>
                )}
            </div>

            {activeTab === "pharmacy" && "items" in selectedOrder && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Items
                </label>
                <div className="bg-gray-50 rounded-lg p-4">
                  {(selectedOrder as PharmacyOrder).items.map(
                    (
                      item: {
                        drug_name: string;
                        quantity: number;
                        price: number;
                      },
                      index: number
                    ) => (
                      <div
                        key={index}
                        className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0"
                      >
                        <div>
                          <span className="font-medium">{item.drug_name}</span>
                          <span className="text-gray-500 ml-2">
                            x {item.quantity}
                          </span>
                        </div>
                        <span className="font-semibold">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {"delivery_address" in selectedOrder &&
              selectedOrder.delivery_address && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Delivery Address
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedOrder.delivery_address}
                  </p>
                </div>
              )}

            {"tracking_number" in selectedOrder &&
              selectedOrder.tracking_number && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Tracking Number
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedOrder.tracking_number as string}
                  </p>
                </div>
              )}

            <div className="flex space-x-3 pt-4">
              <ResponsiveButton
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedOrder(null);
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
