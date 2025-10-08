"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { 
  TestTube, 
  ShoppingCart, 
  Heart, 
  AlertCircle,
  ChevronLeft,
  Clock,
  Shield,
  FileText
} from "lucide-react";
import WishlistButton from "@/components/WishlistButton";
import { formatCurrency } from "@/lib/utils";

interface LabTest {
  id: string;
  name: string;
  code: string;
  description: string;
  category: string;
  price: number;
  sample_type: string;
  preparation_required: boolean;
  preparation_instructions: string;
  reporting_time: string;
  normal_range: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function LabTestDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [labTest, setLabTest] = useState<LabTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchLabTest();
  }, [params.id]);

  const fetchLabTest = async () => {
    try {
      setLoading(true);
      setError("");

      // In a real app, you would fetch from your API
      // For demo purposes, we'll use mock data
      const mockLabTest: LabTest = {
        id: params.id,
        name: "Complete Blood Count (CBC)",
        code: "CBC001",
        description: "A complete blood count (CBC) is a common blood test that evaluates your overall health and detects a wide range of disorders, including anemia, infection and leukemia.",
        category: "Hematology",
        price: 350.00,
        sample_type: "Blood",
        preparation_required: false,
        preparation_instructions: "No special preparation required. You can eat and drink normally before this test.",
        reporting_time: "24-48 hours",
        normal_range: "Hemoglobin: 12-16 g/dL (women), 14-18 g/dL (men)",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setLabTest(mockLabTest);
    } catch (err) {
      setError("Failed to load lab test details");
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

  if (error || !labTest) {
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
            Error Loading Lab Test
          </h3>
          <p className="text-gray-600 mb-6">{error || "Lab test not found"}</p>
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
            Back to Lab Tests
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lab Test Info */}
          <div className="lg:col-span-2">
            <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-2xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-3xl font-bold text-gray-900">
                      {labTest.name}
                    </CardTitle>
                    <p className="text-gray-600 mt-2">
                      Test Code: {labTest.code}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {labTest.category}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                      {labTest.sample_type}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div>
                    <p className="text-3xl font-bold text-gray-900">
                      {formatCurrency(labTest.price)}
                    </p>
                    <p className="text-gray-600">
                      Results in {labTest.reporting_time}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <WishlistButton
                      itemId={labTest.id}
                      itemType="LAB_TEST"
                      itemName={labTest.name}
                    />
                    <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-full shadow-lg">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Book Test
                    </Button>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Description
                    </h3>
                    <p className="text-gray-700">{labTest.description}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Preparation Instructions
                    </h3>
                    <p className="text-gray-700 bg-blue-50 rounded-2xl p-4">
                      {labTest.preparation_instructions}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        Normal Range
                      </h3>
                      <p className="text-gray-700 bg-green-50 rounded-2xl p-4">
                        {labTest.normal_range}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        Reporting Time
                      </h3>
                      <p className="text-gray-700 bg-amber-50 rounded-2xl p-4">
                        Results available within {labTest.reporting_time}
                      </p>
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
                  Test Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Category</span>
                  <span className="font-medium text-gray-900">
                    {labTest.category}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Sample Type</span>
                  <span className="font-medium text-gray-900">
                    {labTest.sample_type}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Preparation Required</span>
                  <span className="font-medium text-gray-900">
                    {labTest.preparation_required ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Reporting Time</span>
                  <span className="font-medium text-gray-900">
                    {labTest.reporting_time}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600">Test Code</span>
                  <span className="font-medium text-gray-900">
                    {labTest.code}
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
                    <span>Accurate and reliable results</span>
                  </li>
                  <li className="flex items-start">
                    <Clock className="h-5 w-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Results delivered via email and app</span>
                  </li>
                  <li className="flex items-start">
                    <FileText className="h-5 w-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Reports reviewed by certified pathologists</span>
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