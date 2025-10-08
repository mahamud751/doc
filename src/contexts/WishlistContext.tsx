"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { toast } from "react-hot-toast";

interface WishlistItem {
  id: string;
  item_type: "MEDICINE" | "LAB_TEST" | "LAB_PACKAGE";
  item_id: string;
  added_at: string;
  itemData: {
    id: string;
    name: string;
    price?: number;
    unit_price?: number;
    category?: string;
    description?: string;
    image_url?: string;
  } | null;
}

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  isInWishlist: (itemId: string, itemType: string) => boolean;
  addToWishlist: (
    itemId: string,
    itemType: string,
    itemName: string
  ) => Promise<void>;
  removeFromWishlist: (
    itemId: string,
    itemType: string,
    itemName: string
  ) => Promise<void>;
  refreshWishlist: () => Promise<void>;
  loading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(
  undefined
);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch wishlist on mount
  useEffect(() => {
    refreshWishlist();
  }, []);

  const refreshWishlist = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      if (!token) {
        setWishlistItems([]);
        return;
      }

      const response = await fetch("/api/patients/wishlist", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch wishlist");
      }

      const data = await response.json();
      setWishlistItems(data.wishlist.items || []);
    } catch (error) {
      console.error("Error refreshing wishlist:", error);
      setWishlistItems([]);
    } finally {
      setLoading(false);
    }
  };

  const isInWishlist = (itemId: string, itemType: string) => {
    return wishlistItems.some(
      (item) => item.item_id === itemId && item.item_type === itemType
    );
  };

  const addToWishlist = async (
    itemId: string,
    itemType: string,
    itemName: string
  ) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        toast.error("Please log in to add items to your wishlist");
        return;
      }

      const response = await fetch("/api/patients/wishlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          item_type: itemType,
          item_id: itemId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add item to wishlist");
      }

      await refreshWishlist();
      toast.success(`${itemName} added to wishlist!`);
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to add item to wishlist"
      );
    }
  };

  const removeFromWishlist = async (
    itemId: string,
    itemType: string,
    itemName: string
  ) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        toast.error("Please log in to remove items from your wishlist");
        return;
      }

      const response = await fetch(`/api/patients/wishlist?item_id=${itemId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to remove item from wishlist"
        );
      }

      await refreshWishlist();
      toast.success(`${itemName} removed from wishlist!`);
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to remove item from wishlist"
      );
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        isInWishlist,
        addToWishlist,
        removeFromWishlist,
        refreshWishlist,
        loading,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
