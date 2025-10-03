"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  TestTube2,
  Filter,
  Clock,
  AlertTriangle,
  CheckCircle,
  Info,
} from "lucide-react";
import {
  ResponsiveCard,
  ResponsiveButton,
  ResponsiveInput,
  ResponsiveModal,
  ResponsiveGrid,
} from "@/components/ResponsiveComponents";
import ExportButton, { prepareExportData } from "@/components/ExportButton";

interface LabTest {
  id: string;
  name: string;
  code: string;
  category: string;
  price: number | string; // Price can be string or number from API
  sample_type: string;
  preparation_required: boolean;
  preparation_instructions?: string;
  reporting_time: string;
  normal_range?: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface LabTestFormData {
  name: string;
  code: string;
  category: string;
  price: number;
  sample_type: string;
  preparation_required: boolean;
  preparation_instructions: string;
  reporting_time: string;
  normal_range: string;
  description: string;
}

export default function LabTestManagement() {
  const [tests, setTests] = useState<LabTest[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingTest, setEditingTest] = useState<LabTest | null>(null);
  const [formData, setFormData] = useState<LabTestFormData>({
    name: "",
    code: "",
    category: "",
    price: 0,
    sample_type: "",
    preparation_required: false,
    preparation_instructions: "",
    reporting_time: "",
    normal_range: "",
    description: "",
  });

  const sampleTypes = [
    "Blood",
    "Urine",
    "Stool",
    "Saliva",
    "Tissue",
    "Image",
    "Electrical Activity",
  ];

  const reportingTimes = [
    "1 hour",
    "2 hours",
    "4 hours",
    "6 hours",
    "12 hours",
    "24 hours",
    "48 hours",
    "72 hours",
    "1 week",
  ];

  useEffect(() => {
    fetchTests();
  }, [selectedCategory]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      const params = new URLSearchParams();
      if (selectedCategory) params.append("category", selectedCategory);

      const response = await fetch(`/api/admin/lab-tests?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTests(data.tests || []);
        setCategories(data.categories || []);
      } else {
        setError("Failed to fetch lab tests");
      }
    } catch (err) {
      setError("Error loading lab tests");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTest = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/admin/lab-tests", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchTests();
        setShowModal(false);
        resetForm();
      } else {
        setError("Failed to create lab test");
      }
    } catch (err) {
      setError("Error creating lab test");
    }
  };

  const handleUpdateTest = async () => {
    if (!editingTest) return;

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/admin/lab-tests", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...formData, id: editingTest.id }),
      });

      if (response.ok) {
        await fetchTests();
        setShowModal(false);
        setEditingTest(null);
        resetForm();
      } else {
        setError("Failed to update lab test");
      }
    } catch (err) {
      setError("Error updating lab test");
    }
  };

  const handleDeleteTest = async (testId: string) => {
    if (!confirm("Are you sure you want to delete this lab test?")) return;

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`/api/admin/lab-tests?id=${testId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchTests();
      } else {
        setError("Failed to delete lab test");
      }
    } catch (err) {
      setError("Error deleting lab test");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      category: "",
      price: 0,
      sample_type: "",
      preparation_required: false,
      preparation_instructions: "",
      reporting_time: "",
      normal_range: "",
      description: "",
    });
  };

  const openEditModal = (test: LabTest) => {
    setEditingTest(test);
    setFormData({
      name: test.name,
      code: test.code,
      category: test.category,
      price:
        typeof test.price === "string" ? parseFloat(test.price) : test.price,
      sample_type: test.sample_type,
      preparation_required: test.preparation_required,
      preparation_instructions: test.preparation_instructions || "",
      reporting_time: test.reporting_time,
      normal_range: test.normal_range || "",
      description: test.description,
    });
    setShowModal(true);
  };

