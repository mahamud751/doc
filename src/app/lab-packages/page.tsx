"use client";

import { useState } from "react";
import { Search, Plus, Edit, Trash2, FlaskConical, Eye } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface LabPackage {
  id: string;
  name: string;
  description: string;
  category: string;
  total_price: number;
  discounted_price: number;
  tests_count: number;
  popular: boolean;
  preparation_time: string;
  report_delivery: string;
}

export default function LabPackageManagement() {
  const [labPackages, setLabPackages] = useState<LabPackage[]>([
    {
      id: "1",
      name: "Complete Health Checkup",
      description: "Comprehensive health screening package",
      category: "General Health",
      total_price: 299.99,
      discounted_price: 249.99,
      tests_count: 25,
      popular: true,
      preparation_time: "10-12 hours fasting",
      report_delivery: "24-48 hours",
    },
    {
      id: "2",
      name: "Diabetes Screening",
      description: "Essential tests for diabetes detection",
      category: "Diabetes",
      total_price: 89.99,
      discounted_price: 69.99,
      tests_count: 8,
      popular: false,
      preparation_time: "8 hours fasting",
      report_delivery: "24 hours",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const categories = [
    "General Health",
    "Diabetes",
    "Heart Health",
    "Women's Health",
    "Men's Health",
  ];

  const filteredPackages = labPackages
    .filter(
      (pkg) =>
        pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(
      (pkg) => selectedCategory === "" || pkg.category === selectedCategory
    );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <FlaskConical className="text-blue-600" size={32} />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Lab Package Management
                </h1>
                <p className="text-gray-600">
                  Manage lab test packages and pricing
                </p>
              </div>
            </div>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus size={16} className="mr-2" />
              Add Package
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">
                    Total Packages
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    {labPackages.length}
                  </p>
                </div>
                <FlaskConical className="text-blue-600" size={24} />
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">
                    Popular Packages
                  </p>
                  <p className="text-2xl font-bold text-green-900">
                    {labPackages.filter((pkg) => pkg.popular).length}
                  </p>
                </div>
                <FlaskConical className="text-green-600" size={24} />
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">
                    Avg Package Price
                  </p>
                  <p className="text-2xl font-bold text-purple-900">
                    $
                    {(
                      labPackages.reduce(
                        (sum, pkg) => sum + pkg.discounted_price,
                        0
                      ) / labPackages.length
                    ).toFixed(0)}
                  </p>
                </div>
                <FlaskConical className="text-purple-600" size={24} />
              </div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium">
                    Total Tests
                  </p>
                  <p className="text-2xl font-bold text-orange-900">
                    {labPackages.reduce((sum, pkg) => sum + pkg.tests_count, 0)}
                  </p>
                </div>
                <FlaskConical className="text-orange-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
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
                  placeholder="Search packages..."
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
          </div>
        </div>

        {/* Lab Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPackages.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {pkg.name}
                    </h3>
                    {pkg.popular && (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                        Popular
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-3">
                    {pkg.description}
                  </p>
                  <div className="space-y-1 mb-4">
                    <p className="text-xs text-gray-500">
                      Category: {pkg.category}
                    </p>
                    <p className="text-xs text-gray-500">
                      Tests: {pkg.tests_count}
                    </p>
                    <p className="text-xs text-gray-500">
                      Preparation: {pkg.preparation_time}
                    </p>
                    <p className="text-xs text-gray-500">
                      Report: {pkg.report_delivery}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg font-bold text-green-600">
                    ${pkg.discounted_price}
                  </span>
                  {pkg.discounted_price < pkg.total_price && (
                    <span className="text-sm text-gray-500 line-through">
                      ${pkg.total_price}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Save ${(pkg.total_price - pkg.discounted_price).toFixed(2)}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <Button variant="outline" className="text-xs">
                  <Eye size={14} className="mr-1" />
                  View Details
                </Button>
                <div className="flex items-center space-x-1">
                  <Button
                    onClick={() => {}}
                    variant="ghost"
                    className="text-blue-600 hover:text-blue-700 p-1"
                  >
                    <Edit size={16} />
                  </Button>
                  <Button
                    onClick={() => {}}
                    variant="ghost"
                    className="text-red-600 hover:text-red-700 p-1"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Package Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-semibold mb-4">
                Add New Lab Package
              </h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Package Name"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                  placeholder="Description"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
                <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    placeholder="Total Price"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Discounted Price"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end space-x-4 mt-6">
                <Button onClick={() => setShowAddForm(false)} variant="outline">
                  Cancel
                </Button>
                <Button onClick={() => setShowAddForm(false)}>
                  Add Package
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
