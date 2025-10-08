"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { 
  Package, 
  ShoppingCart, 
  Heart, 
  AlertCircle,
  ChevronLeft,
  Clock,
  Shield,
  TestTube,
  FileText
} from "lucide-react";
import WishlistButton from "@/components/WishlistButton";
import { formatCurrency } from "@/lib/utils";

interface LabPackage {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  preparation_required: boolean;
  preparation_instructions: string;
  sample_type: string;
  reporting_time: string;
  is_home_collection: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  tests: Array<{
    id: string;
    name: string;
    code: string;
  }>;
}

export default function LabPackageDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [labPackage, setLabPackage] = useState<LabPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchLabPackage();
  }, [params.id]);

  const fetchLabPackage = async () => {
    try {
      setLoading(true);
      setError("");

      // In a real app, you would fetch from your API
      // For demo purposes, we'll use mock data
      const mockLabPackage: LabPackage = {
        id: params.id,
        name: "Comprehensive Health Checkup",
        description: "A complete health assessment package that includes all essential tests to evaluate your overall health status.",
        category: "Health Checkup",
        price: 1200.00,
        preparation_required: true,
        preparation_instructions: "1. Fast for 10-12 hours before the test (only water allowed)\n2. Avoid alcohol for 24 hours prior to the test\n3. Bring any previous medical reports if available",
        sample_type: "Blood, Urine",
        reporting_time: "48-72 hours",
        is_home_collection: true,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tests: [
          { id: "1", name: "Complete Blood Count (CBC)", code: "CBC001" },
          { id: "2", name: "Liver Function Test", code: "LFT001" },
          { id: "3", name: "Kidney Function Test", code: "KFT001" },
          { id: "4", name: "Lipid Profile", code: "LP001" },
          { id: "5", name: "Blood Sugar (Fasting)", code: "BS001" },
          { id: "6", name: "Urine Routine", code: "UR001" }
        ]
      };

      setLabPackage(mockLabPackage);
    } catch (err) {
      setError("Failed to load lab package details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !labPackage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-white/30"
        >
          <div className="bg-red-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Error Loading Lab Package
          </h3>
          <p className="text-gray-600 mb-6">{error || "Lab package not found"}</p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => router.back()}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-full shadow-lg"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="h-5 w-5 mr-2" />
            Back to Packages
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lab Package Info */}
          <div className="lg:col-span-2">
            <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-2xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-3xl font-bold text-gray-900">
                      {labPackage.name}
                    </CardTitle>
                    <p className="text-gray-600 mt-2">
                      {labPackage.tests.length} Tests Included
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {labPackage.category}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                      Package
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div>
                    <p className="text-3xl font-bold text-gray-900">
                      {formatCurrency(labPackage.price)}
                    </p>
                    <p className="text-gray-600">
                      Results in {labPackage.reporting_time}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <WishlistButton
                      itemId={labPackage.id}
                      itemType="LAB_PACKAGE"
                      itemName={labPackage.name}
                    />
                    <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-full shadow-lg">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Book Package
                    </Button>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Package Description
                    </h3>
                    <p className="text-gray-700">{labPackage.description}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Preparation Instructions
                    </h3>
                    <div className="text-gray-700 bg-blue-50 rounded-2xl p-4 whitespace-pre-line">
                      {labPackage.preparation_instructions}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center">
                      <TestTube className="h-5 w-5 mr-2" />
                      Tests Included ({labPackage.tests.length})
                    </h3>
                    <div className="bg-gray-50 rounded-2xl p-4">
                      <ul className="space-y-2">
                        {labPackage.tests.map((test) => (
                          <li 
                            key={test.id} 
                            className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200"
                          >
                            <div>
                              <span className="font-medium text-gray-900">{test.name}</span>
                              <span className="text-sm text-gray-500 ml-2">({test.code})</span>
                            </div>
                            <FileText className="h-4 w-4 text-gray-400" />
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar with Additional Info */}
          <div className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-2xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-green-600" />
                  Package Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Category</span>
                  <span className="font-medium text-gray-900">
                    {labPackage.category}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Sample Type</span>
                  <span className="font-medium text-gray-900">
                    {labPackage.sample_type}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Preparation Required</span>
                  <span className="font-medium text-gray-900">
                    {labPackage.preparation_required ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Home Collection</span>
                  <span className="font-medium text-gray-900">
                    {labPackage.is_home_collection ? "Available" : "Not Available"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600">Reporting Time</span>
                  <span className="font-medium text-gray-900">
                    {labPackage.reporting_time}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-2xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-amber-600" />
                  Service Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <Shield className="h-5 w-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Accurate and reliable results from certified labs</span>
                  </li>
                  <li className="flex items-start">
                    <Clock className="h-5 w-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Results delivered within {labPackage.reporting_time}</span>
                  </li>
                  <li className="flex items-start">
                    <Package className="h-5 w-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span>{labPackage.is_home_collection ? "Home sample collection available" : "Center visit required"}</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}