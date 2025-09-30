"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Pill,
  Search,
  ShoppingCart,
  Filter,
  Star,
  Truck,
  ShieldCheck,
  Heart,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Medicine {
  id: string;
  name: string;
  generic_name: string;
  manufacturer: string;
  category: string;
  strength: string;
  unit_price: number;
  stock_quantity: number;
  prescription_required: boolean;
  image_url?: string;
}

export default function MedicinesPage() {
  const router = useRouter();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState<{ [key: string]: number }>({});

  const categories = [
    "all",
    "Pain Relief",
    "Antibiotics",
    "Cardiovascular",
    "Diabetes",
    "Respiratory",
    "Vitamins",
  ];

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      const response = await fetch("/api/medicines");
      if (response.ok) {
        const data = await response.json();
        setMedicines(data.medicines || []);
      }
    } catch (error) {
      console.error("Error fetching medicines:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMedicines = medicines.filter((medicine) => {
    const matchesSearch =
      medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medicine.generic_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || medicine.category === selectedCategory;
    return matchesSearch && matchesCategory && medicine.stock_quantity > 0;
  });

  const addToCart = (medicineId: string) => {
    setCart((prev) => ({
      ...prev,
      [medicineId]: (prev[medicineId] || 0) + 1,
    }));
  };

  const removeFromCart = (medicineId: string) => {
    setCart((prev) => {
      const newCart = { ...prev };
      if (newCart[medicineId] > 1) {
        newCart[medicineId]--;
      } else {
        delete newCart[medicineId];
      }
      return newCart;
    });
  };

  const getCartTotal = () => {
    return Object.entries(cart).reduce((total, [medicineId, quantity]) => {
      const medicine = medicines.find((m) => m.id === medicineId);
      return total + (medicine ? medicine.unit_price * quantity : 0);
    }, 0);
  };

  const getCartItemsCount = () => {
    return Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
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
                <Pill className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">Medicines</h1>
              </div>
            </div>

            {getCartItemsCount() > 0 && (
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <ShoppingCart className="w-6 h-6 text-gray-600" />
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {getCartItemsCount()}
                  </span>
                </div>
                <span className="text-lg font-semibold text-green-600">
                  ${getCartTotal().toFixed(2)}
                </span>
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
                placeholder="Search medicines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="md:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {categories.map((category) => (
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
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
            <Truck className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <h3 className="font-semibold text-green-900">Free Delivery</h3>
              <p className="text-sm text-green-700">On orders above $50</p>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center">
            <ShieldCheck className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <h3 className="font-semibold text-blue-900">
                Verified Medicines
              </h3>
              <p className="text-sm text-blue-700">100% authentic products</p>
            </div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-center">
            <Heart className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <h3 className="font-semibold text-purple-900">Expert Support</h3>
              <p className="text-sm text-purple-700">
                24/7 pharmacist assistance
              </p>
            </div>
          </div>
        </div>

        {/* Medicines Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMedicines.map((medicine, index) => (
            <motion.div
              key={medicine.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-sm border hover:shadow-lg transition-shadow"
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {medicine.name}
                    </h3>
                    {medicine.generic_name && (
                      <p className="text-sm text-gray-600">
                        ({medicine.generic_name})
                      </p>
                    )}
                  </div>
                  {medicine.prescription_required && (
                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                      Rx Required
                    </span>
                  )}
                </div>

                <div className="mb-3">
                  <p className="text-sm text-gray-600">
                    {medicine.manufacturer}
                  </p>
                  <p className="text-sm text-gray-600">{medicine.strength}</p>
                  <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded mt-1">
                    {medicine.category}
                  </span>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="text-lg font-bold text-green-600">
                    ${medicine.unit_price.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">
                    Stock: {medicine.stock_quantity}
                  </div>
                </div>

                {cart[medicine.id] ? (
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      onClick={() => removeFromCart(medicine.id)}
                      className="px-3 py-1 text-sm"
                    >
                      -
                    </Button>
                    <span className="mx-3 font-semibold">
                      {cart[medicine.id]}
                    </span>
                    <Button
                      onClick={() => addToCart(medicine.id)}
                      className="px-3 py-1 text-sm"
                    >
                      +
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => addToCart(medicine.id)}
                    className="w-full"
                    disabled={medicine.stock_quantity === 0}
                  >
                    {medicine.stock_quantity === 0
                      ? "Out of Stock"
                      : "Add to Cart"}
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {filteredMedicines.length === 0 && (
          <div className="text-center py-12">
            <Pill className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No medicines found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}

        {/* Cart Summary */}
        {getCartItemsCount() > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border p-4 max-w-sm"
          >
            <h3 className="font-semibold mb-2">Cart Summary</h3>
            <div className="space-y-1 mb-3">
              {Object.entries(cart).map(([medicineId, quantity]) => {
                const medicine = medicines.find((m) => m.id === medicineId);
                if (!medicine) return null;
                return (
                  <div
                    key={medicineId}
                    className="flex justify-between text-sm"
                  >
                    <span>
                      {medicine.name} x{quantity}
                    </span>
                    <span>${(medicine.unit_price * quantity).toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
            <div className="border-t pt-2 mb-3">
              <div className="flex justify-between font-semibold">
                <span>Total: ${getCartTotal().toFixed(2)}</span>
              </div>
            </div>
            <Button className="w-full">Proceed to Checkout</Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
