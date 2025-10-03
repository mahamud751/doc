"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartModal({ isOpen, onClose }: CartModalProps) {
  const router = useRouter();
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    cartTotal,
    medicineCount,
    testCount,
  } = useCart();
  const [activeTab, setActiveTab] = useState<"medicines" | "tests">(
    "medicines"
  );

  const medicineItems = cartItems.filter((item) => item.type === "medicine");
  const testItems = cartItems.filter(
    (item) => item.type === "test" || item.type === "package"
  );

  const handleCheckout = () => {
    onClose();
    router.push("/checkout");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className="fixed right-6 top-1/2 transform -translate-y-1/2 z-40 w-96 bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-6 h-[600px] flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Your Cart</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-4">
            <button
              className={`py-2 px-4 font-medium text-sm ${
                activeTab === "medicines"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("medicines")}
            >
              Medicines ({medicineCount})
            </button>
            <button
              className={`py-2 px-4 font-medium text-sm ${
                activeTab === "tests"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("tests")}
            >
              Tests & Packages ({testCount})
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {activeTab === "medicines" && (
              <div className="space-y-4">
                {medicineItems.length === 0 ? (
                  <div className="text-center py-8">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
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
                    <p className="mt-2 text-gray-500">No medicines in cart</p>
                  </div>
                ) : (
                  medicineItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {item.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          ${item.price.toFixed(2)}
                        </p>
                        <span className="inline-block mt-1 text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                          {item.type}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="ml-2 text-red-500 hover:text-red-700 transition-colors"
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
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "tests" && (
              <div className="space-y-4">
                {testItems.length === 0 ? (
                  <div className="text-center py-8">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
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
                    <p className="mt-2 text-gray-500">
                      No tests or packages in cart
                    </p>
                  </div>
                ) : (
                  testItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {item.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          ${Number(item.price).toFixed(2)}
                        </p>
                        <span className="inline-block mt-1 text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                          {item.type}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="ml-2 text-red-500 hover:text-red-700 transition-colors"
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
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {cartItems.length > 0 && (
            <div className="pt-4 border-t border-gray-200 mt-auto">
              <div className="flex justify-between font-bold text-lg mb-4">
                <span>Total:</span>
                <span className="text-green-600">${cartTotal.toFixed(2)}</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCheckout}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Proceed to Checkout
              </motion.button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
