"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Video,
  DollarSign,
  Star,
  MapPin,
  User,
  Phone,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

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
  next_available_slots: any[];
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
  const [authToken, setAuthToken] = useState("");
  const [userRole, setUserRole] = useState("");
  const [error, setError] = useState("");

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
          available: Math.random() > 0.3, // Random availability for demo
        });
      }
    }
    return slots;
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
    fetchDoctor(token, doctorId);
  }, [doctorId]);

  useEffect(() => {
    if (selectedDate) {
      setTimeSlots(generateTimeSlots());
      setSelectedTime("");
    }
  }, [selectedDate]);

  const fetchDoctor = async (token: string, id: string) => {
    try {
      setFetchingDoctor(true);

      const response = await fetch(`/api/doctors/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch doctor details");
      }

      const data = await response.json();
      setDoctor(data.doctor);
    } catch (error: any) {
      setError(error.message);
      console.error("Error fetching doctor:", error);
    } finally {
      setFetchingDoctor(false);
    }
  };

  const handleBookAppointment = async () => {
    if (!doctor || !selectedDate || !selectedTime) {
      setError("Please select a date and time");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          doctor_id: doctor.id,
          appointment_date: selectedDate,
          appointment_time: selectedTime,
          consultation_type: "video",
          symptoms,
          notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to book appointment");
      }

      // Store appointment details for easy access
      localStorage.setItem("lastAppointment", JSON.stringify(data.appointment));

      // Redirect to success page or patient dashboard
      router.push("/patient/appointments?booking=success");
    } catch (error: any) {
      setError(error.message);
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
      });
    }
    return dates;
  };

  const availableDates = generateAvailableDates();

  if (fetchingDoctor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Doctor Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The doctor you're looking for doesn't exist or is no longer
            available.
          </p>
          <Link href="/doctors">
            <Button>Find Other Doctors</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/doctors">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Doctors
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Book Appointment with Dr. {doctor.name}
                </h1>
                <p className="text-gray-600">
                  Schedule your video consultation
                </p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Doctor Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Doctor Profile */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start space-x-6">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-12 h-12 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Dr. {doctor.name}
                  </h2>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {doctor.specialties.map((specialty, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 mr-1" />
                      <span>
                        {doctor.rating} ({doctor.total_reviews} reviews)
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>{doctor.experience_years} years experience</span>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm">{doctor.bio}</p>
                </div>
              </div>
            </div>

            {/* Date Selection */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Select Date</h3>
              <div className="grid grid-cols-7 gap-2">
                {availableDates.map((date) => (
                  <button
                    key={date.value}
                    onClick={() => setSelectedDate(date.value)}
                    className={`p-3 text-center rounded-lg border transition-colors ${
                      selectedDate === date.value
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:border-gray-300"
                    } ${date.isToday ? "bg-yellow-50" : ""}`}
                  >
                    <div className="text-sm font-medium">{date.label}</div>
                    {date.isToday && (
                      <div className="text-xs text-yellow-600 mt-1">Today</div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Selection */}
            {selectedDate && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Select Time</h3>
                <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() =>
                        slot.available && setSelectedTime(slot.time)
                      }
                      disabled={!slot.available}
                      className={`p-3 text-sm text-center rounded-lg border transition-colors ${
                        selectedTime === slot.time
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : slot.available
                          ? "border-gray-200 hover:border-gray-300"
                          : "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Symptoms & Notes */}
            {selectedDate && selectedTime && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Additional Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Symptoms (Optional)
                    </label>
                    <textarea
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="Describe your symptoms..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                      placeholder="Any additional information..."
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              <h3 className="text-lg font-semibold mb-4">Booking Summary</h3>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Doctor:</span>
                  <span className="font-medium">Dr. {doctor.name}</span>
                </div>
                {selectedDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">
                      {new Date(selectedDate).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                )}
                {selectedTime && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time:</span>
                    <span className="font-medium">{selectedTime}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium">Video Consultation</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Consultation Fee:</span>
                  <span className="font-medium text-green-600">
                    ${doctor.consultation_fee}
                  </span>
                </div>
                <hr className="my-3" />
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span className="text-green-600">
                    ${doctor.consultation_fee}
                  </span>
                </div>
              </div>

              <Button
                onClick={handleBookAppointment}
                disabled={loading || !selectedDate || !selectedTime}
                className="w-full"
              >
                {loading ? "Booking..." : "Book Appointment"}
              </Button>

              <div className="mt-4 text-xs text-gray-500">
                <p>
                  • Video consultation will be conducted via secure video call
                </p>
                <p>• You will receive appointment confirmation via email</p>
                <p>• Cancel or reschedule up to 2 hours before appointment</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
