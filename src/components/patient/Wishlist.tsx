"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Heart,
  Pill,
  TestTube,
  Package,
  X,
  ShoppingCart,
  AlertCircle,
} from "lucide-react";
import { useWishlist } from "@/contexts/WishlistContext";

interface WishlistItem {
  id: string;
  item_type: string;
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

export default function Wishlist() {
  const { wishlistItems, loading, refreshWishlist, removeFromWishlist } =
    useWishlist();
  const [error, setError] = useState("");

  // Transform wishlist items to include itemData (this is already done in the API)
  const itemsWithDetails = wishlistItems.map((item) => {
    // The itemData is already included from the API, so we just return the item
    return item as WishlistItem;
  });

  const handleRemoveFromWishlist = async (
    itemId: string,
    itemType: string,
    itemName: string
  ) => {
    try {
      await removeFromWishlist(itemId, itemType, itemName);
      await refreshWishlist();
    } catch (error) {
      console.error("Error removing item from wishlist:", error);
      setError("Failed to remove item from wishlist");
    }
  };

  const handleAddToCart = async (item: WishlistItem) => {
    try {
      // This would integrate with your existing cart system
      alert(`Added ${item.itemData?.name} to cart!`);

      // Remove from wishlist after adding to cart
      if (item.itemData) {
        await handleRemoveFromWishlist(
          item.item_id,
          item.item_type,
          item.itemData.name
        );
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      setError("Failed to add item to cart");
    }
  };

  const getItemTypeColor = (itemType: string) => {
    switch (itemType) {
      case "MEDICINE":
        return "from-green-500 to-emerald-500";
      case "LAB_TEST":
        return "from-blue-500 to-cyan-500";
      case "LAB_PACKAGE":
        return "from-purple-500 to-violet-500";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const getItemTypeIcon = (itemType: string) => {
    switch (itemType) {
      case "MEDICINE":
        return <Pill className="h-5 w-5 text-white" />;
      case "LAB_TEST":
        return <TestTube className="h-5 w-5 text-white" />;
      case "LAB_PACKAGE":
        return <Package className="h-5 w-5 text-white" />;
      default:
        return <Heart className="h-5 w-5 text-white" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-2xl rounded-3xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-center text-red-500">
            <AlertCircle className="h-6 w-6 mr-2" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          My Wishlist
        </h2>
        <div className="flex items-center text-gray-600">
          <Heart className="h-5 w-5 mr-2 text-red-500 fill-current" />
          <span className="font-semibold">
            {itemsWithDetails.length || 0} items
          </span>
        </div>
      </div>

      {itemsWithDetails.length === 0 ? (
        <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-2xl rounded-3xl">
          <CardContent className="p-12 text-center">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Your wishlist is empty
            </h3>
            <p className="text-gray-600 mb-6">
              Start adding medicines, lab tests, and packages to your wishlist
            </p>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-full shadow-lg transition-all duration-300 hover:shadow-xl">
              Browse Products
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {itemsWithDetails.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className="bg-white/80 backdrop-blur-sm border-white/30 shadow-2xl rounded-3xl overflow-hidden hover:shadow-3xl transition-all duration-300"
            >
              <Card className="h-full flex flex-col border-0 bg-transparent">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <div
                        className={`bg-gradient-to-r ${getItemTypeColor(
                          item.item_type
                        )} p-3 rounded-full mr-4 shadow-md`}
                      >
                        {getItemTypeIcon(item.item_type)}
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold text-gray-900 mb-1">
                          {item.itemData?.name}
                        </CardTitle>
                        <div className="flex items-center">
                          <span className="text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent capitalize">
                            {item.item_type.replace("_", " ").toLowerCase()}
                          </span>
                          <span className="mx-2 text-gray-300">•</span>
                          <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                            {item.itemData?.category || "General"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleRemoveFromWishlist(
                          item.item_id,
                          item.item_type,
                          item.itemData?.name || "Item"
                        )
                      }
                      className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="mb-4">
                    <p className="text-gray-600 line-clamp-2 leading-relaxed">
                      {item.itemData?.description ||
                        "No description available for this item."}
                    </p>
                  </div>

                  <div className="flex justify-between items-center mb-6">
                    <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      ৳{item.itemData?.price || item.itemData?.unit_price || 0}
                    </div>
                    <div className="text-xs text-gray-500">
                      Added: {new Date(item.added_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 rounded-full border-gray-300  hover:bg-gray-50 hover:border-gray-400 transition-colors"
                      onClick={() =>
                        handleRemoveFromWishlist(
                          item.item_id,
                          item.item_type,
                          item.itemData?.name || "Item"
                        )
                      }
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-full shadow-lg transition-all duration-300 hover:shadow-xl"
                      onClick={() => handleAddToCart(item)}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
