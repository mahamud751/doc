"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Heart,
  Brain,
  Bone,
  Baby,
  Eye,
  Stethoscope,
  Users,
  Star,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface Specialty {
  id: string;
  name: string;
  description?: string;
  icon_url?: string;
  is_active: boolean;
  count?: number;
  icon?: string;
  color?: string;
}

// Icon mapping for specialties
const specialtyIcons: { [key: string]: any } = {
  Cardiology: Heart,
  Neurology: Brain,
  Orthopedics: Bone,
  Pediatrics: Baby,
  Dermatology: Eye,
  "General Medicine": Stethoscope,
  Psychiatry: Brain,
  Gynecology: Users,
  Dental: Stethoscope,
  "Emergency Medicine": Stethoscope,
};

// Color mapping for specialties
const specialtyColors: { [key: string]: string } = {
  Cardiology: "from-red-500 to-pink-500",
  Neurology: "from-purple-500 to-violet-500",
  Orthopedics: "from-blue-500 to-cyan-500",
  Pediatrics: "from-green-500 to-emerald-500",
  Dermatology: "from-orange-500 to-amber-500",
  "General Medicine": "from-gray-500 to-slate-500",
  Psychiatry: "from-indigo-500 to-purple-500",
  Gynecology: "from-pink-500 to-rose-500",
  Dental: "from-teal-500 to-cyan-500",
  "Emergency Medicine": "from-red-600 to-orange-600",
};

export default function DynamicSpecialties() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSpecialties();
  }, []);

  const fetchSpecialties = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/specialties?include_counts=true");
      if (!response.ok) {
        throw new Error("Failed to fetch specialties");
      }

      const data = await response.json();
      if (data.success) {
        setSpecialties(data.specialties || []);
      } else {
        throw new Error(data.error || "Failed to load specialties");
      }
    } catch (error: any) {
      console.error("Error fetching specialties:", error);
      setError(error.message || "Failed to load specialties");

      // Fallback to default specialties
      setSpecialties([
        { id: "1", name: "Cardiology", is_active: true, count: 12 },
        { id: "2", name: "Neurology", is_active: true, count: 8 },
        { id: "3", name: "Orthopedics", is_active: true, count: 15 },
        { id: "4", name: "Pediatrics", is_active: true, count: 10 },
        { id: "5", name: "Dermatology", is_active: true, count: 7 },
        { id: "6", name: "General Medicine", is_active: true, count: 20 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading medical specialties...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && specialties.length === 0) {
    return (
      <div className="py-16 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchSpecialties} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <motion.div
          animate={{
            background: [
              "radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.05) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.05) 0%, transparent 50%)",
              "radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.05) 0%, transparent 50%)",
            ],
          }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute inset-0"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6"
          >
            Medical Specialties
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600 max-w-3xl mx-auto"
          >
            Connect with expert doctors across various medical specialties. Find
            the right specialist for your healthcare needs.
          </motion.p>
        </motion.div>

        {/* Specialties Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 mb-12">
          {specialties.slice(0, 12).map((specialty, index) => {
            const IconComponent = specialtyIcons[specialty.name] || Stethoscope;
            const colorClass =
              specialtyColors[specialty.name] || "from-blue-500 to-cyan-500";

            return (
              <motion.div
                key={specialty.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.05 }}
                className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-300 cursor-pointer group"
              >
                <Link
                  href={`/doctors?specialty=${encodeURIComponent(
                    specialty.name
                  )}`}
                >
                  <div className="text-center">
                    <motion.div
                      whileHover={{ scale: 1.2, rotate: 10 }}
                      className={`bg-gradient-to-r ${colorClass} p-4 rounded-2xl mx-auto mb-4 w-16 h-16 flex items-center justify-center`}
                    >
                      <IconComponent className="w-8 h-8 text-white" />
                    </motion.div>

                    <h3 className="font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {specialty.name}
                    </h3>

                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{specialty.count || 0} doctors</span>
                    </div>

                    {specialty.count && specialty.count > 10 && (
                      <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="mt-2"
                      >
                        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          <Star className="w-3 h-3 mr-1 fill-current" />
                          Popular
                        </span>
                      </motion.div>
                    )}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/30 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Can't find your specialist?
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Our platform hosts doctors from many more specialties. Browse our
              complete directory or search for specific conditions and
              treatments.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link href="/doctors">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-full px-8 py-3 font-semibold shadow-lg">
                    View All Doctors
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link href="/booking">
                  <Button
                    variant="outline"
                    className="rounded-full px-8 py-3 font-semibold border-2"
                  >
                    Book Appointment
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {[
            {
              label: "Medical Specialties",
              value: specialties.length,
              icon: Stethoscope,
            },
            {
              label: "Expert Doctors",
              value: specialties.reduce(
                (sum, spec) => sum + (spec.count || 0),
                0
              ),
              icon: Users,
            },
            {
              label: "Average Rating",
              value: "4.8",
              icon: Star,
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              className="text-center"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-2xl mx-auto mb-4 w-12 h-12 flex items-center justify-center"
              >
                <stat.icon className="w-6 h-6 text-white" />
              </motion.div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {typeof stat.value === "number"
                  ? stat.value.toLocaleString()
                  : stat.value}
              </div>
              <div className="text-gray-600">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
