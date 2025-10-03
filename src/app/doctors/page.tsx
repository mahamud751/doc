"use client";

import NavigationHeader from "@/components/NavigationHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { AnimatePresence, motion } from "framer-motion";
import {
  Award,
  Clock,
  Filter,
  MapPin,
  Phone,
  Search,
  Star,
  Stethoscope,
  Users,
  Video,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

// Mock data transformation helper
const formatCurrency = (amount: number) => `৳${amount}`;

// Extended interface for display
interface DisplayDoctor extends Doctor {
  specialty?: string;
  isAvailable?: boolean;
  totalReviews?: number;
  experience?: number;
  location?: string;
  fee?: number;
  nextAvailable?: string;
}

interface Doctor {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar_url?: string;
  specialties: string[];
  qualifications: string[];
  experience_years: number;
  consultation_fee: number;
  rating: number;
  total_reviews: number;
  bio: string;
  is_available_online: boolean;
  languages: string[];
  clinic_locations: unknown[];
}

const specialties = [
  "All Specialties",
  "Cardiology",
  "Dermatology",
  "Pediatrics",
  "Gynecology",
  "Neurology",
  "Orthopedics",
  "Psychiatry",
  "General Medicine",
];

export default function DoctorsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("All Specialties");
  const [priceRange, setPriceRange] = useState("all");
  const [sortBy, setSortBy] = useState("rating");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Transform doctor data for display
  const transformDoctorForDisplay = (doctor: Doctor): DisplayDoctor => ({
    ...doctor,
    specialty: doctor.specialties[0] || "General",
    isAvailable: doctor.is_available_online,
    totalReviews: doctor.total_reviews,
    experience: doctor.experience_years,
    location: "Dhaka, Bangladesh",
    fee: doctor.consultation_fee,
    nextAvailable: "Today 2:00 PM",
  });

  const fetchDoctors = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      // Build query parameters
      const params = new URLSearchParams();
      if (selectedSpecialty !== "All Specialties") {
        params.append("specialty", selectedSpecialty);
      }
      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const response = await fetch(`/api/doctors?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch doctors");
      }

      const data = await response.json();
      setDoctors(data.doctors || []);
    } catch (error: unknown) {
      console.error("Error fetching doctors:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load doctors"
      );
    } finally {
      setLoading(false);
    }
  }, [selectedSpecialty, searchTerm]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  // Update fetchDoctors to be called when filters change
  useEffect(() => {
    fetchDoctors();
  }, [selectedSpecialty, searchTerm, fetchDoctors]);

  const filteredDoctors = doctors
    .filter((doctor) => {
      const matchesSearch =
        doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.specialties.some((spec) =>
          spec.toLowerCase().includes(searchTerm.toLowerCase())
        );
      const matchesSpecialty =
        selectedSpecialty === "All Specialties" ||
        doctor.specialties.includes(selectedSpecialty);
      const matchesPrice =
        priceRange === "all" ||
        (priceRange === "low" && doctor.consultation_fee <= 500) ||
        (priceRange === "medium" &&
          doctor.consultation_fee > 500 &&
          doctor.consultation_fee <= 800) ||
        (priceRange === "high" && doctor.consultation_fee > 800);

      return matchesSearch && matchesSpecialty && matchesPrice;
    })
    .map(transformDoctorForDisplay);

  const sortedDoctors = [...filteredDoctors].sort((a, b) => {
    switch (sortBy) {
      case "rating":
        return b.rating - a.rating;
      case "experience":
        return b.experience_years - a.experience_years;
      case "fee-low":
        return a.consultation_fee - b.consultation_fee;
      case "fee-high":
        return b.consultation_fee - a.consultation_fee;
      default:
        return 0;
    }
  });

  const handleBookAppointment = (doctor: Doctor) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/auth/login");
      return;
    }
    localStorage.setItem("selectedDoctor", JSON.stringify(doctor));
    router.push("/booking");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0">
          <motion.div
            animate={{
              background: [
                "radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.05) 0%, transparent 50%)",
                "radial-gradient(circle at 80% 20%, rgba(168, 85, 247, 0.05) 0%, transparent 50%)",
                "radial-gradient(circle at 40% 80%, rgba(14, 165, 233, 0.05) 0%, transparent 50%)",
                "radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.05) 0%, transparent 50%)",
              ],
            }}
            transition={{ duration: 15, repeat: Infinity }}
            className="absolute inset-0"
          />
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center relative z-10"
        >
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-3xl shadow-2xl mb-6 mx-auto w-24 h-24 flex items-center justify-center">
            <Stethoscope className="h-12 w-12 text-white" />
          </div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-32 h-32 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"
          ></motion.div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Finding Best Doctors...
          </h3>
          <p className="text-gray-600 mt-2">Loading healthcare professionals</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-white/30"
        >
          <div className="bg-red-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Error Loading Doctors
          </h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={fetchDoctors}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-full shadow-lg"
            >
              Try Again
            </Button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0">
        <motion.div
          animate={{
            background: [
              "radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.05) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 20%, rgba(168, 85, 247, 0.05) 0%, transparent 50%)",
              "radial-gradient(circle at 40% 80%, rgba(14, 165, 233, 0.05) 0%, transparent 50%)",
              "radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.05) 0%, transparent 50%)",
            ],
          }}
          transition={{ duration: 15, repeat: Infinity }}
          className="absolute inset-0"
        />
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 left-0 w-96 h-96 bg-blue-300/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-0 right-0 w-96 h-96 bg-purple-300/10 rounded-full blur-3xl"
        />
      </div>

      {/* Navigation Header */}
      <NavigationHeader currentPage="doctors" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8 relative z-10">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl font-bold text-gray-900 mb-4"
          >
            Find Your{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Perfect Doctor
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl text-gray-600 max-w-2xl mx-auto"
          >
            Search and book appointments with qualified healthcare professionals
            dedicated to your well-being
          </motion.p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/80 backdrop-blur-sm border border-white/30 rounded-3xl shadow-2xl p-8 mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search by doctor name or specialty..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-14 text-lg rounded-2xl border-2 border-gray-200 focus:border-blue-500 transition-all duration-300"
                />
              </div>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-3 text-black">
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
              >
                {specialties.map((specialty) => (
                  <option key={specialty} value={specialty}>
                    {specialty}
                  </option>
                ))}
              </select>

              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
              >
                <option value="all">All Prices</option>
                <option value="low">Below ৳500</option>
                <option value="medium">৳500 - ৳800</option>
                <option value="high">Above ৳800</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
              >
                <option value="rating">Sort by Rating</option>
                <option value="experience">Sort by Experience</option>
                <option value="fee-low">Price: Low to High</option>
                <option value="fee-high">Price: High to Low</option>
              </select>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden rounded-2xl border-2"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Results Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  {sortedDoctors.length} Qualified Doctors Found
                </h2>
                <p className="text-blue-100">
                  {selectedSpecialty !== "All Specialties" &&
                    `Specializing in ${selectedSpecialty}`}
                  {selectedSpecialty === "All Specialties" &&
                    "Across all medical specialties"}
                </p>
              </div>
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="bg-white/20 p-4 rounded-2xl"
              >
                <Users className="h-8 w-8" />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Doctors Grid */}
        <AnimatePresence>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {sortedDoctors.map((doctor, index) => (
              <motion.div
                key={doctor.id}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                onHoverStart={() => setHoveredCard(doctor.id)}
                onHoverEnd={() => setHoveredCard(null)}
                className="relative"
              >
                <Card className="bg-white/80 backdrop-blur-sm border border-white/30 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 overflow-hidden">
                  <CardContent className="p-6">
                    {/* Doctor Header with Availability Badge in Same Row */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-start">
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          className="relative"
                        >
                          <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl w-20 h-20 flex items-center justify-center shadow-2xl">
                            <Stethoscope className="h-10 w-10 text-white" />
                          </div>
                          {doctor.rating >= 4.5 && (
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-1 shadow-lg"
                            >
                              <Award className="h-4 w-4 text-white" />
                            </motion.div>
                          )}
                        </motion.div>
                        <div className="ml-4">
                          <h3 className="text-xl font-bold text-gray-900">
                            {doctor.name}
                          </h3>
                          <p className="text-blue-600 font-semibold">
                            {doctor.specialty}
                          </p>
                          <div className="flex items-center mt-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-sm text-gray-600 ml-1">
                              {doctor.rating} ({doctor.totalReviews} reviews)
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            doctor.isAvailable
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {doctor.isAvailable ? "Available" : "Offline"}
                        </motion.div>
                        <div className="mt-2 text-right">
                          <p className="text-2xl font-bold text-gray-900">
                            {formatCurrency(doctor.fee || 0)}
                          </p>
                          <p className="text-xs text-gray-500">Per session</p>
                        </div>
                      </div>
                    </div>

                    {/* Doctor Details */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{doctor.location}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{doctor.experience} years experience</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Video className="h-4 w-4 mr-2 text-gray-400" />
                        <span>
                          {doctor.isAvailable
                            ? `Next slot: ${doctor.nextAvailable}`
                            : "Not available for online consultations"}
                        </span>
                      </div>
                    </div>

                    {/* Doctor Bio */}
                    <p className="text-gray-700 text-sm mb-6 line-clamp-3">
                      {doctor.bio}
                    </p>

                    {/* Qualifications */}
                    <div className="mb-6">
                      <p className="text-xs font-semibold text-gray-500 mb-2">
                        QUALIFICATIONS
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {doctor.qualifications.slice(0, 3).map((qual, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium"
                          >
                            {qual}
                          </span>
                        ))}
                        {doctor.qualifications.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
                            +{doctor.qualifications.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex-1"
                      >
                        <Button
                          onClick={() => handleBookAppointment(doctor)}
                          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-2xl shadow-lg"
                        >
                          <Video className="h-4 w-4 mr-2" />
                          Book Appointment
                        </Button>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant="outline"
                          className="rounded-2xl border-2"
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    </div>
                  </CardContent>

                  {/* Hover Effect Overlay */}
                  <AnimatePresence>
                    {hoveredCard === doctor.id && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-3xl pointer-events-none"
                      />
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>

        {sortedDoctors.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
              <Users className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No Doctors Found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search or filter criteria
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