  const filteredTests = tests.filter((test) => {
    const matchesSearch =
      test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      "Blood Test": "bg-red-100 text-red-800",
      "Urine Test": "bg-yellow-100 text-yellow-800",
      "Hormone Test": "bg-purple-100 text-purple-800",
      Radiology: "bg-blue-100 text-blue-800",
      Cardiology: "bg-pink-100 text-pink-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
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
              Lab Test Management
            </h2>
            <p className="text-gray-600">
              Manage individual lab tests, pricing, and test parameters
            </p>
          </div>
          <ResponsiveButton
            onClick={() => setShowModal(true)}
            className="shrink-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Lab Test
          </ResponsiveButton>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mt-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search tests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <ExportButton
              data={prepareExportData(
                filteredTests,
                [
                  { key: "name", label: "Test Name" },
                  { key: "code", label: "Test Code" },
                  { key: "category", label: "Category" },
                  {
                    key: "price",
                    label: "Price",
                    format: (value: string | number) => {
                      const numValue =
                        typeof value === "string" ? parseFloat(value) : value;
                      return `$${numValue.toFixed(2)}`;
                    },
                  },
                  { key: "sample_type", label: "Sample Type" },
                  { key: "reporting_time", label: "Reporting Time" },
                ],
                "lab-tests-export"
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

      {/* Tests Grid */}
      <ResponsiveGrid cols={{ default: 1, md: 2, lg: 3 }}>
        {filteredTests.map((test, index) => (
          <motion.div
            key={test.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -5 }}
          >
            <ResponsiveCard className="h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-full w-12 h-12 flex items-center justify-center mr-3">
                    <TestTube2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {test.name}
                    </h3>
                    <p className="text-sm text-gray-600">Code: {test.code}</p>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(
                    test.category
                  )}`}
                >
                  {test.category}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Price:</span>
                  <span className="text-lg font-semibold text-blue-600">
                    $
                    {typeof test.price === "string"
                      ? parseFloat(test.price).toFixed(2)
                      : test.price.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center text-sm text-gray-600">
                  <TestTube2 className="w-4 h-4 mr-2" />
                  {test.sample_type} sample
                </div>

                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="w-4 h-4 mr-2" />
                  {test.reporting_time}
                </div>

                {test.preparation_required && (
                  <div className="flex items-start text-sm text-amber-600">
                    <AlertTriangle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Preparation required</span>
                  </div>
                )}

                {test.normal_range && (
                  <div className="flex items-start text-sm text-gray-600">
                    <Info className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium">Normal range:</span>
                      <br />
                      <span className="text-xs">{test.normal_range}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 line-clamp-3">
                  {test.description}
                </p>
              </div>

              <div className="flex space-x-2">
                <ResponsiveButton
                  size="sm"
                  variant="outline"
                  onClick={() => openEditModal(test)}
                  fullWidth
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </ResponsiveButton>
                <ResponsiveButton
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteTest(test.id)}
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

      {filteredTests.length === 0 && !loading && (
        <ResponsiveCard>
          <div className="text-center py-12">
            <TestTube2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No lab tests found
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedCategory
                ? "Try adjusting your search criteria"
                : "Get started by creating your first lab test"}
            </p>
            <ResponsiveButton onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Lab Test
            </ResponsiveButton>
          </div>
        </ResponsiveCard>
      )}

      {/* Create/Edit Modal */}
      <ResponsiveModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingTest(null);
          resetForm();
        }}
        title={editingTest ? "Edit Lab Test" : "Add New Lab Test"}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ResponsiveInput
              label="Test Name"
              placeholder="Enter test name"
              value={formData.name}
              onChange={(value: string) =>
                setFormData({ ...formData, name: value })
              }
              required
            />
            <ResponsiveInput
              label="Test Code"
              placeholder="Enter test code"
              value={formData.code}
              onChange={(value: string) =>
                setFormData({ ...formData, code: value })
              }
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <ResponsiveInput
              label="Price ($)"
              type="number"
              placeholder="0.00"
              value={formData.price.toString()}
              onChange={(value: string) =>
                setFormData({ ...formData, price: parseFloat(value) || 0 })
              }
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sample Type
              </label>
              <select
                value={formData.sample_type}
                onChange={(e) =>
                  setFormData({ ...formData, sample_type: e.target.value })
                }
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="">Select sample type</option>
                {sampleTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reporting Time
              </label>
              <select
                value={formData.reporting_time}
                onChange={(e) =>
                  setFormData({ ...formData, reporting_time: e.target.value })
                }
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="">Select reporting time</option>
                {reportingTimes.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
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
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Preparation required
              </span>
            </label>
          </div>

          {formData.preparation_required && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preparation Instructions
              </label>
              <textarea
                value={formData.preparation_instructions}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    preparation_instructions: e.target.value,
                  })
                }
                placeholder="Enter preparation instructions"
                rows={3}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Normal Range
            </label>
            <textarea
              value={formData.normal_range}
              onChange={(e) =>
                setFormData({ ...formData, normal_range: e.target.value })
              }
              placeholder="Enter normal range values (optional)"
              rows={2}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
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
              placeholder="Enter test description"
              rows={3}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <ResponsiveButton
              variant="outline"
              onClick={() => {
                setShowModal(false);
                setEditingTest(null);
                resetForm();
              }}
              fullWidth
            >
              Cancel
            </ResponsiveButton>
            <ResponsiveButton
              onClick={editingTest ? handleUpdateTest : handleCreateTest}
              fullWidth
            >
              {editingTest ? "Update" : "Create"} Test
            </ResponsiveButton>
          </div>
        </div>
      </ResponsiveModal>
    </div>
  );
}
