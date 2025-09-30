"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import {
  Search,
  Filter,
  MapPin,
  Star,
  Video,
  Calendar,
  Users,
  Stethoscope,
  ArrowLeft,
  User,
  Phone,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

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
  clinic_locations: any[];
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

  // Transform doctor data for display
  const transformDoctorForDisplay = (doctor: Doctor): DisplayDoctor => ({
    ...doctor,
    specialty: doctor.specialties[0] || "General",
    isAvailable: doctor.is_available_online,
    totalReviews: doctor.total_reviews,
    experience: doctor.experience_years,
    location: "Dhaka, Bangladesh", // Default location
    fee: doctor.consultation_fee,
    nextAvailable: "Today 2:00 PM", // Mock next available
  });

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/doctors");

      if (!response.ok) {
        throw new Error("Failed to fetch doctors");
      }

      const data = await response.json();
      setDoctors(data.doctors || []);
    } catch (error: any) {
      console.error("Error fetching doctors:", error);
      setError(error.message || "Failed to load doctors");
    } finally {
      setLoading(false);
    }
  };

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
        (priceRange === "low" && doctor.consultation_fee <= 50) ||
        (priceRange === "medium" &&
          doctor.consultation_fee > 50 &&
          doctor.consultation_fee <= 100) ||
        (priceRange === "high" && doctor.consultation_fee > 100);

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

    // Store selected doctor for booking
    localStorage.setItem("selectedDoctor", JSON.stringify(doctor));
    router.push("/booking");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading doctors...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Error Loading Doctors
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchDoctors}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/landing">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="ml-4 flex items-center">
                <Stethoscope className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-2xl font-bold text-gray-900">
                  MediConnect
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="outline">Login</Button>
              </Link>
              <Link href="/auth/register">
                <Button>Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Find Your Doctor
          </h1>
          <p className="text-gray-600">
            Search and book appointments with qualified healthcare professionals
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search by doctor name or specialty..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2">
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Prices</option>
                <option value="low">Below ৳500</option>
                <option value="medium">৳500 - ৳800</option>
                <option value="high">Above ৳800</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="rating">Sort by Rating</option>
                <option value="experience">Sort by Experience</option>
                <option value="fee-low">Price: Low to High</option>
                <option value="fee-high">Price: High to Low</option>
              </select>

              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-gray-600">
            Found {sortedDoctors.length} doctors
            {selectedSpecialty !== "All Specialties" &&
              ` in ${selectedSpecialty}`}
          </p>
        </div>

        {/* Doctors Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedDoctors.map((doctor) => (
            <Card key={doctor.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                {/* Doctor Header */}
                <div className="flex items-start mb-4">
                  <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mr-4">
                    <Stethoscope className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {doctor.name}
                    </h3>
                    <p className="text-blue-600 font-medium mb-1">
                      {doctor.specialty}
                    </p>
                    <p className="text-sm text-gray-600">
                      {doctor.qualifications.join(", ")}
                    </p>
                  </div>
                  {doctor.isAvailable && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      Available
                    </span>
                  )}
                </div>

                {/* Rating and Experience */}
                <div className="flex items-center mb-4">
                  <div className="flex items-center mr-4">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="ml-1 text-sm font-medium">
                      {doctor.rating}
                    </span>
                    <span className="ml-1 text-sm text-gray-500">
                      ({doctor.totalReviews})
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {doctor.experience} years exp.
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center mb-4">
                  <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">
                    {doctor.location}
                  </span>
                </div>

                {/* Languages */}
                <div className="mb-4">
                  <span className="text-sm text-gray-500">Languages: </span>
                  <span className="text-sm text-gray-700">
                    {doctor.languages.join(", ")}
                  </span>
                </div>

                {/* Fee and Availability */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-2xl font-bold text-gray-900">
                      {formatCurrency(doctor.fee || 0)}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">
                      per consultation
                    </span>
                  </div>
                </div>

                {/* Next Available */}
                <div className="flex items-center mb-4">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">
                    Next: {doctor.nextAvailable}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <Link href={`/doctors/${doctor.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      View Profile
                    </Button>
                  </Link>
                  <Link href={`/booking/${doctor.id}`} className="flex-1">
                    <Button className="w-full" disabled={!doctor.isAvailable}>
                      <Video className="h-4 w-4 mr-2" />
                      Book Now
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No Results */}
        {sortedDoctors.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
              <Users className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No doctors found
            </h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria or browse all available
              doctors.
            </p>
            <Button
              onClick={() => {
                setSearchTerm("");
                setSelectedSpecialty("All Specialties");
                setPriceRange("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
