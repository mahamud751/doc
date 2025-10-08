"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Heart,
  Pill,
  TestTube,
  Package,
  User,
  Calendar,
  Search,
  Filter,
} from "lucide-react";

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
  } | null;
}

interface PatientWishlist {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_email: string;
  created_at: string;
  updated_at: string;
  items: WishlistItem[];
}

export default function WishlistManagement() {
  const [wishlists, setWishlists] = useState<PatientWishlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  // In a real implementation, this would fetch from an admin API endpoint
  // For now, we'll simulate the data
  useEffect(() => {
    const fetchWishlists = async () => {
      try {
        setLoading(true);
        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Mock data
        const mockWishlists: PatientWishlist[] = [
          {
            id: "1",
            patient_id: "patient_1",
            patient_name: "John Doe",
            patient_email: "john@example.com",
            created_at: "2023-01-15T10:30:00Z",
            updated_at: "2023-01-20T14:45:00Z",
            items: [
              {
                id: "item_1",
                item_type: "MEDICINE",
                item_id: "med_1",
                added_at: "2023-01-15T10:30:00Z",
                itemData: {
                  id: "med_1",
                  name: "Paracetamol",
                  unit_price: 5.99,
                  category: "Pain Relief",
                  description: "Used to treat aches and pains",
                },
              },
              {
                id: "item_2",
                item_type: "LAB_TEST",
                item_id: "test_1",
                added_at: "2023-01-18T09:15:00Z",
                itemData: {
                  id: "test_1",
                  name: "Complete Blood Count",
                  price: 25.0,
                  category: "Blood Test",
                  description: "Measures various components of blood",
                },
              },
            ],
          },
          {
            id: "2",
            patient_id: "patient_2",
            patient_name: "Jane Smith",
            patient_email: "jane@example.com",
            created_at: "2023-01-10T08:20:00Z",
            updated_at: "2023-01-22T16:30:00Z",
            items: [
              {
                id: "item_3",
                item_type: "LAB_PACKAGE",
                item_id: "package_1",
                added_at: "2023-01-10T08:20:00Z",
                itemData: {
                  id: "package_1",
                  name: "Basic Health Checkup",
                  price: 89.99,
                  category: "General Health",
                  description: "Comprehensive health assessment package",
                },
              },
            ],
          },
        ];

        setWishlists(mockWishlists);
      } catch (err) {
        setError("Failed to fetch wishlists");
        console.error("Error fetching wishlists:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlists();
  }, []);

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
        return <Pill className="h-4 w-4 text-white" />;
      case "LAB_TEST":
        return <TestTube className="h-4 w-4 text-white" />;
      case "LAB_PACKAGE":
        return <Package className="h-4 w-4 text-white" />;
      default:
        return <Heart className="h-4 w-4 text-white" />;
    }
  };

  const filteredWishlists = wishlists.filter((wishlist) => {
    // Search filter
    const matchesSearch =
      wishlist.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wishlist.patient_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wishlist.items.some((item) =>
        item.itemData?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

    // Type filter
    const matchesType =
      filterType === "all" ||
      wishlist.items.some((item) => item.item_type === filterType);

    return matchesSearch && matchesType;
  });

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
          <div className="text-center text-red-500">
            <div className="text-2xl mb-2">⚠️</div>
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Wishlist Management
        </h2>
        <div className="text-gray-600">
          <span className="font-semibold">{wishlists.length}</span> patient
          wishlists
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search patients or items..."
            className="w-full pl-10 pr-4 py-2 bg-white/80 backdrop-blur-sm border border-white/30 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <select
            className="pl-10 pr-8 py-2 bg-white/80 backdrop-blur-sm border border-white/30 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="MEDICINE">Medicines</option>
            <option value="LAB_TEST">Lab Tests</option>
            <option value="LAB_PACKAGE">Lab Packages</option>
          </select>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center">
              <User className="h-8 w-8 mr-3" />
              <div>
                <p className="text-sm opacity-80">Total Patients</p>
                <p className="text-2xl font-bold">{wishlists.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Pill className="h-8 w-8 mr-3" />
              <div>
                <p className="text-sm opacity-80">Medicines</p>
                <p className="text-2xl font-bold">
                  {wishlists.reduce(
                    (count, wishlist) =>
                      count +
                      wishlist.items.filter(
                        (item) => item.item_type === "MEDICINE"
                      ).length,
                    0
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-2xl shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center">
              <TestTube className="h-8 w-8 mr-3" />
              <div>
                <p className="text-sm opacity-80">Lab Tests</p>
                <p className="text-2xl font-bold">
                  {wishlists.reduce(
                    (count, wishlist) =>
                      count +
                      wishlist.items.filter(
                        (item) => item.item_type === "LAB_TEST"
                      ).length,
                    0
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-purple-500 to-violet-500 text-white rounded-2xl shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Package className="h-8 w-8 mr-3" />
              <div>
                <p className="text-sm opacity-80">Packages</p>
                <p className="text-2xl font-bold">
                  {wishlists.reduce(
                    (count, wishlist) =>
                      count +
                      wishlist.items.filter(
                        (item) => item.item_type === "LAB_PACKAGE"
                      ).length,
                    0
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Wishlist List */}
      {filteredWishlists.length === 0 ? (
        <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-2xl rounded-3xl">
          <CardContent className="p-12 text-center">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              No wishlists found
            </h3>
            <p className="text-gray-600">
              {searchTerm || filterType !== "all"
                ? "No wishlists match your search criteria"
                : "No patients have created wishlists yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredWishlists.map((wishlist) => (
            <motion.div
              key={wishlist.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-sm border-white/30 shadow-2xl rounded-3xl overflow-hidden"
            >
              <Card className="border-0 bg-transparent">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-full mr-4">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold text-gray-900">
                          {wishlist.patient_name}
                        </CardTitle>
                        <p className="text-gray-600">
                          {wishlist.patient_email}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {wishlist.items.length} items
                      </p>
                      <p className="text-xs text-gray-400">
                        Updated:{" "}
                        {new Date(wishlist.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {wishlist.items
                      .filter(
                        (item) =>
                          filterType === "all" || item.item_type === filterType
                      )
                      .map((item) => (
                        <div
                          key={item.id}
                          className="bg-white/50 rounded-2xl p-4 border border-gray-100 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start">
                            <div
                              className={`bg-gradient-to-r ${getItemTypeColor(
                                item.item_type
                              )} p-2 rounded-full mr-3`}
                            >
                              {getItemTypeIcon(item.item_type)}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">
                                {item.itemData?.name}
                              </h4>
                              <p className="text-sm text-gray-600 capitalize">
                                {item.item_type.replace("_", " ").toLowerCase()}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                  ৳
                                  {item.itemData?.price ||
                                    item.itemData?.unit_price ||
                                    0}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(item.added_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
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
