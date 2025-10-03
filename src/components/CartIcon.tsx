"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useCart } from "@/context/CartContext";
import CartModal from "@/components/CartModal";

export default function CartIcon() {
  const { cartCount, medicineCount, testCount } = useCart();
  const [showCart, setShowCart] = useState(false);

  return (
    <>
      {/* Cart Icon - Positioned in the middle right side */}
      <div className="fixed right-8 top-1/2 transform -translate-y-1/2 z-50">
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="relative"
        >
          <button
            onClick={() => setShowCart(!showCart)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-5 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 ring-4 ring-white/30 hover:ring-opacity-100"
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 11-4 0v-6m4 0V9a2 2 0 10-4 0v4.01"
              />
            </svg>
          </button>
          {cartCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-3 -right-3 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold rounded-full h-8 w-8 flex items-center justify-center shadow-lg ring-2 ring-white"
            >
              {cartCount}
            </motion.span>
          )}
        </motion.div>

        {/* Separate counters for medicines and tests */}
        {medicineCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-3 left-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg ring-2 ring-white"
          >
            M{medicineCount}
          </motion.span>
        )}
        {testCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -bottom-3 left-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg ring-2 ring-white"
          >
            T{testCount}
          </motion.span>
        )}
      </div>

      {/* Cart Modal */}
      <CartModal isOpen={showCart} onClose={() => setShowCart(false)} />
    </>
  );
}
