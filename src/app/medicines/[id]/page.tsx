"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  Pill,
  ShoppingCart,
  Heart,
  AlertCircle,
  ChevronLeft,
  Package,
  Clock,
  Shield,
} from "lucide-react";
import WishlistButton from "@/components/WishlistButton";
import { formatCurrency } from "@/lib/utils";

interface Medicine {
  id: string;
  name: string;
  generic_name: string;
  brand_name: string;
  manufacturer: string;
  category: string;
  strength: string;
  unit_price: number;
  stock_quantity: number;
  description: string;
  side_effects: string;
  contraindications: string;
  dosage_instructions: string;
  prescription_required: boolean;
  image_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function MedicineDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMedicine();
  }, [params.id]);

  const fetchMedicine = async () => {
    try {
      setLoading(true);
      setError("");

      // In a real app, you would fetch from your API
      // For demo purposes, we'll use mock data
      const mockMedicine: Medicine = {
        id: params.id,
        name: "Paracetamol 500mg",
        generic_name: "Paracetamol",
        brand_name: "Tylenol",
        manufacturer: "Johnson & Johnson",
        category: "Pain Relief",
        strength: "500mg",
        unit_price: 15.99,
        stock_quantity: 100,
        description:
          "Paracetamol is a common painkiller used to treat aches and pains. It can also be used to reduce a high temperature (fever).",
        side_effects:
          "May cause nausea, stomach pain, or allergic reactions in some people.",
        contraindications:
          "Should not be used by people with severe liver disease.",
        dosage_instructions:
          "Take 1-2 tablets every 4-6 hours as needed. Do not exceed 4g (8 tablets) in 24 hours.",
        prescription_required: false,
        image_url: "",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setMedicine(mockMedicine);
    } catch (err) {
      setError("Failed to load medicine details");
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

  if (error || !medicine) {
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
            Error Loading Medicine
          </h3>
          <p className="text-gray-600 mb-6">{error || "Medicine not found"}</p>
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
            Back to Medicines
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Medicine Image and Basic Info */}
          <div className="lg:col-span-2">
            <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-2xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-3xl font-bold text-gray-900">
                      {medicine.name}
                    </CardTitle>
                    <p className="text-gray-600 mt-2">
                      {medicine.generic_name} • {medicine.brand_name}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {medicine.category}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                      {medicine.strength}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="md:w-1/3">
                    <div className="bg-gray-100 rounded-2xl aspect-square flex items-center justify-center">
                      <Pill className="h-24 w-24 text-gray-400" />
                    </div>
                  </div>
                  <div className="md:w-2/3">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                      <div>
                        <p className="text-3xl font-bold text-gray-900">
                          {formatCurrency(medicine.unit_price)}
                        </p>
                        <p className="text-gray-600">
                          {medicine.stock_quantity > 0 ? (
                            <span className="text-green-600">In Stock</span>
                          ) : (
                            <span className="text-red-600">Out of Stock</span>
                          )}
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <WishlistButton
                          itemId={medicine.id}
                          itemType="MEDICINE"
                          itemName={medicine.name}
                        />
                        <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-full shadow-lg">
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Add to Cart
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          Description
                        </h3>
                        <p className="text-gray-700">{medicine.description}</p>
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          Dosage Instructions
                        </h3>
                        <p className="text-gray-700 bg-blue-50 rounded-2xl p-4">
                          {medicine.dosage_instructions}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 mb-2">
                            Side Effects
                          </h3>
                          <p className="text-gray-700 bg-yellow-50 rounded-2xl p-4">
                            {medicine.side_effects}
                          </p>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 mb-2">
                            Contraindications
                          </h3>
                          <p className="text-gray-700 bg-red-50 rounded-2xl p-4">
                            {medicine.contraindications}
                          </p>
                        </div>
                      </div>
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
                  <Shield className="h-5 w-5 mr-2 text-green-600" />
                  Product Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Manufacturer</span>
                  <span className="font-medium text-gray-900">
                    {medicine.manufacturer}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Category</span>
                  <span className="font-medium text-gray-900">
                    {medicine.category}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Strength</span>
                  <span className="font-medium text-gray-900">
                    {medicine.strength}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Prescription Required</span>
                  <span className="font-medium text-gray-900">
                    {medicine.prescription_required ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600">Availability</span>
                  <span className="font-medium text-gray-900">
                    {medicine.stock_quantity > 0 ? (
                      <span className="text-green-600">In Stock</span>
                    ) : (
                      <span className="text-red-600">Out of Stock</span>
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-2xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-amber-600" />
                  Delivery Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <Package className="h-5 w-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Free delivery on orders over ৳500</span>
                  </li>
                  <li className="flex items-start">
                    <Clock className="h-5 w-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Delivery within 2-3 business days</span>
                  </li>
                  <li className="flex items-start">
                    <Shield className="h-5 w-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Secure packaging</span>
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
