"use client";

import { Button } from "@/components/ui/Button";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Award,
  Calendar,
  CheckCircle,
  Clock,
  MapPin,
  MessageCircle,
  Shield,
  Star,
  TrendingUp,
  User,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface Doctor {
  id: string;
  name: string;
  specialties: string[];
  qualifications: string[];
  experience_years: number;
  consultation_fee: number;
  rating: number;
  total_reviews: number;
  bio: string;
  avatar_url?: string;
  is_available_online: boolean;
  next_available_slots: string[];
  avatar: string;
  hospital: string;
  languages: string[];
  doctor_profile?: {
    specialties?: string[];
    qualifications?: string[];
    experience_years?: number;
    consultation_fee?: number;
    rating?: number;
    total_reviews?: number;
    bio?: string;
    is_available_online?: boolean;
    hospital?: string;
    languages?: string[];
  };
}

interface TimeSlot {
  time: string;
  available: boolean;
}

export default function BookDoctorPage() {
  const router = useRouter();
  const params = useParams();
  const doctorId = params.doctorId as string;

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingDoctor, setFetchingDoctor] = useState(true);
  const [error, setError] = useState("");

  // Remove mock doctor data - will fetch from API

  // Generate time slots for the selected date
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    for (let hour = 9; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;
        slots.push({
          time,
          available: true, // Will be updated with real availability
        });
      }
    }
    return slots;
  };

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(generateTimeSlots());

  useEffect(() => {
    if (selectedDate) {
      setTimeSlots(generateTimeSlots());
      setSelectedTime("");
    }
  }, [selectedDate]);

  const fetchDoctor = useCallback(async () => {
    try {
      setFetchingDoctor(true);
      const token = localStorage.getItem("authToken");

      const response = await fetch(`/api/doctors/${doctorId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch doctor");
      }

      const data = await response.json();
      setDoctor(data.doctor || null);
    } catch (error: unknown) {
      console.error("Error fetching doctor:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load doctor"
      );
    } finally {
      setFetchingDoctor(false);
    }
  }, [doctorId]);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem("authToken");
    const role = localStorage.getItem("userRole");

    if (!token) {
      router.push("/auth/login");
      return;
    }

    if (role !== "PATIENT") {
      router.push("/landing");
      return;
    }

    // Fetch real doctor data from API
    fetchDoctor();
  }, [doctorId, fetchDoctor, router]); // Added missing dependencies

  const handleBookAppointment = async () => {
    if (!doctor || !selectedDate || !selectedTime) {
      setError("Please select a date and time");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("authToken");

      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          doctorId: doctor.id,
          patientId: localStorage.getItem("userId"),
          appointmentDate: selectedDate,
          appointmentTime: selectedTime,
          reason: symptoms,
          notes: notes,
          type: "VIDEO",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to book appointment");
      }

      const data = await response.json();

      // Redirect to success page with appointment ID
      router.push(
        `/patient/appointments?booking=success&appointmentId=${data.appointment.id}`
      );
    } catch (error: unknown) {
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  // Generate next 7 days for date selection
  const generateAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        value: date.toISOString().split("T")[0],
        label: date.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
        isToday: i === 0,
        isTomorrow: i === 1,
      });
    }
    return dates;
  };

  const availableDates = generateAvailableDates();

  const doctorStats = [
    {
      label: "Experience",
      value: `${doctor?.experience_years}+ years`,
      icon: TrendingUp,
    },
    { label: "Success Rate", value: "98%", icon: Award },
    { label: "Patients", value: "2.5k+", icon: User },
    {
      label: "Languages",
      value: doctor?.languages.length || 0,
      icon: MessageCircle,
    },
  ];

  if (fetchingDoctor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-300/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-300/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        <div className="relative z-10 text-center">
          <motion.div
            animate={{
              rotate: 360,
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="relative mx-auto mb-6"
          >
            <div className="h-24 w-24 border-4 border-blue-500/30 border-t-blue-600 rounded-full" />
            <div className="absolute inset-0 h-24 w-24 border-4 border-transparent border-t-purple-500 rounded-full animate-spin" />
            <User className="absolute inset-0 m-auto w-10 h-10 text-blue-600" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
          >
            Loading Doctor Profile...
          </motion.h2>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Doctor Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The doctor you&apos;re looking for doesn&apos;t exist or is no
            longer available.
          </p>
          <Link href="/doctors">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              Find Other Doctors
            </Button>
          </Link>
        </div>
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

      <div className="relative z-10 p-6 pt-24">
        <div className="max-w-7xl mx-auto">
          {/* Enhanced Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-8 mb-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link href="/doctors">
                    <Button
                      variant="outline"
                      className="rounded-full border-2 px-6"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Doctors
                    </Button>
                  </Link>
                </motion.div>
                <div>
                  <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2"
                  >
                    Book with Dr. {doctor.name}
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-gray-600 text-lg"
                  >
                    Schedule your secure video consultation with an expert
                    specialist
                  </motion.p>
                </div>
              </div>
            </div>
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-600 px-6 py-4 rounded-2xl mb-6 shadow-lg"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Doctor Information & Booking */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-2 space-y-8"
            >
              {/* Enhanced Doctor Profile */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/30 p-8"
              >
                <div className="flex items-start space-x-8">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="text-6xl"
                  >
                    {doctor.avatar}
                  </motion.div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-3">
                          Dr. {doctor.name}
                        </h2>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {doctor.specialties.map((specialty, index) => (
                            <motion.span
                              key={index}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.1 }}
                              whileHover={{ scale: 1.05 }}
                              className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold border border-blue-200"
                            >
                              {specialty}
                            </motion.span>
                          ))}
                        </div>
                      </div>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-right"
                      >
                        <div className="flex items-center space-x-2 mb-2 justify-end">
                          <Star className="w-5 h-5 text-yellow-400 fill-current" />
                          <span className="font-bold text-gray-900 text-xl">
                            {doctor.rating}
                          </span>
                          <span className="text-gray-600">
                            ({doctor.total_reviews} reviews)
                          </span>
                        </div>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent"
                        >
                          ${doctor.consultation_fee}
                        </motion.div>
                      </motion.div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      {doctorStats.map((stat, index) => (
                        <motion.div
                          key={stat.label}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 + index * 0.1 }}
                          whileHover={{ y: -5, scale: 1.02 }}
                          className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-4 text-center border border-gray-200"
                        >
                          <stat.icon className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-gray-900">
                            {stat.value}
                          </div>
                          <div className="text-sm text-gray-600">
                            {stat.label}
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">
                          About Dr. {doctor.name}
                        </h4>
                        <p className="text-gray-700 leading-relaxed">
                          {doctor.bio}
                        </p>
                      </div>

                      <div className="flex items-center space-x-6 text-sm text-gray-600">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                          <span>{doctor.hospital}</span>
                        </div>
                        <div className="flex items-center">
                          <Video className="w-4 h-4 mr-2 text-green-500" />
                          <span>Video Consultation Available</span>
                        </div>
                        <div className="flex items-center">
                          <Shield className="w-4 h-4 mr-2 text-purple-500" />
                          <span>Verified Doctor</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium text-gray-700">
                          Languages:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {doctor.languages.map((language, index) => (
                            <span
                              key={index}
                              className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                            >
                              {language}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Date Selection */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/30 p-8"
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  Select Date
                </h3>
                <div className="grid grid-cols-7 gap-3">
                  {availableDates.map((date, index) => (
                    <motion.button
                      key={date.value}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedDate(date.value)}
                      className={`p-4 text-center text-black rounded-2xl border-2 transition-all duration-200 ${
                        selectedDate === date.value
                          ? "border-blue-500 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 shadow-lg"
                          : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-md"
                      } ${
                        date.isToday
                          ? "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-300"
                          : ""
                      } ${
                        date.isTomorrow
                          ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-300"
                          : ""
                      }`}
                    >
                      <div className="text-lg font-semibold">
                        {date.label.split(" ")[0]}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {date.label.split(" ").slice(1).join(" ")}
                      </div>
                      {date.isToday && (
                        <div className="text-xs text-yellow-600 font-medium mt-2">
                          Today
                        </div>
                      )}
                      {date.isTomorrow && (
                        <div className="text-xs text-green-600 font-medium mt-2">
                          Tomorrow
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Time Selection */}
              <AnimatePresence>
                {selectedDate && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/30 p-8"
                  >
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">
                      Select Time
                    </h3>
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                      {timeSlots.map((slot, index) => (
                        <motion.button
                          key={slot.time}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.02 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() =>
                            slot.available && setSelectedTime(slot.time)
                          }
                          disabled={!slot.available}
                          className={`p-3 text-sm font-medium text-center rounded-xl border-2 transition-all duration-200 ${
                            selectedTime === slot.time
                              ? "border-blue-500 bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                              : slot.available
                              ? "border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:shadow-md"
                              : "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          {slot.time}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Symptoms & Notes */}
              <AnimatePresence>
                {selectedDate && selectedTime && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/30 p-8"
                  >
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">
                      Additional Information
                    </h3>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-lg font-semibold text-gray-700 mb-3">
                          Symptoms (Optional)
                        </label>
                        <motion.textarea
                          whileFocus={{ scale: 1.01 }}
                          value={symptoms}
                          onChange={(e) => setSymptoms(e.target.value)}
                          className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm resize-none"
                          rows={4}
                          placeholder="Describe your symptoms, duration, severity, and any triggers..."
                        />
                      </div>
                      <div>
                        <label className="block text-lg font-semibold text-gray-700 mb-3">
                          Additional Notes (Optional)
                        </label>
                        <motion.textarea
                          whileFocus={{ scale: 1.01 }}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm resize-none"
                          rows={3}
                          placeholder="Any previous treatments, medications, allergies, or other concerns..."
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Enhanced Booking Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-1"
            >
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/30 p-8 sticky top-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  Appointment Summary
                </h3>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl">
                    <span className="text-gray-700 font-medium">Doctor:</span>
                    <span className="font-semibold text-gray-900">
                      Dr. {doctor.name}
                    </span>
                  </div>

                  {selectedDate && (
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl">
                      <span className="text-gray-700 font-medium">Date:</span>
                      <span className="font-semibold text-gray-900">
                        {new Date(selectedDate).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  )}

                  {selectedTime && (
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-2xl">
                      <span className="text-gray-700 font-medium">Time:</span>
                      <span className="font-semibold text-gray-900">
                        {selectedTime}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl">
                    <span className="text-gray-700 font-medium">Type:</span>
                    <span className="font-semibold text-gray-900 flex items-center">
                      <Video className="w-4 h-4 mr-2 text-blue-500" />
                      Video Consultation
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl">
                    <span className="text-gray-700 font-medium">
                      Consultation Fee:
                    </span>
                    <span className="font-bold text-green-600 text-xl">
                      ${doctor.consultation_fee}
                    </span>
                  </div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex justify-between items-center pt-4 border-t-2 border-gray-200"
                  >
                    <span className="text-xl font-bold text-gray-900">
                      Total:
                    </span>
                    <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      ${doctor.consultation_fee}
                    </span>
                  </motion.div>
                </div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="mb-6"
                >
                  <Button
                    onClick={handleBookAppointment}
                    disabled={loading || !selectedDate || !selectedTime}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-2xl py-4 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
                  >
                    {loading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                      />
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Confirm Booking
                      </>
                    )}
                  </Button>
                </motion.div>

                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start space-x-2">
                    <Video className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p>Secure video consultation via encrypted connection</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Calendar className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <p>Appointment confirmation sent via email & SMS</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Clock className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                    <p>Cancel or reschedule up to 2 hours before appointment</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Shield className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <p>Your medical information is completely confidential</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
