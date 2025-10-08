"use client";

import NavigationHeader from "@/components/NavigationHeader";
import { useCart } from "@/context/CartContext";
import { motion } from "framer-motion";
import {
  Beaker,
  Filter,
  FlaskConical,
  Package as PackageIcon,
  Search,
  TestTube,
  Heart,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useWishlist } from "@/contexts/WishlistContext";

interface LabTest {
  id: string;
  name: string;
  code: string;
  description: string;
  price: number;
  category: string;
  sample_type: string;
  preparation_required: boolean;
  preparation_instructions: string | null;
  reporting_time: string;
  normal_range: string;
  is_active: boolean;
  created_at: string;
}

interface LabPackage {
  id: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  tests_included: string[];
  preparation_required: boolean;
  preparation_instructions?: string;
  sample_type?: string;
  reporting_time?: string;
  is_home_collection: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function LabItemsPage() {
  const [activeTab, setActiveTab] = useState<"tests" | "packages">("tests");
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [labPackages, setLabPackages] = useState<LabPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();

  const testCategories = [
    "Blood Test",
    "Urine Test",
    "Radiology",
    "Hormone Test",
    "Cardiology",
  ];

  const packageCategories = [
    "Blood Test",
    "Urine Test",
    "X-Ray",
    "MRI",
    "CT Scan",
    "Ultrasound",
    "General Health",
    "Diabetes",
    "Heart Health",
    "Women's Health",
    "Men's Health",
    "Thyroid",
    "Liver Function",
  ];

  useEffect(() => {
    fetchLabItems();
  }, []);

  const fetchLabItems = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch lab packages from API
      const packagesResponse = await fetch("/api/lab-packages");
      if (packagesResponse.ok) {
        const packagesData = await packagesResponse.json();
        setLabPackages(packagesData.packages || []);
      } else {
        throw new Error("Failed to fetch lab packages");
      }

      // Fetch lab tests from API
      const testsResponse = await fetch("/api/lab-tests");
      if (testsResponse.ok) {
        const testsData = await testsResponse.json();
        setLabTests(testsData.tests || []);
      } else {
        throw new Error("Failed to fetch lab tests");
      }
    } catch (error: unknown) {
      console.error("Error fetching lab items:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load lab items"
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredLabTests = labTests
    .filter(
      (test) =>
        test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(
      (test) => selectedCategory === "" || test.category === selectedCategory
    );

  const filteredLabPackages = labPackages
    .filter(
      (pkg) =>
        pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pkg.description &&
          pkg.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .filter(
      (pkg) => selectedCategory === "" || pkg.category === selectedCategory
    );

  const handleToggleWishlist = async (
    id: string,
    type: "LAB_TEST" | "LAB_PACKAGE",
    name: string
  ) => {
    if (isInWishlist(id, type)) {
      await removeFromWishlist(id, type, name);
    } else {
      await addToWishlist(id, type, name);
    }
  };

  const renderLabTestCard = (test: LabTest) => {
    const isInWish = isInWishlist(test.id, "LAB_TEST");

    return (
      <motion.div
        key={test.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -5, scale: 1.02 }}
        className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/30 overflow-hidden hover:shadow-3xl transition-all duration-300"
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-3">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl"
                >
                  <TestTube className="text-white" size={20} />
                </motion.div>
                <h3 className="text-xl font-bold text-gray-900">{test.name}</h3>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  {test.category}
                </span>
                <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 border border-gray-200">
                  {test.sample_type}
                </span>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() =>
                handleToggleWishlist(test.id, "LAB_TEST", test.name)
              }
              className={`p-2 rounded-full ${
                isInWish
                  ? "text-red-500 bg-red-50 hover:bg-red-100"
                  : "text-gray-400 bg-gray-100 hover:bg-gray-200"
              }`}
            >
              <Heart className={`w-5 h-5 ${isInWish ? "fill-current" : ""}`} />
            </motion.button>
          </div>

          <p className="text-gray-600 text-sm mb-6 leading-relaxed">
            {test.description}
          </p>

          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Code:</span>
              <span className="font-semibold text-gray-900">{test.code}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Preparation:</span>
              <span className="font-semibold text-gray-900">
                {test.preparation_required ? "Required" : "Not Required"}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Report Delivery:</span>
              <span className="font-semibold text-gray-900">
                {test.reporting_time}
              </span>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                ৳{Number(test.price).toFixed(2)}
              </span>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() =>
              addToCart({
                id: test.id,
                name: test.name,
                price: Number(test.price),
                type: "test",
              })
            }
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-2xl shadow-lg transition-all"
          >
            Add to Cart
          </motion.button>
        </div>
      </motion.div>
    );
  };

  const renderLabPackageCard = (pkg: LabPackage) => {
    const isInWish = isInWishlist(pkg.id, "LAB_PACKAGE");

    return (
      <motion.div
        key={pkg.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -8, scale: 1.02 }}
        className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/30 overflow-hidden hover:shadow-3xl transition-all duration-300"
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-3">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl"
                >
                  <FlaskConical className="text-white" size={20} />
                </motion.div>
                <h3 className="text-xl font-bold text-gray-900">{pkg.name}</h3>
              </div>
              <div className="flex items-center space-x-3 mb-4">
                <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  {pkg.category}
                </span>
                {pkg.price > 2000 && (
                  <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border border-amber-200">
                    Premium Package
                  </span>
                )}
                {pkg.is_home_collection && (
                  <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
                    Home Collection
                  </span>
                )}
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() =>
                handleToggleWishlist(pkg.id, "LAB_PACKAGE", pkg.name)
              }
              className={`p-2 rounded-full ${
                isInWish
                  ? "text-red-500 bg-red-50 hover:bg-red-100"
                  : "text-gray-400 bg-gray-100 hover:bg-gray-200"
              }`}
            >
              <Heart className={`w-5 h-5 ${isInWish ? "fill-current" : ""}`} />
            </motion.button>
          </div>

          <p className="text-gray-600 text-sm mb-6 leading-relaxed">
            {pkg.description}
          </p>

          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Tests Included:</span>
              <span className="font-semibold text-gray-900">
                {pkg.tests_included?.length || 0} tests
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Preparation:</span>
              <span className="font-semibold text-gray-900">
                {pkg.preparation_required
                  ? pkg.preparation_instructions || "Required"
                  : "Not Required"}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Report Delivery:</span>
              <span className="font-semibold text-gray-900">
                {pkg.reporting_time || "24-48 hours"}
              </span>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                ৳{Number(pkg.price).toFixed(2)}
              </span>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() =>
              addToCart({
                id: pkg.id,
                name: pkg.name,
                price: Number(pkg.price),
                type: "package",
              })
            }
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-2xl shadow-lg transition-all"
          >
            Add to Cart
          </motion.button>
        </div>
      </motion.div>
    );
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Loading Lab Items...
          </h3>
          <p className="text-gray-600 mt-2">
            Fetching available tests and packages
          </p>
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
            <Beaker className="w-10 h-10 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Error Loading Lab Items
          </h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <button
              onClick={fetchLabItems}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3 px-6 rounded-2xl shadow-lg"
            >
              Try Again
            </button>
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
      <NavigationHeader currentPage="lab-items" />

      <div className="relative z-10 p-6 pt-32">
        <div className="max-w-7xl mx-auto">
          {/* Enhanced Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-8 mb-8"
          >
            <div className="flex items-center space-x-4">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl"
              >
                <Beaker className="text-white" size={32} />
              </motion.div>
              <div>
                <motion.h1
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2"
                >
                  Lab Tests & Packages
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-gray-600 text-lg"
                >
                  Book individual diagnostic tests or comprehensive health
                  packages
                </motion.p>
              </div>
            </div>
          </motion.div>

          {/* Tab Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/30 p-2 mb-8"
          >
            <div className="flex space-x-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab("tests")}
                className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 rounded-2xl font-semibold transition-all ${
                  activeTab === "tests"
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                    : "text-gray-700 hover:bg-white/50"
                }`}
              >
                <TestTube size={20} />
                <span>Lab Tests</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab("packages")}
                className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 rounded-2xl font-semibold transition-all ${
                  activeTab === "packages"
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                    : "text-gray-700 hover:bg-white/50"
                }`}
              >
                <PackageIcon size={20} />
                <span>Packages</span>
              </motion.button>
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
                    placeholder={`Search ${
                      activeTab === "tests" ? "lab tests" : "packages"
                    } by name or description...`}
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
                  {(activeTab === "tests"
                    ? testCategories
                    : packageCategories
                  ).map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </motion.select>
              </div>
              <div className="flex items-center space-x-2">
                <Filter size={20} className="text-gray-400" />
                <span className="text-gray-600 font-medium">
                  {activeTab === "tests"
                    ? `${filteredLabTests.length} tests found`
                    : `${filteredLabPackages.length} packages found`}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Content Grid */}
          {activeTab === "tests" ? (
            filteredLabTests.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/30 p-12 text-center"
              >
                <TestTube className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  No lab tests found
                </h3>
                <p className="text-gray-600">
                  Try adjusting your search or filter criteria
                </p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
              >
                {filteredLabTests.map((test) => renderLabTestCard(test))}
              </motion.div>
            )
          ) : filteredLabPackages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/30 p-12 text-center"
            >
              <PackageIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No packages found
              </h3>
              <p className="text-gray-600">
                Try adjusting your search or filter criteria
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
            >
              {filteredLabPackages.map((pkg) => renderLabPackageCard(pkg))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
