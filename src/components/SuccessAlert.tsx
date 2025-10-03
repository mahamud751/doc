import { motion } from "framer-motion";
import { CheckCircle, X } from "lucide-react";

interface SuccessAlertProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export default function SuccessAlert({
  message,
  onDismiss,
  className = "",
}: SuccessAlertProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm flex items-start ${className}`}
    >
      <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
      <div className="flex-1">{message}</div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-2 text-green-600 hover:text-green-800 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </motion.div>
  );
}
