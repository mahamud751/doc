import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Clock,
  FlaskConical,
  Home,
  AlertCircle,
  TestTube,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface LabPackage {
  id: string;
  name: string;
  description: string;
  category: string;
  tests_included: string[];
  price: number;
  preparation_required: boolean;
  preparation_instructions: string;
  sample_type: string;
  reporting_time: string;
  is_home_collection: boolean;
}

interface LabTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  labPackage: LabPackage | null;
  onSelectTest: (id: string) => void;
  isSelected: boolean;
  colorScheme?: "blue" | "purple";
}

export default function LabTestModal({
  isOpen,
  onClose,
  labPackage,
  onSelectTest,
  isSelected,
  colorScheme = "purple",
}: LabTestModalProps) {
  const colorClasses = {
    blue: {
      gradient: "from-blue-500 to-cyan-500",
      bg: "bg-blue-50",
      text: "text-blue-600",
      border: "border-blue-200",
    },
    purple: {
      gradient: "from-purple-500 to-pink-500",
      bg: "bg-purple-50",
      text: "text-purple-600",
      border: "border-purple-200",
    },
  };

  const colors = colorClasses[colorScheme];

  if (!labPackage) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-lg z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 25 }}
            className="bg-white rounded-3xl shadow-2xl border border-white/30 p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {labPackage.name}
                    </h2>
                    <span
                      className={`inline-block ${colors.bg} ${colors.text} ${colors.border} text-xs px-3 py-1 rounded-full border shadow-sm mb-4`}
                    >
                      {labPackage.category}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={onClose}
                    className="rounded-full h-10 w-10 border-gray-300 hover:bg-gray-100"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </Button>
                </div>

                <p className="text-gray-600 mb-6">{labPackage.description}</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Tests Included */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <TestTube className="w-5 h-5 mr-2 text-purple-500" />
                  Tests Included ({labPackage.tests_included.length})
                </h3>
                <div className="bg-gray-50 rounded-2xl p-4 max-h-40 overflow-y-auto">
                  <ul className="space-y-2">
                    {labPackage.tests_included.map((test, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="mr-2 text-purple-500">•</span>
                        <span className="text-gray-700">{test}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Package Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className={`flex items-center text-gray-700 ${colors.bg} rounded-xl px-4 py-3`}
                >
                  <Clock className="w-5 h-5 mr-3 text-cyan-500" />
                  <div>
                    <p className="text-xs text-gray-500">Reporting Time</p>
                    <p className="font-medium">{labPackage.reporting_time}</p>
                  </div>
                </div>

                <div
                  className={`flex items-center text-gray-700 ${colors.bg} rounded-xl px-4 py-3`}
                >
                  <FlaskConical className="w-5 h-5 mr-3 text-purple-500" />
                  <div>
                    <p className="text-xs text-gray-500">Sample Type</p>
                    <p className="font-medium">{labPackage.sample_type}</p>
                  </div>
                </div>

                {labPackage.is_home_collection && (
                  <div className="flex items-center text-green-700 bg-green-50 rounded-xl px-4 py-3">
                    <Home className="w-5 h-5 mr-3 text-green-500" />
                    <div>
                      <p className="text-xs text-green-600">Collection</p>
                      <p className="font-medium">Home Collection Available</p>
                    </div>
                  </div>
                )}

                {labPackage.preparation_required && (
                  <div className="flex items-center text-orange-700 bg-orange-50 rounded-xl px-4 py-3">
                    <AlertCircle className="w-5 h-5 mr-3 text-orange-500" />
                    <div>
                      <p className="text-xs text-orange-600">Preparation</p>
                      <p className="font-medium">Required</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Preparation Instructions */}
              {labPackage.preparation_required && (
                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
                  <h4 className="font-semibold text-orange-900 mb-2">
                    Preparation Instructions
                  </h4>
                  <p className="text-orange-800 text-sm">
                    {labPackage.preparation_instructions}
                  </p>
                </div>
              )}

              {/* Price and CTA */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div>
                  <p className="text-sm text-gray-500">Total Price</p>
                  <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">
                    ${Number(labPackage.price).toFixed(2)}
                  </div>
                </div>
                <Button
                  onClick={() => {
                    onSelectTest(labPackage.id);
                    onClose();
                  }}
                  className={`${
                    isSelected
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                      : `bg-gradient-to-r ${colors.gradient} hover:from-purple-700 hover:to-pink-700`
                  } text-white rounded-full px-8 py-3 font-medium shadow-lg transition-all duration-300`}
                >
                  {isSelected ? "Selected" : "Select Test"}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
