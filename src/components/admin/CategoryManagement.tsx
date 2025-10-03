"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Tag,
  Filter,
  Download,
  MoreVertical,
} from "lucide-react";
import {
  ResponsiveCard,
  ResponsiveButton,
  ResponsiveInput,
  ResponsiveModal,
  ResponsiveGrid,
} from "@/components/ResponsiveComponents";
import ExportButton, { prepareExportData } from "@/components/ExportButton";

interface Category {
  id: string;
  name: string;
  type: "medicine" | "lab" | "specialty";
  description?: string;
  items_count?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface CategoryFormData {
  name: string;
  type: "medicine" | "lab" | "specialty";
  description: string;
  icon_url: string;
}

export default function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    type: "medicine",
    description: "",
    icon_url: "",
  });

  const categoryTypes = [
    { value: "medicine", label: "Medicine" },
    { value: "lab", label: "Lab Test" },
    { value: "specialty", label: "Medical Specialty" },
  ];

  useEffect(() => {
    fetchCategories();
  }, [selectedType]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      const params = new URLSearchParams();
      if (selectedType) params.append("type", selectedType);

      const response = await fetch(`/api/admin/categories?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      } else {
        setError("Failed to fetch categories");
      }
    } catch (err) {
      setError("Error loading categories");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchCategories();
        setShowModal(false);
        resetForm();
      } else {
        setError("Failed to create category");
      }
    } catch (err) {
      setError("Error creating category");
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/admin/categories", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...formData, id: editingCategory.id }),
      });

      if (response.ok) {
        await fetchCategories();
        setShowModal(false);
        setEditingCategory(null);
        resetForm();
      } else {
        setError("Failed to update category");
      }
    } catch (err) {
      setError("Error updating category");
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`/api/admin/categories?id=${categoryId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchCategories();
      } else {
        setError("Failed to delete category");
      }
    } catch (err) {
      setError("Error deleting category");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "medicine",
      description: "",
      icon_url: "",
    });
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      description: category.description || "",
      icon_url: "",
    });
    setShowModal(true);
  };

  const filteredCategories = categories.filter((category) => {
    const matchesSearch = category.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getTypeColor = (type: string) => {
    const colors = {
      medicine: "bg-blue-100 text-blue-800",
      lab: "bg-green-100 text-green-800",
      specialty: "bg-purple-100 text-purple-800",
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "medicine":
        return "💊";
      case "lab":
        return "🔬";
      case "specialty":
        return "🏥";
      default:
        return "📁";
    }
  };

  if (loading) {
    return (
      <ResponsiveCard>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </ResponsiveCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <ResponsiveCard>
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Category Management
            </h2>
            <p className="text-gray-600">
              Manage categories for medicines, lab tests, and medical
              specialties
            </p>
          </div>
          <ResponsiveButton
            onClick={() => setShowModal(true)}
            className="shrink-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </ResponsiveButton>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mt-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            >
              <option value="">All Types</option>
              {categoryTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <ExportButton
              data={prepareExportData(
                filteredCategories,
                [
                  { key: "name", label: "Name" },
                  { key: "type", label: "Type" },
                  { key: "description", label: "Description" },
                  { key: "items_count", label: "Items Count" },
                ],
                "categories-export"
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

      {/* Categories Grid */}
      <ResponsiveGrid cols={{ default: 1, md: 2, lg: 3 }}>
        {filteredCategories.map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -5 }}
          >
            <ResponsiveCard className="h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full w-12 h-12 flex items-center justify-center mr-3 text-white text-xl">
                    {getTypeIcon(category.type)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {category.name}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(
                        category.type
                      )}`}
                    >
                      {category.type}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <ResponsiveButton
                    size="sm"
                    variant="outline"
                    onClick={() => openEditModal(category)}
                  >
                    <Edit className="w-4 h-4" />
                  </ResponsiveButton>
                  <ResponsiveButton
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteCategory(category.id)}
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </ResponsiveButton>
                </div>
              </div>

              {category.description && (
                <p className="text-sm text-gray-600 mb-3">
                  {category.description}
                </p>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{category.items_count || 0} items</span>
                <span>
                  {category.created_at &&
                    new Date(category.created_at).toLocaleDateString()}
                </span>
              </div>
            </ResponsiveCard>
          </motion.div>
        ))}
      </ResponsiveGrid>

      {filteredCategories.length === 0 && !loading && (
        <ResponsiveCard>
          <div className="text-center py-12">
            <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No categories found
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedType
                ? "Try adjusting your search criteria"
                : "Get started by creating your first category"}
            </p>
            <ResponsiveButton onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </ResponsiveButton>
          </div>
        </ResponsiveCard>
      )}

      {/* Create/Edit Modal */}
      <ResponsiveModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingCategory(null);
          resetForm();
        }}
        title={editingCategory ? "Edit Category" : "Add New Category"}
        size="md"
      >
        <div className="space-y-4">
          <ResponsiveInput
            label="Category Name"
            placeholder="Enter category name"
            value={formData.name}
            onChange={(value: string) =>
              setFormData({ ...formData, name: value })
            }
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category Type
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as "medicine" | "lab" | "specialty",
                })
              }
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={!!editingCategory}
            >
              {categoryTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Enter category description (optional)"
              rows={3}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <ResponsiveButton
              variant="outline"
              onClick={() => {
                setShowModal(false);
                setEditingCategory(null);
                resetForm();
              }}
              fullWidth
            >
              Cancel
            </ResponsiveButton>
            <ResponsiveButton
              onClick={
                editingCategory ? handleUpdateCategory : handleCreateCategory
              }
              fullWidth
            >
              {editingCategory ? "Update" : "Create"} Category
            </ResponsiveButton>
          </div>
        </div>
      </ResponsiveModal>
    </div>
  );
}
