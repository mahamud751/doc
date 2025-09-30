"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FlaskConical,
  Search,
  Calendar,
  Clock,
  Home,
  ShieldCheck,
  Users,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface LabPackage {
  id: string;
  name: string;
  description: string;
  category: string;
  tests_included: string[];
  price: number;
  preparation_required: boolean;
  preparation_instructions: string;
  sample_type: string;
  reporting_time: string;
  is_home_collection: boolean;
}

export default function LabTestsPage() {
  const router = useRouter();
  const [labPackages, setLabPackages] = useState<LabPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);

  const categories = [
    "all",
    "Blood Test",
    "X-Ray",
    "MRI",
    "CT Scan",
    "Ultrasound",
    "ECG",
    "Hormone Test",
  ];

  useEffect(() => {
    fetchLabPackages();
  }, []);

  const fetchLabPackages = async () => {
    try {
      const response = await fetch("/api/lab-packages");
      if (response.ok) {
        const data = await response.json();
        setLabPackages(data.packages || []);
      }
    } catch (error) {
      console.error("Error fetching lab packages:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPackages = labPackages.filter((pkg) => {
    const matchesSearch = pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.tests_included.some(test => test.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || pkg.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const togglePackageSelection = (packageId: string) => {
    setSelectedPackages(prev => 
      prev.includes(packageId) 
        ? prev.filter(id => id !== packageId)
        : [...prev, packageId]
    );
  };

  const getSelectedTotal = () => {
    return selectedPackages.reduce((total, packageId) => {
      const pkg = labPackages.find(p => p.id === packageId);
      return total + (pkg ? pkg.price : 0);
    }, 0);
  };

  const handleBookTests = () => {
    if (selectedPackages.length === 0) {
      alert("Please select at least one test package");
      return;
    }
    
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    // Store selected packages in localStorage for booking flow
    localStorage.setItem("selectedLabPackages", JSON.stringify(selectedPackages));
    router.push("/lab-booking");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center space-x-2">
                <FlaskConical className="w-6 h-6 text-purple-600" />
                <h1 className="text-xl font-bold text-gray-900">Lab Tests</h1>
              </div>
            </div>
            
            {selectedPackages.length > 0 && (
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  {selectedPackages.length} test{selectedPackages.length > 1 ? 's' : ''} selected
                </div>
                <div className="text-lg font-semibold text-purple-600">
                  ${getSelectedTotal().toFixed(2)}
                </div>
                <Button onClick={handleBookTests} className="bg-purple-600 hover:bg-purple-700">
                  Book Tests
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search lab tests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <div className="md:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === "all" ? "All Categories" : category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Features Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-center">
            <Home className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <h3 className="font-semibold text-purple-900">Home Collection</h3>
              <p className="text-sm text-purple-700">Free sample pickup</p>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center">
            <ShieldCheck className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <h3 className="font-semibold text-blue-900">Certified Labs</h3>
              <p className="text-sm text-blue-700">NABL accredited</p>
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
            <Clock className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <h3 className="font-semibold text-green-900">Fast Reports</h3>
              <p className="text-sm text-green-700">Digital & email delivery</p>
            </div>
          </div>
        </div>

        {/* Lab Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPackages.map((pkg, index) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`bg-white rounded-lg shadow-sm border-2 transition-all cursor-pointer ${
                selectedPackages.includes(pkg.id)
                  ? "border-purple-500 shadow-lg"
                  : "border-gray-200 hover:border-purple-300"
              }`}
              onClick={() => togglePackageSelection(pkg.id)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">{pkg.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{pkg.description}</p>
                    <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                      {pkg.category}
                    </span>
                  </div>
                  {selectedPackages.includes(pkg.id) && (
                    <CheckCircle className="w-6 h-6 text-purple-600 flex-shrink-0" />
                  )}
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Tests Included ({pkg.tests_included.length})
                  </h4>
                  <div className="max-h-20 overflow-y-auto">
                    <ul className="text-xs text-gray-600 space-y-1">
                      {pkg.tests_included.slice(0, 4).map((test, idx) => (
                        <li key={idx}>• {test}</li>
                      ))}
                      {pkg.tests_included.length > 4 && (
                        <li className="text-purple-600">+ {pkg.tests_included.length - 4} more tests</li>
                      )}
                    </ul>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    Report in {pkg.reporting_time}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <FlaskConical className="w-4 h-4 mr-2" />
                    Sample: {pkg.sample_type}
                  </div>
                  {pkg.is_home_collection && (
                    <div className="flex items-center text-sm text-green-600">
                      <Home className="w-4 h-4 mr-2" />
                      Home collection available
                    </div>
                  )}
                  {pkg.preparation_required && (
                    <div className="flex items-center text-sm text-orange-600">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Preparation required
                    </div>
                  )}
                </div>

                {pkg.preparation_required && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                    <h5 className="text-sm font-medium text-orange-900 mb-1">
                      Preparation Instructions
                    </h5>
                    <p className="text-xs text-orange-800">{pkg.preparation_instructions}</p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-purple-600">
                    ${pkg.price.toFixed(2)}
                  </div>
                  <Button
                    variant={selectedPackages.includes(pkg.id) ? "default" : "outline"}
                    className={selectedPackages.includes(pkg.id) ? "bg-purple-600 hover:bg-purple-700" : ""}
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePackageSelection(pkg.id);
                    }}
                  >
                    {selectedPackages.includes(pkg.id) ? "Selected" : "Select"}
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredPackages.length === 0 && (
          <div className="text-center py-12">
            <FlaskConical className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No lab tests found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        )}

        {/* How it Works */}
        <div className="mt-16 bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">1. Select Tests</h3>
              <p className="text-sm text-gray-600">Choose from our comprehensive test packages</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">2. Book Slot</h3>
              <p className="text-sm text-gray-600">Schedule convenient time for sample collection</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Home className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">3. Sample Collection</h3>
              <p className="text-sm text-gray-600">Our technician visits your home for collection</p>
            </div>
            <div className="text-center">
              <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FlaskConical className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="font-semibold mb-2">4. Get Results</h3>
              <p className="text-sm text-gray-600">Receive digital reports via email & app</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}