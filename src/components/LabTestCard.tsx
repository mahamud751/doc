"use client";

import { Button } from "@/components/ui/Button";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { motion } from "framer-motion";
import { Beaker } from "lucide-react";

interface LabTest {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  duration: string;
  requires_fasting: boolean;
  preparation_instructions: string;
  report_delivery_time: string;
}

interface LabTestCardProps {
  test: LabTest;
}

export default function LabTestCard({ test }: LabTestCardProps) {
  const { addToCart } = useCart();
  const { addToast } = useToast();

  const handleAddToCart = () => {
    addToCart({
      id: test.id,
      name: test.name,
      price: Number(test.price),
      type: test.category === "PACKAGE" ? "package" : "test",
    });

    addToast(`${test.name} added to cart`, "success");
  };

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/30 overflow-hidden hover:shadow-3xl transition-all duration-300"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-3">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl"
              >
                <Beaker className="text-white" size={20} />
              </motion.div>
              <h3 className="text-xl font-bold text-gray-900">{test.name}</h3>
            </div>
            <div className="flex items-center space-x-3 mb-4">
              <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                {test.category}
              </span>
              {test.requires_fasting && (
                <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                  Fasting Required
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-6 leading-relaxed">
          {test.description}
        </p>

        {/* Details */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Duration:</span>
            <span className="font-semibold text-gray-900">{test.duration}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Report Delivery:</span>
            <span className="font-semibold text-gray-900">
              {test.report_delivery_time}
            </span>
          </div>
          {test.requires_fasting && (
            <div className="flex items-start justify-between text-sm">
              <span className="text-gray-500">Preparation:</span>
              <span className="font-semibold text-gray-900 text-right">
                {test.preparation_instructions}
              </span>
            </div>
          )}
        </div>

        {/* Pricing */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              ${Number(test.price).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <motion.div whileHover={{ scale: 1.05 }}>
            <Button
              onClick={handleAddToCart}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl px-4 py-2 text-white w-full"
            >
              Add to Cart
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
