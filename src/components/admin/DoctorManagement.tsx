"use client";

import {
  ResponsiveButton,
  ResponsiveCard,
  ResponsiveGrid,
  ResponsiveInput,
  ResponsiveModal,
} from "@/components/ResponsiveComponents";
import { AnimatePresence, motion } from "framer-motion";
import {
  Award,
  Calendar,
  Check,
  Clock,
  Edit,
  Mail,
  Phone,
  Plus,
  Search,
  Star,
  Stethoscope,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

interface Doctor {
  id: string;
  name: string;
  email: string;
  phone: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  profile?: {
    id: string;
    medical_license: string;
    specialties: string[];
    qualifications: string[];
    experience_years: number;
    consultation_fee: number;
    languages: string[];
    bio?: string;
    rating: number;
    total_reviews: number;
    is_available_online: boolean;
    verification_status: string;
    upcoming_slots: number;
  };
}

// Add new interface for recurrence pattern
interface RecurrencePattern {
  type: string;
  days: number[];
}

// Add new interface for availability slots
interface AvailabilitySlot {
  id: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  is_booked: boolean;
  slot_duration: number;
  is_recurring?: boolean;
  recurrence_pattern?: RecurrencePattern;
}

// Add new interface for update slot data
interface UpdateSlotData {
  slot_id?: string;
  is_available?: boolean;
}

// Add new interface for weekly schedule
interface WeeklySchedule {
  [dayId: number]: {
    id?: string;
    start_time: string;
    end_time: string;
    slot_duration: number;
  }[];
}

// Define days of the week
const DAYS_OF_WEEK = [
  { id: 1, name: "Monday" },
  { id: 2, name: "Tuesday" },
  { id: 3, name: "Wednesday" },
  { id: 4, name: "Thursday" },
  { id: 5, name: "Friday" },
  { id: 6, name: "Saturday" },
  { id: 0, name: "Sunday" },
];

interface DoctorFormData {
  name: string;
  email: string;
  phone: string;
  medical_license: string;
  specialties: string[];
  qualifications: string[];
  experience_years: number;
  consultation_fee: number;
  languages: string[];
  bio: string;
  is_available_online: boolean;
}

export default function DoctorManagement() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // Add this state
  const [showModal, setShowModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [formData, setFormData] = useState<DoctorFormData>({
    name: "",
    email: "",
    phone: "",
    medical_license: "",
    specialties: [],
    qualifications: [],
    experience_years: 0,
    consultation_fee: 0,
    languages: [],
    bio: "",
    is_available_online: true,
  });

  // Availability management state
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [selectedDoctorForAvailability, setSelectedDoctorForAvailability] =
    useState<Doctor | null>(null);
  const [availabilitySlots, setAvailabilitySlots] = useState<
    AvailabilitySlot[]
  >([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  // Weekly schedule state
  const [showWeeklySchedule, setShowWeeklySchedule] = useState(false);
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>({});
  const [slotDuration] = useState(30);

  // New availability slot form state
  const [newSlotDate, setNewSlotDate] = useState("");
  const [newSlotStartTime, setNewSlotStartTime] = useState("");
  const [newSlotEndTime, setNewSlotEndTime] = useState("");
  const [newSlotDuration, setNewSlotDuration] = useState(30);
  const [isRecurring, setIsRecurring] = useState(false);
  const [newSlotError, setNewSlotError] = useState("");

  const specialtiesList = [
    "Cardiology",
    "Neurology",
    "Orthopedics",
    "Pediatrics",
    "Dermatology",
    "Psychiatry",
    "General Medicine",
  ];
  const languagesList = ["English", "Bengali", "Hindi", "Urdu", "Arabic"];

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      // Add status parameter to show all doctors by default
      const response = await fetch(
        `/api/admin/doctors?status=${statusFilter}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setDoctors(data.doctors || []);
      } else {
        setError("Failed to fetch doctors");
      }
    } catch (error) {
      setError("Error loading doctors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  // Add useEffect to refetch when status filter changes
  useEffect(() => {
    fetchDoctors();
  }, [statusFilter]);

  const handleCreateDoctor = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/admin/doctors", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchDoctors();
        setShowModal(false);
        resetForm();
      } else {
        setError("Failed to create doctor");
      }
    } catch (error) {
      setError("Error creating doctor");
    }
  };

  const handleUpdateDoctor = async () => {
    if (!editingDoctor) return;

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`/api/admin/doctors/${editingDoctor.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchDoctors();
        setShowModal(false);
        setEditingDoctor(null);
        resetForm();
      } else {
        setError("Failed to update doctor");
      }
    } catch (error) {
      setError("Error updating doctor");
    }
  };

  const handleDeleteDoctor = async (doctorId: string) => {
    if (!confirm("Are you sure you want to delete this doctor?")) return;

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`/api/admin/doctors/${doctorId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchDoctors();
      } else {
        setError("Failed to delete doctor");
      }
    } catch (error) {
      setError("Error deleting doctor");
    }
  };

  // Availability management functions
  const openAvailabilityModal = async (doctor: Doctor) => {
    setSelectedDoctorForAvailability(doctor);
    setShowAvailabilityModal(true);
    setShowWeeklySchedule(false); // Default to daily view

    // Fetch doctor's availability slots
    try {
      setAvailabilityLoading(true);
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `/api/admin/doctors/schedule?doctor_id=${doctor.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAvailabilitySlots(data.slots || []);

        // Initialize weekly schedule from recurring slots
        const schedule: WeeklySchedule = {};
        DAYS_OF_WEEK.forEach((day) => {
          schedule[day.id] = [];
        });

        const recurringSlots = data.slots.filter(
          (slot: AvailabilitySlot) => slot.is_recurring
        );
        recurringSlots.forEach((slot: AvailabilitySlot) => {
          const startDate = new Date(slot.start_time);
          const dayOfWeek = startDate.getDay();
          const startTime = startDate.toTimeString().substring(0, 5);
          const endDate = new Date(slot.end_time);
          const endTime = endDate.toTimeString().substring(0, 5);

          if (!schedule[dayOfWeek]) schedule[dayOfWeek] = [];
          schedule[dayOfWeek].push({
            id: slot.id,
            start_time: startTime,
            end_time: endTime,
            slot_duration: slot.slot_duration,
          });
        });

        setWeeklySchedule(schedule);
      } else {
        setError("Failed to fetch doctor availability");
      }
    } catch (error) {
      setError("Error loading doctor availability");
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const closeAvailabilityModal = () => {
    setShowAvailabilityModal(false);
    setSelectedDoctorForAvailability(null);
    setAvailabilitySlots([]);
    setWeeklySchedule({});
    setShowWeeklySchedule(false);
  };

  const handleUpdateAvailabilitySlot = async (
    slotId: string,
    updateData: UpdateSlotData
  ) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/admin/doctors/schedule", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slot_id: slotId,
          ...updateData,
        }),
      });

      if (response.ok) {
        // Refresh availability slots
        if (selectedDoctorForAvailability) {
          const refreshResponse = await fetch(
            `/api/admin/doctors/schedule?doctor_id=${selectedDoctorForAvailability.id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (refreshResponse.ok) {
            const data = await refreshResponse.json();
            setAvailabilitySlots(data.slots || []);
          }
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update availability slot");
      }
    } catch (err) {
      setError("Error updating availability slot");
    }
  };

  const handleDeleteAvailabilitySlot = async (slotId: string) => {
    if (!confirm("Are you sure you want to delete this availability slot?"))
      return;

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `/api/admin/doctors/schedule?slot_id=${slotId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        // Refresh availability slots
        if (selectedDoctorForAvailability) {
          const refreshResponse = await fetch(
            `/api/admin/doctors/schedule?doctor_id=${selectedDoctorForAvailability.id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (refreshResponse.ok) {
            const data = await refreshResponse.json();
            setAvailabilitySlots(data.slots || []);
          }
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to delete availability slot");
      }
    } catch (err) {
      setError("Error deleting availability slot");
    }
  };

  const handleCreateNewAvailabilitySlot = async () => {
    if (!selectedDoctorForAvailability) return;

    // Validate form
    if (!newSlotDate || !newSlotStartTime || !newSlotEndTime) {
      setNewSlotError("Please fill all required fields");
      return;
    }

    // Validate time
    const startDateTime = new Date(`${newSlotDate}T${newSlotStartTime}`);
    const endDateTime = new Date(`${newSlotDate}T${newSlotEndTime}`);

    if (startDateTime >= endDateTime) {
      setNewSlotError("End time must be after start time");
      return;
    }

    if (startDateTime < new Date()) {
      setNewSlotError("Cannot create slots in the past");
      return;
    }

    try {
      setNewSlotError("");
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/admin/doctors/schedule", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          doctor_id: selectedDoctorForAvailability.id,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          slot_duration: newSlotDuration,
          is_recurring: isRecurring,
          recurrence_pattern: isRecurring
            ? {
                type: "weekly",
                days: [startDateTime.getDay()],
              }
            : null,
        }),
      });

      if (response.ok) {
        // Reset form
        setNewSlotDate("");
        setNewSlotStartTime("");
        setNewSlotEndTime("");
        setNewSlotDuration(30);
        setIsRecurring(false);
        setNewSlotError("");

        // Refresh availability slots
        const refreshResponse = await fetch(
          `/api/admin/doctors/schedule?doctor_id=${selectedDoctorForAvailability.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          setAvailabilitySlots(data.slots || []);

          // Update weekly schedule
          const schedule: WeeklySchedule = {};
          DAYS_OF_WEEK.forEach((day) => {
            schedule[day.id] = [];
          });

          const recurringSlots = data.slots.filter(
            (slot: AvailabilitySlot) => slot.is_recurring
          );
          recurringSlots.forEach((slot: AvailabilitySlot) => {
            const startDate = new Date(slot.start_time);
            const dayOfWeek = startDate.getDay();
            const startTime = startDate.toTimeString().substring(0, 5);
            const endDate = new Date(slot.end_time);
            const endTime = endDate.toTimeString().substring(0, 5);

            if (!schedule[dayOfWeek]) schedule[dayOfWeek] = [];
            schedule[dayOfWeek].push({
              id: slot.id,
              start_time: startTime,
              end_time: endTime,
              slot_duration: slot.slot_duration,
            });
          });

          setWeeklySchedule(schedule);
        }
      } else {
        const errorData = await response.json();
        setNewSlotError(
          errorData.error || "Failed to create availability slot"
        );
      }
    } catch (err) {
      setNewSlotError("Error creating availability slot");
    }
  };

  // Handle weekly schedule creation
  const handleCreateWeeklySlot = async (
    dayId: number,
    startTime: string,
    endTime: string
  ) => {
    if (!selectedDoctorForAvailability) return;

    try {
      const token = localStorage.getItem("authToken");

      // Create a date for next occurrence of this day
      const today = new Date();
      const daysUntilTarget = (dayId - today.getDay() + 7) % 7;
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + daysUntilTarget);

      const startDateTime = `${
        targetDate.toISOString().split("T")[0]
      }T${startTime}:00`;
      const endDateTime = `${
        targetDate.toISOString().split("T")[0]
      }T${endTime}:00`;

      const response = await fetch("/api/admin/doctors/schedule", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          doctor_id: selectedDoctorForAvailability.id,
          start_time: startDateTime,
          end_time: endDateTime,
          slot_duration: slotDuration,
          is_recurring: true,
          recurrence_pattern: {
            type: "weekly",
            days: [dayId],
          },
        }),
      });

      if (response.ok) {
        // Refresh availability slots
        const refreshResponse = await fetch(
          `/api/admin/doctors/schedule?doctor_id=${selectedDoctorForAvailability.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          setAvailabilitySlots(data.slots || []);

          // Update weekly schedule
          const schedule: WeeklySchedule = {};
          DAYS_OF_WEEK.forEach((day) => {
            schedule[day.id] = [];
          });

          const recurringSlots = data.slots.filter(
            (slot: AvailabilitySlot) => slot.is_recurring
          );
          recurringSlots.forEach((slot: AvailabilitySlot) => {
            const startDate = new Date(slot.start_time);
            const dayOfWeek = startDate.getDay();
            const startTime = startDate.toTimeString().substring(0, 5);
            const endDate = new Date(slot.end_time);
            const endTime = endDate.toTimeString().substring(0, 5);

            if (!schedule[dayOfWeek]) schedule[dayOfWeek] = [];
            schedule[dayOfWeek].push({
              id: slot.id,
              start_time: startTime,
              end_time: endTime,
              slot_duration: slot.slot_duration,
            });
          });

          setWeeklySchedule(schedule);
        }
      } else {
        const errorData = await response.json();
        setError(
          errorData.error || "Failed to create weekly availability slot"
        );
      }
    } catch (err) {
      setError("Error creating weekly availability slot");
    }
  };

  // Handle weekly slot deletion
  const handleDeleteWeeklySlot = async (slotId: string) => {
    if (
      !confirm("Are you sure you want to delete this weekly availability slot?")
    )
      return;

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `/api/admin/doctors/schedule?slot_id=${slotId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        // Refresh availability slots
        if (selectedDoctorForAvailability) {
          const refreshResponse = await fetch(
            `/api/admin/doctors/schedule?doctor_id=${selectedDoctorForAvailability.id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (refreshResponse.ok) {
            const data = await refreshResponse.json();
            setAvailabilitySlots(data.slots || []);

            // Update weekly schedule
            const schedule: WeeklySchedule = {};
            DAYS_OF_WEEK.forEach((day) => {
              schedule[day.id] = [];
            });

            const recurringSlots = data.slots.filter(
              (slot: AvailabilitySlot) => slot.is_recurring
            );
            recurringSlots.forEach((slot: AvailabilitySlot) => {
              const startDate = new Date(slot.start_time);
              const dayOfWeek = startDate.getDay();
              const startTime = startDate.toTimeString().substring(0, 5);
              const endDate = new Date(slot.end_time);
              const endTime = endDate.toTimeString().substring(0, 5);

              if (!schedule[dayOfWeek]) schedule[dayOfWeek] = [];
              schedule[dayOfWeek].push({
                id: slot.id,
                start_time: startTime,
                end_time: endTime,
                slot_duration: slot.slot_duration,
              });
            });

            setWeeklySchedule(schedule);
          }
        }
      } else {
        const errorData = await response.json();
        setError(
          errorData.error || "Failed to delete weekly availability slot"
        );
      }
    } catch (err) {
      setError("Error deleting weekly availability slot");
    }
  };

  // Add a new time slot for a specific day in weekly schedule
  const addWeeklyTimeSlot = (dayId: number) => {
    const newSchedule = { ...weeklySchedule };
    if (!newSchedule[dayId]) newSchedule[dayId] = [];
    newSchedule[dayId].push({
      id: `temp-${Date.now()}`,
      start_time: "09:00",
      end_time: "17:00",
      slot_duration: slotDuration,
    });
    setWeeklySchedule(newSchedule);
  };

  // Remove a time slot for a specific day in weekly schedule
  const removeWeeklyTimeSlot = (dayId: number, index: number) => {
    const newSchedule = { ...weeklySchedule };
    newSchedule[dayId].splice(index, 1);
    setWeeklySchedule(newSchedule);
  };

  // Update time slot for a specific day in weekly schedule
  const updateWeeklyTimeSlot = (
    dayId: number,
    index: number,
    field: keyof WeeklySchedule[number][number],
    value: string
  ) => {
    const newSchedule = { ...weeklySchedule };
    if (newSchedule[dayId] && newSchedule[dayId][index]) {
      newSchedule[dayId][index] = {
        ...newSchedule[dayId][index],
        [field]: value,
      };
    }
    setWeeklySchedule(newSchedule);
  };

  // New state for add slot modal
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [selectedDayForSlot, setSelectedDayForSlot] = useState<{
    dayId: number;
    date: string;
  } | null>(null);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  // Function to open add slot modal
  const openAddSlotModal = (dayId: number, date: string) => {
    setSelectedDayForSlot({ dayId, date });
    setShowAddSlotModal(true);
    setSelectedDays([]); // Initialize selected days
  };

  // Function to close add slot modal
  const closeAddSlotModal = () => {
    setShowAddSlotModal(false);
    setSelectedDayForSlot(null);
    setNewSlotStartTime("");
    setNewSlotEndTime("");
    setNewSlotDuration(30);
    setIsRecurring(false);
    setNewSlotError("");
    setSelectedDays([]); // Reset selected days
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      medical_license: "",
      specialties: [],
      qualifications: [],
      experience_years: 0,
      consultation_fee: 0,
      languages: [],
      bio: "",
      is_available_online: true,
    });
  };

  const openEditModal = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setFormData({
      name: doctor.name,
      email: doctor.email,
      phone: doctor.phone,
      medical_license: doctor.profile?.medical_license || "",
      specialties: doctor.profile?.specialties || [],
      qualifications: doctor.profile?.qualifications || [],
      experience_years: doctor.profile?.experience_years || 0,
      consultation_fee: Number(doctor.profile?.consultation_fee || 0),
      languages: doctor.profile?.languages || [],
      bio: doctor.profile?.bio || "",
      is_available_online: doctor.profile?.is_available_online || false,
    });
    setShowModal(true);
  };

  const handleVerifyDoctor = async (
    doctorId: string,
    status: "APPROVED" | "REJECTED"
  ) => {
    try {
      // We need to get the verification ID first
      const token = localStorage.getItem("authToken");

      // Get the doctor's verification record
      const verificationResponse = await fetch(`/api/admin/doctors/pending`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!verificationResponse.ok) {
        setError("Failed to fetch verification data");
        return;
      }

      const verificationData = await verificationResponse.json();
      // Find the doctor by profile ID (doctor_id field in pending list)
      // The doctorId parameter is the user ID, but we need the profile ID
      // Let's find the doctor in our current doctors list to get the profile ID
      const currentDoctor = doctors.find((doc) => doc.id === doctorId);

      if (!currentDoctor || !currentDoctor.profile) {
        setError("Doctor not found in current list");
        return;
      }

      const doctorVerification = verificationData.doctors.find(
        (doc: { doctor_id: string }) =>
          doc.doctor_id === currentDoctor.profile?.id
      );

      if (!doctorVerification) {
        setError("Doctor verification record not found");
        return;
      }

      // Now verify the doctor using the verification ID
      const response = await fetch(`/api/admin/doctors/pending`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          verification_id: doctorVerification.id,
          action: status,
          rejection_reason:
            status === "REJECTED" ? "Rejected by admin" : undefined,
        }),
      });

      if (response.ok) {
        await fetchDoctors();
      } else {
        const errorData = await response.json();
        setError(
          `Failed to verify doctor: ${errorData.error || "Unknown error"}`
        );
      }
    } catch (err) {
      setError(
        `Error verifying doctor: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const filteredDoctors = doctors.filter((doctor) => {
    const matchesSearch =
      doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doctor.profile?.specialties || []).some((s) =>
        s.toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesSpecialty =
      !selectedSpecialty ||
      (doctor.profile?.specialties || []).includes(selectedSpecialty);

    // Apply status filter
    let matchesStatus = true;
    if (statusFilter === "active") {
      matchesStatus = doctor.is_active && doctor.is_verified;
    } else if (statusFilter === "inactive") {
      matchesStatus = !doctor.is_active;
    } else if (statusFilter === "pending") {
      matchesStatus = !doctor.is_verified;
    }
    // For "all" status, matchesStatus remains true

    return matchesSearch && matchesSpecialty && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Doctor Management
          </h1>
          <p className="text-gray-600 mt-2">
            Manage doctors, verification, and schedules
          </p>
        </div>
        <ResponsiveButton
          onClick={() => {
            resetForm();
            setEditingDoctor(null);
            setShowModal(true);
          }}
          className="bg-gradient-to-r from-blue-500 to-purple-500 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Doctor
        </ResponsiveButton>
      </div>

      {/* Filters */}
      <ResponsiveCard>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search doctors by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="">All Specialties</option>
                {specialtiesList.map((specialty) => (
                  <option key={specialty} value={specialty}>
                    {specialty}
                  </option>
                ))}
              </select>
            </div>
            {/* Add status filter dropdown */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="all">All Doctors</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending Verification</option>
              </select>
            </div>
          </div>
          <ResponsiveButton
            onClick={() => {
              setEditingDoctor(null);
              resetForm();
              setShowModal(true);
            }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus size={18} className="mr-2" />
            Add Doctor
          </ResponsiveButton>
        </div>
      </ResponsiveCard>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Doctors Grid */}
      <ResponsiveGrid cols={{ default: 1, md: 2, lg: 3 }}>
        {filteredDoctors.map((doctor, index) => (
          <motion.div
            key={doctor.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -5 }}
          >
            <ResponsiveCard className="h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full w-12 h-12 flex items-center justify-center mr-3">
                    <Stethoscope className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Dr. {doctor.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {doctor.profile?.specialties?.[0] || "General Medicine"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      doctor.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {doctor.is_active ? "Active" : "Inactive"}
                  </span>
                  {doctor.profile?.verification_status === "PENDING" && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                      Pending
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-2" />
                  {doctor.email}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="w-4 h-4 mr-2" />
                  {doctor.phone}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Award className="w-4 h-4 mr-2" />
                  {doctor.profile?.experience_years} years experience
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="w-4 h-4 mr-2" />$
                  {Number(doctor.profile?.consultation_fee || 0).toFixed(2)}{" "}
                  consultation fee
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Star className="w-4 h-4 mr-2 text-yellow-400" />
                  {(doctor.profile?.rating || 0).toFixed(1)} (
                  {doctor.profile?.total_reviews || 0} reviews)
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">Specialties:</p>
                <div className="flex flex-wrap gap-1">
                  {(doctor.profile?.specialties || [])
                    .slice(0, 3)
                    .map((specialty: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {specialty}
                      </span>
                    ))}
                  {(doctor.profile?.specialties || []).length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{(doctor.profile?.specialties || []).length - 3} more
                    </span>
                  )}
                </div>
              </div>

              <div className="flex space-x-2">
                <ResponsiveButton
                  size="sm"
                  variant="outline"
                  onClick={() => openEditModal(doctor)}
                  fullWidth
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </ResponsiveButton>
                <ResponsiveButton
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteDoctor(doctor.id)}
                  className="text-red-600 border-red-600 hover:bg-red-50"
                  fullWidth
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </ResponsiveButton>
              </div>
              <div className="mt-2">
                <ResponsiveButton
                  size="sm"
                  variant="outline"
                  onClick={() => openAvailabilityModal(doctor)}
                  fullWidth
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Availability
                </ResponsiveButton>
              </div>

              {doctor.profile?.verification_status === "PENDING" && (
                <div className="flex space-x-2 mt-2">
                  <ResponsiveButton
                    size="sm"
                    onClick={() => handleVerifyDoctor(doctor.id, "APPROVED")}
                    className="bg-green-600 text-white hover:bg-green-700"
                    fullWidth
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Approve
                  </ResponsiveButton>
                  <ResponsiveButton
                    size="sm"
                    onClick={() => handleVerifyDoctor(doctor.id, "REJECTED")}
                    className="bg-red-600 text-white hover:bg-red-700"
                    fullWidth
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reject
                  </ResponsiveButton>
                </div>
              )}
            </ResponsiveCard>
          </motion.div>
        ))}
      </ResponsiveGrid>

      {/* Create/Edit Modal */}
      <ResponsiveModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingDoctor(null);
          resetForm();
        }}
        title={editingDoctor ? "Edit Doctor" : "Add New Doctor"}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ResponsiveInput
              label="Full Name"
              placeholder="Enter doctor's name"
              value={formData.name}
              onChange={(value) => setFormData({ ...formData, name: value })}
              required
            />
            <ResponsiveInput
              label="Email"
              type="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={(value) => setFormData({ ...formData, email: value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ResponsiveInput
              label="Phone"
              placeholder="Enter phone number"
              value={formData.phone}
              onChange={(value) => setFormData({ ...formData, phone: value })}
              required
            />
            <ResponsiveInput
              label="Medical License"
              placeholder="Enter license number"
              value={formData.medical_license}
              onChange={(value) =>
                setFormData({ ...formData, medical_license: value })
              }
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ResponsiveInput
              label="Experience (Years)"
              type="number"
              placeholder="Enter years of experience"
              value={formData.experience_years.toString()}
              onChange={(value) =>
                setFormData({
                  ...formData,
                  experience_years: parseInt(value) || 0,
                })
              }
              required
            />
            <ResponsiveInput
              label="Consultation Fee ($)"
              type="number"
              placeholder="Enter consultation fee"
              value={formData.consultation_fee.toString()}
              onChange={(value) =>
                setFormData({
                  ...formData,
                  consultation_fee: parseFloat(value) || 0,
                })
              }
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Specialties
            </label>
            <div className="grid grid-cols-2 gap-2">
              {specialtiesList.map((specialty) => (
                <label key={specialty} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.specialties.includes(specialty)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          specialties: [...formData.specialties, specialty],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          specialties: formData.specialties.filter(
                            (s) => s !== specialty
                          ),
                        });
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {specialty}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Languages
            </label>
            <div className="grid grid-cols-2 gap-2">
              {languagesList.map((language) => (
                <label key={language} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.languages.includes(language)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          languages: [...formData.languages, language],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          languages: formData.languages.filter(
                            (l) => l !== language
                          ),
                        });
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{language}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bio
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
              placeholder="Enter doctor's bio and qualifications..."
              rows={3}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_available_online"
              checked={formData.is_available_online}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  is_available_online: e.target.checked,
                })
              }
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="is_available_online"
              className="ml-2 text-sm text-gray-700"
            >
              Available for online consultations
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <ResponsiveButton
              onClick={editingDoctor ? handleUpdateDoctor : handleCreateDoctor}
              className="bg-blue-600 text-white hover:bg-blue-700"
              fullWidth
            >
              {editingDoctor ? "Update Doctor" : "Create Doctor"}
            </ResponsiveButton>
            <ResponsiveButton
              onClick={() => {
                setShowModal(false);
                setEditingDoctor(null);
                resetForm();
              }}
              variant="outline"
              fullWidth
            >
              Cancel
            </ResponsiveButton>
          </div>
        </div>
      </ResponsiveModal>

      {/* Availability Management Modal - Larger Size */}
      <ResponsiveModal
        isOpen={showAvailabilityModal}
        onClose={closeAvailabilityModal}
        title={`Manage Availability - Dr. ${
          selectedDoctorForAvailability?.name || ""
        }`}
        size="xl"
      >
        <div className="h-[600px] flex flex-col text-black">
          {availabilityLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <div className="text-sm text-gray-600 mb-4">
                Manage the doctor&apos;s available time slots for appointments.
              </div>

              {/* View Toggle with enhanced styling */}
              <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg w-fit mb-4">
                <button
                  onClick={() => setShowWeeklySchedule(false)}
                  className={`px-4 py-2 rounded-md transition-all duration-300 ease-in-out ${
                    !showWeeklySchedule
                      ? "bg-white text-blue-600 shadow-sm font-medium"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Daily View
                </button>
                <button
                  onClick={() => setShowWeeklySchedule(true)}
                  className={`px-4 py-2 rounded-md transition-all duration-300 ease-in-out flex items-center ${
                    showWeeklySchedule
                      ? "bg-white text-blue-600 shadow-sm font-medium"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Weekly Schedule
                </button>
              </div>

              {/* Scrollable content area */}
              <div className="flex-1 overflow-y-auto pr-2 -mr-2">
                {showWeeklySchedule ? (
                  /* Simplified Weekly Schedule View */
                  <div className="space-y-6 pb-4">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl">
                      <h3 className="font-semibold text-lg text-gray-800 flex items-center">
                        <svg
                          className="w-5 h-5 mr-2 text-blue-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        Weekly Recurring Availability
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Set recurring time slots that repeat every week
                      </p>
                    </div>

                    {/* Weekly Schedule Table - Simplified */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <div className="grid grid-cols-8 gap-0 border-b border-gray-200">
                        <div className="p-3 bg-gray-50 font-medium text-gray-700 border-r border-gray-200">
                          Time Slots
                        </div>
                        {DAYS_OF_WEEK.map((day) => (
                          <div
                            key={day.id}
                            className="p-3 bg-gray-50 font-medium text-gray-700 border-r border-gray-200 last:border-r-0 text-center"
                          >
                            {day.name.substring(0, 3)}
                          </div>
                        ))}
                        <div className="p-3 bg-gray-50 font-medium text-gray-700 border-l border-gray-200">
                          Actions
                        </div>
                      </div>

                      {/* Show only added slots */}
                      {(() => {
                        // Group slots by time ranges
                        const timeSlotsMap: {
                          [key: string]: { [dayId: number]: AvailabilitySlot };
                        } = {};

                        availabilitySlots
                          .filter((slot) => slot.is_recurring)
                          .forEach((slot) => {
                            const startTime = new Date(slot.start_time);
                            const endTime = new Date(slot.end_time);
                            const timeKey = `${startTime.getHours()}:${startTime.getMinutes()}-${endTime.getHours()}:${endTime.getMinutes()}`;

                            if (!timeSlotsMap[timeKey]) {
                              timeSlotsMap[timeKey] = {};
                            }

                            timeSlotsMap[timeKey][startTime.getDay()] = slot;
                          });

                        return Object.keys(timeSlotsMap).length > 0 ? (
                          Object.keys(timeSlotsMap).map((timeKey, index) => {
                            const [start, end] = timeKey.split("-");
                            const [startHour, startMin] = start
                              .split(":")
                              .map(Number);
                            const [endHour, endMin] = end
                              .split(":")
                              .map(Number);

                            const startTimeStr =
                              startHour > 12
                                ? `${startHour - 12}:${startMin
                                    .toString()
                                    .padStart(2, "0")} PM`
                                : startHour === 12
                                ? `12:${startMin
                                    .toString()
                                    .padStart(2, "0")} PM`
                                : `${startHour}:${startMin
                                    .toString()
                                    .padStart(2, "0")} AM`;

                            const endTimeStr =
                              endHour > 12
                                ? `${endHour - 12}:${endMin
                                    .toString()
                                    .padStart(2, "0")} PM`
                                : endHour === 12
                                ? `12:${endMin.toString().padStart(2, "0")} PM`
                                : `${endHour}:${endMin
                                    .toString()
                                    .padStart(2, "0")} AM`;

                            return (
                              <div
                                key={timeKey}
                                className="grid grid-cols-8 gap-0 border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                              >
                                <div className="p-3 border-r border-gray-200 font-medium text-gray-700">
                                  {startTimeStr} - {endTimeStr}
                                </div>
                                {DAYS_OF_WEEK.map((day) => {
                                  const slot = timeSlotsMap[timeKey][day.id];
                                  return (
                                    <div
                                      key={`${timeKey}-${day.id}`}
                                      className="p-2 border-r border-gray-100 last:border-r-0 flex items-center justify-center"
                                    >
                                      {slot ? (
                                        <div
                                          className={`w-3 h-3 rounded-full ${
                                            slot.is_booked
                                              ? "bg-red-500"
                                              : slot.is_available
                                              ? "bg-green-500"
                                              : "bg-gray-400"
                                          }`}
                                          title={`${day.name}: ${
                                            slot.is_available
                                              ? "Available"
                                              : slot.is_booked
                                              ? "Booked"
                                              : "Blocked"
                                          }`}
                                        />
                                      ) : (
                                        <div className="w-3 h-3 rounded-full bg-gray-200" />
                                      )}
                                    </div>
                                  );
                                })}
                                <div className="p-2 border-l border-gray-100 flex items-center justify-center">
                                  <button
                                    onClick={() => {
                                      // Extract time from the key
                                      const [start, end] = timeKey.split("-");
                                      setNewSlotStartTime(start);
                                      setNewSlotEndTime(end);

                                      // Pre-select days that have slots for this time range
                                      const daysWithSlots = Object.keys(
                                        timeSlotsMap[timeKey]
                                      )
                                        .map((dayId) => parseInt(dayId))
                                        .filter(
                                          (dayId) =>
                                            timeSlotsMap[timeKey][dayId]
                                        );

                                      setSelectedDays(daysWithSlots);
                                      setShowAddSlotModal(true);
                                      setSelectedDayForSlot(null);
                                    }}
                                    className="px-3 py-1 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors duration-200"
                                  >
                                    Edit
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="col-span-9 p-8 text-center text-gray-500">
                            <svg
                              className="mx-auto h-12 w-12 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                              />
                            </svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900">
                              No recurring slots set
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                              Add recurring time slots that will repeat every
                              week.
                            </p>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Add Slot Button */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          setNewSlotStartTime("");
                          setNewSlotEndTime("");
                          setShowAddSlotModal(true);
                          setSelectedDayForSlot(null);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm flex items-center"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Recurring Slot
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Daily View with enhanced design */
                  <div className="space-y-6 pb-4">
                    <div className="bg-gradient-to-r from-green-50 to-teal-50 p-4 rounded-xl">
                      <h3 className="font-semibold text-lg text-gray-800 flex items-center">
                        <svg
                          className="w-5 h-5 mr-2 text-green-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        Current Availability Slots
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Manage individual date-specific availability slots
                      </p>
                    </div>

                    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                      {availabilitySlots.length > 0 ? (
                        <div className="divide-y divide-gray-200">
                          <AnimatePresence>
                            {availabilitySlots.map(
                              (slot: AvailabilitySlot, index) => (
                                <motion.div
                                  key={slot.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: 20 }}
                                  transition={{ duration: 0.3 }}
                                  className={`p-4 transition-all duration-300 hover:bg-gray-50 ${
                                    slot.is_booked
                                      ? "bg-red-50"
                                      : slot.is_available
                                      ? "bg-green-50"
                                      : "bg-gray-50"
                                  }`}
                                >
                                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                    <div className="flex-1">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-medium text-gray-900">
                                          {new Date(
                                            slot.start_time
                                          ).toLocaleDateString("en-US", {
                                            weekday: "short",
                                            month: "short",
                                            day: "numeric",
                                          })}
                                        </span>
                                        <span className="text-gray-700">
                                          {new Date(
                                            slot.start_time
                                          ).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}{" "}
                                          -{" "}
                                          {new Date(
                                            slot.end_time
                                          ).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </span>
                                        {slot.is_recurring && (
                                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            <svg
                                              className="mr-1 h-3 w-3"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                              />
                                            </svg>
                                            Recurring
                                          </span>
                                        )}
                                      </div>
                                      <div className="mt-1">
                                        <span
                                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            slot.is_booked
                                              ? "bg-red-100 text-red-800"
                                              : slot.is_available
                                              ? "bg-green-100 text-green-800"
                                              : "bg-gray-100 text-gray-800"
                                          }`}
                                        >
                                          {slot.is_booked
                                            ? "Booked"
                                            : slot.is_available
                                            ? "Available"
                                            : "Blocked"}
                                        </span>
                                      </div>
                                    </div>
                                    {!slot.is_booked && (
                                      <div className="flex space-x-2">
                                        <button
                                          onClick={() =>
                                            handleUpdateAvailabilitySlot(
                                              slot.id,
                                              {
                                                is_available:
                                                  !slot.is_available,
                                              }
                                            )
                                          }
                                          className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors duration-200 ${
                                            slot.is_available
                                              ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                              : "bg-green-100 text-green-800 hover:bg-green-200"
                                          }`}
                                        >
                                          {slot.is_available
                                            ? "Block Slot"
                                            : "Enable Slot"}
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleDeleteAvailabilitySlot(
                                              slot.id
                                            )
                                          }
                                          className="px-3 py-1.5 text-xs bg-red-100 text-red-800 rounded-lg font-medium hover:bg-red-200 transition-colors duration-200"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              )
                            )}
                          </AnimatePresence>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                          </svg>
                          <h3 className="mt-2 text-sm font-medium text-gray-900">
                            No availability slots
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">
                            Get started by adding a new availability slot below.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Add New Availability Slots Form with enhanced design */}
                    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <h3 className="font-medium text-gray-800 flex items-center">
                          <Plus className="w-4 h-4 mr-2 text-blue-500" />
                          Add New Availability Slot
                        </h3>
                      </div>
                      <div className="p-4">
                        <p className="text-sm text-gray-600 mb-4">
                          Set a new time slot for this doctor
                        </p>

                        {newSlotError && (
                          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center">
                            <svg
                              className="w-5 h-5 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            {newSlotError}
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Date
                            </label>
                            <input
                              type="date"
                              value={newSlotDate}
                              onChange={(e) => setNewSlotDate(e.target.value)}
                              min={new Date().toISOString().split("T")[0]}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Start Time
                            </label>
                            <input
                              type="time"
                              value={newSlotStartTime}
                              onChange={(e) =>
                                setNewSlotStartTime(e.target.value)
                              }
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              End Time
                            </label>
                            <input
                              type="time"
                              value={newSlotEndTime}
                              onChange={(e) =>
                                setNewSlotEndTime(e.target.value)
                              }
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Duration
                            </label>
                            <select
                              value={newSlotDuration}
                              onChange={(e) =>
                                setNewSlotDuration(Number(e.target.value))
                              }
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                            >
                              <option value={15}>15 minutes</option>
                              <option value={30}>30 minutes</option>
                              <option value={45}>45 minutes</option>
                              <option value={60}>60 minutes</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center mb-4">
                          <input
                            type="checkbox"
                            id="isRecurring"
                            checked={isRecurring}
                            onChange={(e) => setIsRecurring(e.target.checked)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label
                            htmlFor="isRecurring"
                            className="ml-2 block text-sm text-gray-700 flex items-center"
                          >
                            <svg
                              className="w-4 h-4 mr-1 text-blue-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                            Recurring slot (weekly)
                          </label>
                        </div>

                        <div className="flex justify-end">
                          <button
                            onClick={handleCreateNewAvailabilitySlot}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm flex items-center"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Slot
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Fixed footer */}
              <div className="pt-4 border-t border-gray-200 mt-auto">
                <div className="flex justify-end">
                  <button
                    onClick={closeAvailabilityModal}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </ResponsiveModal>

      {/* Add Slot Modal - Simplified */}
      <ResponsiveModal
        isOpen={showAddSlotModal}
        onClose={closeAddSlotModal}
        title={`Add Recurring Availability Slot`}
        size="md"
      >
        <div className="space-y-4 text-black">
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              Set a recurring time slot that will repeat every week
            </p>
          </div>

          {newSlotError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {newSlotError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={newSlotStartTime}
                onChange={(e) => setNewSlotStartTime(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <input
                type="time"
                value={newSlotEndTime}
                onChange={(e) => setNewSlotEndTime(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (minutes)
              </label>
              <select
                value={newSlotDuration}
                onChange={(e) => setNewSlotDuration(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
            </div>

            <div className="flex items-end">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isRecurringSlot"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled
                />
                <label
                  htmlFor="isRecurringSlot"
                  className="ml-2 block text-sm text-gray-700 flex items-center"
                >
                  <svg
                    className="w-4 h-4 mr-1 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Recurring (weekly)
                </label>
              </div>
            </div>
          </div>

          {/* Day Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Days
            </label>
            <div className="grid grid-cols-4 gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <label
                  key={day.id}
                  className="flex items-center space-x-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedDays.includes(day.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedDays([...selectedDays, day.id]);
                      } else {
                        setSelectedDays(
                          selectedDays.filter((d) => d !== day.id)
                        );
                      }
                    }}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    {day.name.substring(0, 3)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={closeAddSlotModal}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                try {
                  // First, get all existing recurring slots for this time range
                  const existingSlotsForTimeRange = availabilitySlots.filter(
                    (slot) => {
                      const startTime = new Date(slot.start_time);
                      const endTime = new Date(slot.end_time);
                      const timeKey = `${startTime.getHours()}:${startTime.getMinutes()}-${endTime.getHours()}:${endTime.getMinutes()}`;
                      const [start, end] =
                        `${newSlotStartTime}-${newSlotEndTime}`.split("-");
                      const [startHour, startMin] = start
                        .split(":")
                        .map(Number);
                      const [endHour, endMin] = end.split(":").map(Number);
                      const newTimeKey = `${startHour}:${startMin}-${endHour}:${endMin}`;

                      return slot.is_recurring && timeKey === newTimeKey;
                    }
                  );

                  // Delete slots for days that are no longer selected
                  const token = localStorage.getItem("authToken");
                  for (const slot of existingSlotsForTimeRange) {
                    const slotDay = new Date(slot.start_time).getDay();
                    // If this day is not in selectedDays, delete the slot
                    if (!selectedDays.includes(slotDay)) {
                      try {
                        const response = await fetch(
                          `/api/admin/doctors/schedule?slot_id=${slot.id}`,
                          {
                            method: "DELETE",
                            headers: {
                              Authorization: `Bearer ${token}`,
                            },
                          }
                        );

                        if (!response.ok) {
                          const errorData = await response.json();
                          setNewSlotError(
                            errorData.error ||
                              "Failed to delete availability slot"
                          );
                          return;
                        }
                      } catch (err) {
                        setNewSlotError("Error deleting availability slot");
                        return;
                      }
                    }
                  }

                  // Create/update slots for selected days
                  for (const dayId of selectedDays) {
                    // Check if a slot already exists for this day and time
                    const existingSlot = existingSlotsForTimeRange.find(
                      (slot) => {
                        return new Date(slot.start_time).getDay() === dayId;
                      }
                    );

                    // If slot exists, update it; otherwise create a new one
                    if (!existingSlot) {
                      // Create a date for next occurrence of this day
                      const today = new Date();
                      const daysUntilTarget = (dayId - today.getDay() + 7) % 7;
                      const targetDate = new Date(today);
                      targetDate.setDate(today.getDate() + daysUntilTarget);

                      const startDateTime = `${
                        targetDate.toISOString().split("T")[0]
                      }T${newSlotStartTime}:00`;
                      const endDateTime = `${
                        targetDate.toISOString().split("T")[0]
                      }T${newSlotEndTime}:00`;

                      try {
                        const response = await fetch(
                          "/api/admin/doctors/schedule",
                          {
                            method: "POST",
                            headers: {
                              Authorization: `Bearer ${token}`,
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                              doctor_id: selectedDoctorForAvailability?.id,
                              start_time: startDateTime,
                              end_time: endDateTime,
                              slot_duration: newSlotDuration,
                              is_recurring: true,
                              recurrence_pattern: {
                                type: "weekly",
                                days: [dayId],
                              },
                            }),
                          }
                        );

                        if (!response.ok) {
                          const errorData = await response.json();
                          setNewSlotError(
                            errorData.error ||
                              "Failed to create availability slot"
                          );
                          return;
                        }
                      } catch (err) {
                        setNewSlotError("Error creating availability slot");
                        return;
                      }
                    }
                    // If slot exists and is already correct, we don't need to do anything
                  }

                  // Refresh availability slots
                  if (selectedDoctorForAvailability) {
                    const refreshResponse = await fetch(
                      `/api/admin/doctors/schedule?doctor_id=${selectedDoctorForAvailability.id}`,
                      {
                        headers: {
                          Authorization: `Bearer ${token}`,
                        },
                      }
                    );

                    if (refreshResponse.ok) {
                      const data = await refreshResponse.json();
                      setAvailabilitySlots(data.slots || []);
                    }
                  }

                  closeAddSlotModal();
                } catch (error) {
                  console.error("Error updating slots:", error);
                  setNewSlotError("Error updating availability slots");
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              {availabilitySlots.some((slot) => {
                const startTime = new Date(slot.start_time);
                const endTime = new Date(slot.end_time);
                const timeKey = `${startTime.getHours()}:${startTime.getMinutes()}-${endTime.getHours()}:${endTime.getMinutes()}`;
                const [start, end] =
                  `${newSlotStartTime}-${newSlotEndTime}`.split("-");
                const [startHour, startMin] = start.split(":").map(Number);
                const [endHour, endMin] = end.split(":").map(Number);
                const newTimeKey = `${startHour}:${startMin}-${endHour}:${endMin}`;

                return slot.is_recurring && timeKey === newTimeKey;
              })
                ? "Update Slots"
                : "Add Slots"}
            </button>
          </div>
        </div>
      </ResponsiveModal>
    </motion.div>
  );
}
