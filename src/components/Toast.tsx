"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";

interface ToastProps {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  onClose: (id: string) => void;
}

export default function Toast({ id, message, type, onClose }: ToastProps) {
  const typeStyles = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500",
    warning: "bg-yellow-500",
  };

  const typeIcons = {
    success: "✓",
    error: "✕",
    info: "ℹ",
    warning: "⚠",
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, 5000);

    return () => clearTimeout(timer);
  }, [id, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className={`relative flex items-center justify-between p-4 mb-2 rounded-lg shadow-lg text-white ${typeStyles[type]} max-w-md`}
    >
      <div className="flex items-center">
        <span className="text-xl mr-2">{typeIcons[type]}</span>
        <span>{message}</span>
      </div>
      <button
        onClick={() => onClose(id)}
        className="ml-4 text-white hover:text-gray-200 focus:outline-none"
      >
        <X size={18} />
      </button>
    </motion.div>
  );
}
