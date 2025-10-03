import { Filter, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface CategoryFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  categories: string[];
  searchPlaceholder?: string;
  colorScheme?: "blue" | "purple";
}

export default function CategoryFilter({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  searchPlaceholder = "Search tests, packages, categories...",
  colorScheme = "purple",
}: CategoryFilterProps) {
  const colorClasses = {
    blue: {
      focusRing: "focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2",
      focusBorder: "focus:border-blue-500",
      text: "text-blue-600",
      bgHover: "bg-blue-50",
      borderHover: "border-blue-300",
      gradient: "from-blue-500 to-cyan-500",
      light: "bg-blue-50 text-blue-700 border-blue-200",
    },
    purple: {
      focusRing: "focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2",
      focusBorder: "focus:border-purple-500",
      text: "text-purple-600",
      bgHover: "bg-purple-50",
      borderHover: "border-purple-300",
      gradient: "from-purple-500 to-pink-500",
      light: "bg-purple-50 text-purple-700 border-purple-200",
    },
  };

  const colors = colorClasses[colorScheme];

  const clearSearch = () => {
    onSearchChange("");
  };

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Search Input with Enhanced Design */}
      <div className="flex-1">
        <label htmlFor="lab-search" className="sr-only">
          Search lab tests
        </label>
        <div className="relative group">
          <motion.div
            className={cn(
              "absolute inset-0 rounded-xl bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300",
              `from-${colorScheme}-500/10 to-${
                colorScheme === "blue" ? "cyan" : "pink"
              }-500/10`
            )}
          />
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors duration-200 group-hover:text-gray-600" />

          <input
            id="lab-search"
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className={cn(
              "w-full pl-12 pr-11 py-4 border border-gray-200 rounded-xl",
              "focus:ring-2 focus:border-transparent bg-white/95 backdrop-blur-sm",
              "transition-all duration-300 shadow-sm hover:shadow-md",
              "placeholder-gray-500 font-medium text-gray-900",
              "hover:border-gray-300 relative z-10",
              colors.focusRing,
              colors.focusBorder,
              searchTerm && "border-purple-300"
            )}
          />

          {/* Search Counter Badge */}
          <AnimatePresence>
            {searchTerm && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className={cn(
                  "absolute right-12 top-1/2 transform -translate-y-1/2",
                  "px-2 py-1 rounded-full text-xs font-semibold border",
                  colors.light
                )}
              >
                {searchTerm.length > 20
                  ? `${searchTerm.length} chars`
                  : `${searchTerm.length}`}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Clear Search Button */}
          <AnimatePresence>
            {searchTerm && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                onClick={clearSearch}
                className={cn(
                  "absolute right-3 top-1/2 transform -translate-y-1/2",
                  "p-1.5 rounded-lg transition-all duration-200",
                  "hover:bg-gray-100 text-gray-400 hover:text-gray-600",
                  "focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                )}
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Search Hint */}
          <AnimatePresence>
            {!searchTerm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute left-12 top-1/2 transform -translate-y-1/2 pointer-events-none"
              >
                <span className="text-sm text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Type to search tests...
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Search Results Summary */}
        <AnimatePresence>
          {searchTerm && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-2 flex items-center space-x-2 text-sm text-gray-600"
            >
              <span>Searching for:</span>
              <span className={cn("font-semibold", colors.text)}>
                &quot;{searchTerm}&quot;
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Enhanced Category Filter */}
      <div className="md:w-56">
        <label htmlFor="category-filter" className="sr-only">
          Filter by category
        </label>
        <div className="relative group">
          <motion.div
            className={cn(
              "absolute inset-0 rounded-xl bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300",
              `from-${colorScheme}-500/5 to-${
                colorScheme === "blue" ? "cyan" : "pink"
              }-500/5`
            )}
          />
          <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors duration-200 group-hover:text-gray-600 z-10" />

          <select
            id="category-filter"
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className={cn(
              "w-full pl-12 pr-12 py-4 border border-gray-200 rounded-xl",
              "focus:ring-2 focus:border-transparent bg-white/95 backdrop-blur-sm",
              "appearance-none transition-all duration-300 shadow-sm hover:shadow-md",
              "cursor-pointer text-gray-900 font-medium hover:border-gray-300",
              "relative z-10",
              colors.focusRing,
              colors.focusBorder,
              selectedCategory !== "all" && "border-purple-300"
            )}
          >
            {categories.map((category) => (
              <option
                key={category}
                value={category}
                className={cn(
                  "py-3 px-4 rounded-lg m-1",
                  selectedCategory === category
                    ? `${colors.bgHover} ${colors.text} font-semibold`
                    : "text-gray-700 hover:bg-gray-50"
                )}
              >
                {category === "all" ? "All Categories" : category}
              </option>
            ))}
          </select>

          {/* Custom Dropdown Arrow */}
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
            <motion.svg
              className="w-4 h-4 text-gray-400 transition-colors duration-200 group-hover:text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              animate={{ rotate: selectedCategory !== "all" ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </motion.svg>
          </div>

          {/* Active Filter Badge */}
          <AnimatePresence>
            {selectedCategory !== "all" && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className={cn(
                  "absolute -top-2 -right-2",
                  "px-2 py-1 rounded-full text-xs font-semibold border shadow-sm",
                  colors.light
                )}
              >
                Active
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Selected Category Display */}
        <AnimatePresence>
          {selectedCategory !== "all" && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-2 flex items-center space-x-2 text-sm text-gray-600"
            >
              <span>Filtering by:</span>
              <span className={cn("font-semibold capitalize", colors.text)}>
                {selectedCategory}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
