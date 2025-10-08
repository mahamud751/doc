"use client";

import { motion } from "framer-motion";
import { Package, AlertTriangle, Clock, Shield, Heart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/Button";
import { useWishlist } from "@/contexts/WishlistContext";

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
  expiry_date: string;
  batch_number: string;
  description: string;
  side_effects?: string;
  contraindications?: string;
  storage_instructions?: string;
}

interface MedicineCardProps {
  medicine: Medicine;
  onEdit?: (medicine: Medicine) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
}

export default function MedicineCard({
  medicine,
  onEdit,
  onDelete,
  showActions = true,
}: MedicineCardProps) {
  const { addToCart } = useCart();
  const { addToast } = useToast();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();

  const isLowStock = medicine.stock_quantity < 50;
  const isExpiringSoon = () => {
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
    return new Date(medicine.expiry_date) <= sixMonthsFromNow;
  };

  const isInWish = isInWishlist(medicine.id, "MEDICINE");

  const handleAddToCart = () => {
    addToCart({
      id: medicine.id,
      name: medicine.name,
      price: Number(medicine.unit_price),
      type: "medicine",
      prescription_required: medicine.prescription_required,
    });

    addToast(`${medicine.name} added to cart`, "success");
  };

  const handleToggleWishlist = async () => {
    if (isInWish) {
      await removeFromWishlist(medicine.id, "MEDICINE", medicine.name);
    } else {
      await addToWishlist(medicine.id, "MEDICINE", medicine.name);
    }
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
                <Package className="text-white" size={20} />
              </motion.div>
              <h3 className="text-xl font-bold text-gray-900">
                {medicine.name}
              </h3>
            </div>
            <div className="flex items-center space-x-3 mb-4">
              <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                {medicine.category}
              </span>
              {isLowStock && (
                <motion.span
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border border-yellow-200"
                >
                  <AlertTriangle className="w-3 h-3 mr-1 fill-current" />
                  Low Stock
                </motion.span>
              )}
              {isExpiringSoon() && (
                <motion.span
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-200"
                >
                  <Clock className="w-3 h-3 mr-1 fill-current" />
                  Expiring
                </motion.span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-6 leading-relaxed">
          {medicine.description}
        </p>

        {/* Details */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Generic / Strength:</span>
            <span className="font-semibold text-gray-900">
              {medicine.generic_name} - {medicine.strength}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Manufacturer:</span>
            <span className="font-semibold text-gray-900">
              {medicine.manufacturer}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Stock:</span>
            <span className="font-semibold text-gray-900">
              {medicine.stock_quantity}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Expiry:</span>
            <span className="font-semibold text-gray-900">
              {medicine.expiry_date}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Prescription:</span>
            <div className="flex items-center space-x-1">
              {medicine.prescription_required ? (
                <Shield className="w-4 h-4 text-red-500" />
              ) : (
                <Shield className="w-4 h-4 text-green-500" />
              )}
              <span className="font-semibold text-gray-900">
                {medicine.prescription_required ? "Required" : "OTC"}
              </span>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              ${Number(medicine.unit_price).toFixed(2)}
            </span>
          </div>
          <p className="text-sm text-green-600 font-semibold">
            Total Value: $
            {(
              Number(medicine.unit_price) * Number(medicine.stock_quantity)
            ).toFixed(2)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <motion.div whileHover={{ scale: 1.05 }}>
            <Button
              onClick={handleAddToCart}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl px-4 py-2 text-white"
            >
              Add to Cart
            </Button>
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleToggleWishlist}
            className={`p-2 rounded-full ${
              isInWish
                ? "text-red-500 bg-red-50 hover:bg-red-100"
                : "text-gray-400 bg-gray-100 hover:bg-gray-200"
            }`}
          >
            <Heart className={`w-5 h-5 ${isInWish ? "fill-current" : ""}`} />
          </motion.button>

          {showActions && (
            <div className="flex items-center space-x-2">
              {onEdit && (
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Button
                    onClick={() => onEdit(medicine)}
                    variant="ghost"
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl p-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </Button>
                </motion.div>
              )}
              {onDelete && (
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Button
                    onClick={() => onDelete(medicine.id)}
                    variant="ghost"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl p-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </Button>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
