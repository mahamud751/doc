"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import {
  Calendar,
  Clock,
  Video,
  DollarSign,
  Star,
  MapPin,
  User,
  Phone,
  Sparkles,
  Heart,
  Brain,
  Bone,
  Baby,
  Eye,
  Stethoscope,
  Shield,
  CheckCircle,
  ArrowRight,
  Zap,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import NavigationHeader from "@/components/NavigationHeader";
import CartIcon from "@/components/CartIcon";

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
  next_available_slots: Array<{
    id: string;
    start_time: string;
    end_time: string;
    is_available: boolean;
    is_booked?: boolean;
  }>;
  avatar: string;
  doctor_profile?: {
    specialties?: string[];
    qualifications?: string[];
    experience_years?: number;
    consultation_fee?: number;
    rating?: number;
    total_reviews?: number;
    bio?: string;
    is_available_online?: boolean;
  };
}

interface TimeSlot {
  id?: string;
  start_time?: string;
  end_time?: string;
  is_available?: boolean;
  time: string;
  available: boolean;
}

export default function BookAppointmentPage() {
  const router = useRouter();
  const { cartItems } = useCart();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [authToken, setAuthToken] = useState("");
  const [userRole, setUserRole] = useState("");
  const [error, setError] = useState("");
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  const specialties = [
    { name: "Cardiology", icon: Heart, color: "from-red-500 to-pink-500" },
    { name: "Neurology", icon: Brain, color: "from-purple-500 to-violet-500" },
    { name: "Orthopedics", icon: Bone, color: "from-blue-500 to-cyan-500" },
    { name: "Pediatrics", icon: Baby, color: "from-green-500 to-emerald-500" },
    { name: "Dermatology", icon: Eye, color: "from-orange-500 to-amber-500" },
    { name: "Dental", icon: Stethoscope, color: "from-teal-500 to-cyan-500" },
    { name: "Pulmonology", icon: Shield, color: "from-indigo-500 to-blue-500" },
  ];

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

  // Generate doctor-specific time slots based on availability
  const generateDoctorTimeSlots = (date: string): TimeSlot[] => {
    if (!selectedDoctor || !selectedDoctor.next_available_slots) {
      return generateTimeSlots();
    }

    // Filter slots for the selected date
    const dateSlots = selectedDoctor.next_available_slots.filter((slot) => {
      const slotDate = new Date(slot.start_time).toISOString().split("T")[0];
      return slotDate === date;
    });

    // If no slots for this date, return empty array
    if (dateSlots.length === 0) {
      return [];
    }

    // Convert doctor slots to TimeSlot format
    return dateSlots.map((slot) => ({
      id: slot.id,
      start_time: slot.start_time,
      end_time: slot.end_time,
      is_available: slot.is_available,
      time: new Date(slot.start_time).toTimeString().substring(0, 5),
      available: slot.is_available && !slot.is_booked,
    }));
  };

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(generateTimeSlots());

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

    setAuthToken(token);
    setUserRole(role);

    // Fetch real doctors data from API
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");

      const response = await fetch("/api/doctors", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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

  useEffect(() => {
    if (selectedDate) {
      // Use doctor-specific slots if a doctor is selected, otherwise use default slots
      const slots = selectedDoctor
        ? generateDoctorTimeSlots(selectedDate)
        : generateTimeSlots();
      setTimeSlots(slots);
      setSelectedTime("");
      setCurrentStep(2);
    }
  }, [selectedDate, selectedDoctor]);

  useEffect(() => {
    if (selectedDoctor) {
      setCurrentStep(1);
    }
  }, [selectedDoctor]);

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime) {
      setError("Please select a doctor, date, and time");
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
          doctorId: selectedDoctor.id,
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
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && doctors.length === 0) {
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
            <Stethoscope className="absolute inset-0 m-auto w-10 h-10 text-blue-600" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
          >
            Finding Best Doctors...
          </motion.h2>
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
            <div className="text-center mb-6">
              <motion.h1
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4"
              >
                Book Your Appointment
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-gray-600 text-lg max-w-2xl mx-auto"
              >
                Connect with expert doctors through secure video consultations.
                Your health journey starts here.
              </motion.p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center mb-2">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: step * 0.1 }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      step <= currentStep
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {step}
                  </motion.div>
                  {step < 3 && (
                    <div
                      className={`w-20 h-1 mx-2 ${
                        step < currentStep
                          ? "bg-gradient-to-r from-blue-500 to-purple-500"
                          : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-center text-sm text-gray-600">
              <span className="w-32 text-center">Choose Doctor</span>
              <span className="w-32 text-center">Select Time</span>
              <span className="w-32 text-center">Confirm</span>
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
            {/* Doctor Selection */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-2 space-y-6"
            >
              {/* Specialties Quick Filter */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/30 p-6"
              >
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Specialties
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {specialties.map((specialty, index) => (
                    <motion.div
                      key={specialty.name}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      whileHover={{ y: -5, scale: 1.05 }}
                      className="flex items-center p-3 bg-white rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all duration-300"
                    >
                      <div
                        className={`bg-gradient-to-r ${specialty.color} p-2 rounded-xl mr-3`}
                      >
                        <specialty.icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {specialty.name}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Doctors List */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/30 p-6"
              >
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Available Doctors
                </h2>
                <div className="space-y-6">
                  {doctors.map((doctor, index) => (
                    <motion.div
                      key={doctor.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      whileHover={{ y: -5, scale: 1.01 }}
                      onHoverStart={() => setHoveredCard(doctor.id)}
                      onHoverEnd={() => setHoveredCard(null)}
                      className={`border-2 rounded-3xl p-6 cursor-pointer transition-all duration-300 relative overflow-hidden ${
                        selectedDoctor?.id === doctor.id
                          ? "border-blue-500 bg-gradient-to-r from-blue-50 to-cyan-50 shadow-lg"
                          : "border-white bg-white hover:border-blue-300 hover:shadow-lg"
                      }`}
                      onClick={async () => {
                        setSelectedDoctor(doctor);
                        // Reset date and time when selecting a new doctor
                        setSelectedDate("");
                        setSelectedTime("");
                        setTimeSlots([]);
                      }}
                    >
                      {/* Animated background effect */}
                      <motion.div
                        animate={{
                          opacity:
                            hoveredCard === doctor.id ? [0.1, 0.2, 0.1] : 0.1,
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-purple-500/10"
                      />

                      <div className="flex items-start space-x-6 relative z-10">
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          className="text-5xl"
                        >
                          {doctor.avatar}
                        </motion.div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-2xl font-bold text-gray-900">
                                {doctor.name}
                              </h3>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {doctor.specialties.map((specialty, index) => (
                                  <motion.span
                                    key={index}
                                    whileHover={{ scale: 1.05 }}
                                    className="inline-flex px-3 py-1 text-sm font-semibold bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 rounded-full border border-blue-200"
                                  >
                                    {specialty}
                                  </motion.span>
                                ))}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center space-x-2 mb-2">
                                <Star className="w-5 h-5 text-yellow-400 fill-current" />
                                <span className="font-bold text-gray-900">
                                  {doctor.rating}
                                </span>
                                <span className="text-gray-600">
                                  ({doctor.total_reviews})
                                </span>
                              </div>
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent"
                              >
                                ${doctor.consultation_fee}
                              </motion.div>
                            </div>
                          </div>

                          <p className="text-gray-600 mb-4 leading-relaxed">
                            {doctor.bio}
                          </p>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-6 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Zap className="w-4 h-4 mr-2 text-green-500" />
                                <span>
                                  {doctor.experience_years} years experience
                                </span>
                              </div>
                              <div className="flex items-center">
                                <Video className="w-4 h-4 mr-2 text-blue-500" />
                                <span>Video Consultation</span>
                              </div>
                              <div className="flex items-center">
                                <Shield className="w-4 h-4 mr-2 text-purple-500" />
                                <span>Verified</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>

            {/* Booking Details */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-6"
            >
              {/* Date Selection */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/30 p-6"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Select Date
                </h3>
                <motion.input
                  whileFocus={{ scale: 1.02 }}
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full p-4 border-2 border-gray-200 rounded-2xl text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                />
              </motion.div>

              {/* Time Selection */}
              <AnimatePresence>
                {selectedDate && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/30 p-6"
                  >
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      Select Time
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {timeSlots.map((slot, index) => (
                        <motion.button
                          key={slot.time}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          disabled={!slot.available}
                          onClick={() => setSelectedTime(slot.time)}
                          className={`p-3 text-sm font-medium rounded-2xl border-2 transition-all duration-200 ${
                            selectedTime === slot.time
                              ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white border-transparent shadow-lg"
                              : slot.available
                              ? "bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:shadow-md"
                              : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
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
                {selectedTime && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/30 p-6"
                  >
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      Additional Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Symptoms (Optional)
                        </label>
                        <motion.textarea
                          whileFocus={{ scale: 1.02 }}
                          value={symptoms}
                          onChange={(e) => setSymptoms(e.target.value)}
                          rows={3}
                          className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-2 text-black focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm resize-none"
                          placeholder="Describe your symptoms, duration, and any concerns..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Additional Notes (Optional)
                        </label>
                        <motion.textarea
                          whileFocus={{ scale: 1.02 }}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={2}
                          className="w-full p-4 border-2 border-gray-200 rounded-2xl text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm resize-none"
                          placeholder="Any additional information for the doctor..."
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Booking Summary */}
              <AnimatePresence>
                {selectedDoctor && selectedDate && selectedTime && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/30 p-6"
                  >
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      Booking Summary
                    </h3>
                    <div className="space-y-4 text-sm">
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-2xl">
                        <span className="text-gray-600 font-medium">
                          Doctor:
                        </span>
                        <span className="font-semibold text-gray-900">
                          {selectedDoctor.name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-2xl">
                        <span className="text-gray-600 font-medium">Date:</span>
                        <span className="font-semibold text-gray-900">
                          {new Date(selectedDate).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-purple-50 rounded-2xl">
                        <span className="text-gray-600 font-medium">Time:</span>
                        <span className="font-semibold text-gray-900">
                          {selectedTime}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-amber-50 rounded-2xl">
                        <span className="text-gray-600 font-medium">
                          Consultation Fee:
                        </span>
                        <span className="font-bold text-green-600 text-lg">
                          ${selectedDoctor.consultation_fee}
                        </span>
                      </div>

                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="flex justify-between items-center pt-4 border-t border-gray-200"
                      >
                        <span className="text-lg font-bold text-gray-900">
                          Total:
                        </span>
                        <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                          ${selectedDoctor.consultation_fee}
                        </span>
                      </motion.div>
                    </div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="mt-6"
                    >
                      <Button
                        onClick={handleBookAppointment}
                        disabled={loading}
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
                            Confirm Appointment
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
