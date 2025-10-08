"use client";

import { useWishlist } from "@/contexts/WishlistContext";
import { Heart } from "lucide-react";
import Link from "next/link";

export default function WishlistIcon() {
  const { wishlistItems } = useWishlist();

  return (
    <Link
      href="/patient/dashboard?tab=wishlist"
      className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
    >
      <Heart className="h-6 w-6 text-gray-600" />
      {wishlistItems.length > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {wishlistItems.length}
        </span>
      )}
    </Link>
  );
}
