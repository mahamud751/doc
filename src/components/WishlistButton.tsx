"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Heart } from "lucide-react";
import { useWishlist } from "@/contexts/WishlistContext";

interface WishlistButtonProps {
  itemId: string;
  itemType: "MEDICINE" | "LAB_TEST" | "LAB_PACKAGE";
  itemName: string;
  onToggle?: (isInWishlist: boolean) => void;
}

export default function WishlistButton({
  itemId,
  itemType,
  itemName,
  onToggle,
}: WishlistButtonProps) {
  const { isInWishlist, addToWishlist, removeFromWishlist, loading } = useWishlist();
  const [localLoading, setLocalLoading] = useState(false);
  
  const isItemInWishlist = isInWishlist(itemId, itemType);

  const handleToggle = async () => {
    try {
      setLocalLoading(true);
      
      if (isItemInWishlist) {
        await removeFromWishlist(itemId, itemType, itemName);
        if (onToggle) onToggle(false);
      } else {
        await addToWishlist(itemId, itemType, itemName);
        if (onToggle) onToggle(true);
      }
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      disabled={loading || localLoading}
      className={`rounded-full ${
        isItemInWishlist
          ? "bg-red-500 hover:bg-red-600 text-white border-red-500"
          : "border-gray-300 hover:border-red-300"
      }`}
    >
      <Heart
        className={`h-4 w-4 ${
          isItemInWishlist ? "fill-current" : ""
        }`}
      />
      <span className="ml-2">
        {isItemInWishlist ? "In Wishlist" : "Add to Wishlist"}
      </span>
    </Button>
  );
}
