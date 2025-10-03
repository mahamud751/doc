"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface InfiniteScrollProps<T> {
  fetchData: (
    page: number,
    limit: number
  ) => Promise<{
    data: T[];
    hasMore: boolean;
    total: number;
  }>;
  renderItem: (item: T, index: number) => React.ReactNode;
  limit?: number;
  className?: string;
  loadingMessage?: string;
  emptyMessage?: string;
  errorMessage?: string;
}

export default function InfiniteScroll<T extends { id: string }>({
  fetchData,
  renderItem,
  limit = 20,
  className = "",
  loadingMessage = "Loading more...",
  emptyMessage = "No items found",
  errorMessage = "Error loading data",
}: InfiniteScrollProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  // Initial load
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchData(1, limit);
      setItems(result.data);
      setHasMore(result.hasMore);
      setTotal(result.total);
      setPage(1);
    } catch (err) {
      setError(errorMessage);
      console.error("Error loading initial data:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    try {
      setLoading(true);
      setError(null);
      const nextPage = page + 1;
      const result = await fetchData(nextPage, limit);

      setItems((prev) => [...prev, ...result.data]);
      setHasMore(result.hasMore);
      setPage(nextPage);
      setTotal(result.total);
    } catch (err) {
      setError(errorMessage);
      console.error("Error loading more data:", err);
    } finally {
      setLoading(false);
    }
  }, [page, loading, hasMore, fetchData, limit, errorMessage]);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop + 1000 >=
        document.documentElement.scrollHeight
      ) {
        loadMore();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadMore]);

  const refresh = useCallback(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    setError(null);
    loadInitialData();
  }, []);

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={refresh}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (items.length === 0 && !loading) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Items list */}
      <div className="space-y-4">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            {renderItem(item, index)}
          </motion.div>
        ))}
      </div>

      {/* Loading indicator */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center py-8"
        >
          <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
          <span className="text-gray-600">{loadingMessage}</span>
        </motion.div>
      )}

      {/* End of list indicator */}
      {!hasMore && items.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8 text-gray-500"
        >
          <div className="border-t border-gray-200 pt-4">
            Showing all {total} items
          </div>
        </motion.div>
      )}

      {/* Load more button (fallback for users who prefer clicking) */}
      {hasMore && !loading && items.length > 0 && (
        <div className="text-center py-4">
          <button
            onClick={loadMore}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg"
          >
            Load More ({total - items.length} remaining)
          </button>
        </div>
      )}
    </div>
  );
}

// Hook for managing infinite scroll state
export function useInfiniteScroll<T>(
  fetchFunction: (page: number, limit: number) => Promise<any>,
  limit: number = 20
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    try {
      setLoading(true);
      setError(null);
      const result = await fetchFunction(page, limit);

      if (result.success) {
        const newItems = result.data || result.items || [];
        const totalPages = result.pagination?.pages || 1;

        setItems((prev) => (page === 1 ? newItems : [...prev, ...newItems]));
        setHasMore(page < totalPages);
        setPage((prev) => prev + 1);
      } else {
        setError(result.error || "Failed to load data");
      }
    } catch (err) {
      setError("Network error");
      console.error("Error in useInfiniteScroll:", err);
    } finally {
      setLoading(false);
    }
  }, [page, loading, hasMore, fetchFunction, limit]);

  const reset = useCallback(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    setError(null);
  }, []);

  return {
    items,
    loading,
    hasMore,
    error,
    loadMore,
    reset,
  };
}
