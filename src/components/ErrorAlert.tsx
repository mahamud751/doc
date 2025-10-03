import { motion } from "framer-motion";
import { AlertCircle, X } from "lucide-react";

interface ErrorAlertProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export default function ErrorAlert({
  message,
  onDismiss,
  className = "",
}: ErrorAlertProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm flex items-start ${className}`}
    >
      <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
      <div className="flex-1">{message}</div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-2 text-red-600 hover:text-red-800 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </motion.div>
  );
}
