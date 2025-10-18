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
import {
  Activity,
  Calendar,
  Edit,
  Mail,
  Phone,
  Plus,
  Trash2,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface User extends Record<string, unknown> {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "PATIENT" | "DOCTOR" | "ADMIN" | "PHARMACY" | "LAB" | "SUPERADMIN";
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  patient_profile?: {
    date_of_birth?: string;
    gender?: string;
    address?: string;
    blood_group?: string;
  };
}

interface UserFormData {
  name: string;
  email: string;
  phone: string;
  role: string;
  password?: string;
  is_active: boolean;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [formData, setFormData] = useState<UserFormData>({
    name: "",
    email: "",
    phone: "",
    role: "PATIENT",
    password: "",
    is_active: true,
  });

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    verifiedUsers: 0,
    newUsersToday: 0,
  });

  const rolesList = ["PATIENT", "DOCTOR", "ADMIN", "PHARMACY", "LAB"];

  const calculateStats = useCallback(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter((user) => user.is_active).length;
    const verifiedUsers = users.filter((user) => user.is_verified).length;
    const today = new Date().toISOString().split("T")[0];
    const newUsersToday = users.filter((user) =>
      user.created_at.startsWith(today)
    ).length;

    setStats({ totalUsers, activeUsers, verifiedUsers, newUsersToday });
  }, [users]);

  const fetchUsers = useCallback(async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(""); // Clear previous errors

      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("Authentication required");
        setLoading(false);
        return;
      }

      console.log(`Fetching users (attempt ${retryCount + 1})...`);

      // Add timeout and abort controller for better error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch("/api/admin/users", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        console.log(`Successfully fetched ${data.users?.length || 0} users`);
      } else {
        throw new Error(`HTTP ${response.status}: Failed to fetch users`);
      }
    } catch (error: unknown) {
      console.error("Error loading users:", error);

      // Retry logic with exponential backoff
      if (
        retryCount < 3 &&
        error instanceof Error &&
        !error.message.includes("Authentication")
      ) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        console.log(`Retrying in ${delay}ms... (attempt ${retryCount + 1}/3)`);
        setTimeout(() => {
          fetchUsers(retryCount + 1);
        }, delay);
        return;
      }

      // After all retries failed or authentication error
      const errorMessage =
        error instanceof Error ? error.message : "Error loading users";
      setError(
        errorMessage.includes("Authentication")
          ? "Authentication required - please log in again"
          : `Failed to load users after ${
              retryCount + 1
            } attempts. Please refresh the page.`
      );
    } finally {
      if (retryCount === 0) {
        // Only set loading false on the first attempt
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchUsers(0); // Start with retry count 0

    // Add a safety timeout to prevent infinite loading (per project specs)
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.warn("User management loading timeout - forcing completion");
        setError(
          "Loading timeout after 15 seconds. The system may be experiencing issues. Please refresh the page."
        );
        setLoading(false);
      }
    }, 15000); // 15 second timeout to match fetch timeout

    return () => clearTimeout(loadingTimeout);
  }, [fetchUsers]);

  useEffect(() => {
    calculateStats();
  }, [users, calculateStats]);

  const handleCreateUser = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchUsers(0);
        setShowModal(false);
        resetForm();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to create user");
      }
    } catch (_error: unknown) {
      setError("Error creating user");
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchUsers(0);
        setShowModal(false);
        setEditingUser(null);
        resetForm();
      } else {
        setError("Failed to update user");
      }
    } catch (_error: unknown) {
      setError("Error updating user");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchUsers(0);
      } else {
        setError("Failed to delete user");
      }
    } catch (_error: unknown) {
      setError("Error deleting user");
    }
  };

  const handleStatusToggle = async (userId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (response.ok) {
        await fetchUsers(0);
      } else {
        setError("Failed to update user status");
      }
    } catch (_error: unknown) {
      setError("Error updating user status");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "PATIENT",
      password: "",
      is_active: true,
    });
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      is_active: user.is_active,
    });
    setShowModal(true);
  };

  const getRoleColor = (role: string) => {
    const colors = {
      PATIENT: "bg-blue-100 text-blue-800",
      DOCTOR: "bg-green-100 text-green-800",
      ADMIN: "bg-purple-100 text-purple-800",
      PHARMACY: "bg-orange-100 text-orange-800",
      LAB: "bg-cyan-100 text-cyan-800",
      SUPERADMIN: "bg-red-100 text-red-800",
    };
    return colors[role as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.includes(searchTerm);

    const matchesRole = !selectedRole || user.role === selectedRole;

    return matchesSearch && matchesRole;
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
            User Management
          </h1>
          <p className="text-gray-600 mt-2">
            Manage users, roles, and permissions
          </p>
        </div>
        <ResponsiveButton
          onClick={() => {
            resetForm();
            setEditingUser(null);
            setShowModal(true);
          }}
          className="bg-gradient-to-r from-blue-500 to-purple-500 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </ResponsiveButton>
      </div>

      {/* Stats */}
      <ResponsiveGrid cols={{ default: 1, sm: 2, lg: 4 }}>
        {[
          {
            label: "Total Users",
            value: stats.totalUsers,
            icon: Users,
            color: "blue",
          },
          {
            label: "Active Users",
            value: stats.activeUsers,
            icon: Activity,
            color: "green",
          },
          {
            label: "Verified Users",
            value: stats.verifiedUsers,
            icon: UserCheck,
            color: "purple",
          },
          {
            label: "New Today",
            value: stats.newUsersToday,
            icon: Calendar,
            color: "orange",
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
              label="Search users"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={setSearchTerm}
            />
          </div>
          <div className="w-full sm:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="block w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 shadow-sm text-sm"
            >
              <option value="">All Roles</option>
              {rolesList.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <ExportButton
              data={prepareExportData(
                filteredUsers,
                [
                  { key: "name", label: "Name" },
                  { key: "email", label: "Email" },
                  { key: "phone", label: "Phone" },
                  { key: "role", label: "Role" },
                  {
                    key: "is_active",
                    label: "Active",
                    format: (value) => (value ? "Yes" : "No"),
                  },
                  {
                    key: "is_verified",
                    label: "Verified",
                    format: (value) => (value ? "Yes" : "No"),
                  },
                  {
                    key: "created_at",
                    label: "Created At",
                    format: (value) => formatDate(value as string),
                  },
                ],
                "users-export"
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

      {/* Users Grid */}
      <ResponsiveGrid cols={{ default: 1, md: 2, lg: 3 }}>
        {filteredUsers.map((user, index) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -5 }}
          >
            <ResponsiveCard className="h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full w-12 h-12 flex items-center justify-center mr-3">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {user.name}
                    </h3>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(
                        user.role
                      )}`}
                    >
                      {user.role}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {user.is_active ? "Active" : "Inactive"}
                  </span>
                  {user.is_verified && (
                    <UserCheck className="w-4 h-4 text-green-500" />
                  )}
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-2" />
                  {user.email}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="w-4 h-4 mr-2" />
                  {user.phone}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  Joined {formatDate(user.created_at)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <ResponsiveButton
                  size="sm"
                  variant="outline"
                  onClick={() => openEditModal(user)}
                  fullWidth
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </ResponsiveButton>
                <ResponsiveButton
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusToggle(user.id, user.is_active)}
                  className={
                    user.is_active
                      ? "text-orange-600 border-orange-600"
                      : "text-green-600 border-green-600"
                  }
                  fullWidth
                >
                  {user.is_active ? (
                    <UserX className="w-4 h-4" />
                  ) : (
                    <UserCheck className="w-4 h-4" />
                  )}
                </ResponsiveButton>
              </div>

              <div className="mt-2">
                <ResponsiveButton
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteUser(user.id)}
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
          setEditingUser(null);
          resetForm();
        }}
        title={editingUser ? "Edit User" : "Create New User"}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ResponsiveInput
              label="Full Name"
              placeholder="Enter user's name"
              value={formData.name}
              onChange={(value) => setFormData({ ...formData, name: value })}
              required
            />
            <ResponsiveInput
              label="Email"
              type="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={(value) => setFormData({ ...formData, email: value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ResponsiveInput
              label="Phone"
              placeholder="Enter phone number"
              value={formData.phone}
              onChange={(value) => setFormData({ ...formData, phone: value })}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                className="block w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 shadow-sm"
                required
              >
                {rolesList.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!editingUser && (
            <ResponsiveInput
              label="Password"
              type="password"
              placeholder="Enter password"
              value={formData.password || ""}
              onChange={(value) =>
                setFormData({ ...formData, password: value })
              }
              required
            />
          )}

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) =>
                setFormData({ ...formData, is_active: e.target.checked })
              }
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Active User</span>
          </div>

          <div className="flex space-x-3 pt-4">
            <ResponsiveButton
              onClick={editingUser ? handleUpdateUser : handleCreateUser}
              className="bg-blue-600 text-white hover:bg-blue-700"
              fullWidth
            >
              {editingUser ? "Update User" : "Create User"}
            </ResponsiveButton>
            <ResponsiveButton
              onClick={() => {
                setShowModal(false);
                setEditingUser(null);
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
