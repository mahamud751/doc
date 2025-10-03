"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import NavigationHeader from "@/components/NavigationHeader";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/Button";
import { Pill, TestTube, Loader2, CreditCard } from "lucide-react";

interface PatientData {
  name: string;
  email: string;
  phone: string;
  address?: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, cartTotal, clearCart } = useCart();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [patientData, setPatientData] = useState<PatientData>({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    // Load patient data from localStorage if available
    const savedPatientData = localStorage.getItem("patientData");
    if (savedPatientData) {
      try {
        setPatientData(JSON.parse(savedPatientData));
      } catch (e) {
        console.error("Failed to parse patient data", e);
      }
    }
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setPatientData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!patientData.name || !patientData.phone || !patientData.address) {
      addToast("Please fill in all required fields", "error");
      return;
    }

    // Save patient data to localStorage
    localStorage.setItem("patientData", JSON.stringify(patientData));

    setLoading(true);

    try {
      const token = localStorage.getItem("authToken");
      const userId = localStorage.getItem("userId");

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patient_id: userId,
          patient_name: patientData.name,
          patient_phone: patientData.phone,
          delivery_address: patientData.address,
          items: cartItems.map((item) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price.toString(),
            type: item.type,
          })),
          total_amount: cartTotal,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create order");
      }

      // Clear cart after successful checkout
      clearCart();

      // Show success message
      addToast("Order placed successfully!", "success");

      // Redirect to patient dashboard
      router.push("/patient/dashboard");
    } catch (error: unknown) {
      console.error("Checkout error:", error);
      addToast(
        error instanceof Error ? error.message : "Failed to place order",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-white/30">
          <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-gray-600"
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
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Your cart is empty
          </h3>
          <p className="text-gray-600 mb-6">
            Add some items to your cart before checking out
          </p>
          <Button
            onClick={() => router.push("/medicines")}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-full shadow-lg"
          >
            Browse Medicines
          </Button>
        </div>
      </div>
    );
  }

  // Separate cart items by type
  const medicineItems = cartItems.filter((item) => item.type === "medicine");
  const testItems = cartItems.filter(
    (item) => item.type === "test" || item.type === "package"
  );

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
      <NavigationHeader />

      <div className="relative z-10 p-6 pt-32">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-8 mb-8"
          >
            <div className="text-center mb-8">
              <motion.h1
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4"
              >
                Checkout
              </motion.h1>
              <p className="text-gray-600">
                Review your order and complete the checkout process
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Order Summary */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Order Summary
                </h2>

                {/* Medicine Items */}
                {medicineItems.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-blue-600 mb-3 flex items-center">
                      <Pill className="w-5 h-5 mr-2" />
                      Medicines ({medicineItems.length})
                    </h3>
                    <div className="space-y-3">
                      {medicineItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center p-3 bg-blue-50 rounded-lg"
                        >
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {item.name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              Qty: {item.quantity}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              ৳{(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Test/Package Items */}
                {testItems.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-purple-600 mb-3 flex items-center">
                      <TestTube className="w-5 h-5 mr-2" />
                      Lab Tests/Packages ({testItems.length})
                    </h3>
                    <div className="space-y-3">
                      {testItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center p-3 bg-purple-50 rounded-lg"
                        >
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {item.name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              Qty: {item.quantity}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              ৳{(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Total */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-gray-900">
                      Total
                    </span>
                    <span className="text-xl font-bold text-gray-900">
                      ৳{cartTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Customer Information
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={patientData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={patientData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={patientData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Delivery Address *
                    </label>
                    <textarea
                      name="address"
                      value={patientData.address}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div className="pt-4">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-full shadow-lg py-3 text-lg font-medium"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center">
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Processing...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center">
                          <CreditCard className="w-5 h-5 mr-2" />
                          Place Order
                        </span>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
