"use client";

import {
  ResponsiveButton,
  ResponsiveCard,
  ResponsiveModal,
} from "@/components/ResponsiveComponents";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Check,
  Clock,
  Plus,
  Repeat,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

interface AvailabilitySlot {
  id: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  is_booked: boolean;
  slot_duration: number;
  is_recurring?: boolean;
  recurrence_pattern?: {
    type: string;
    days: number[];
  };
}

interface Doctor {
  id: string;
  name: string;
  email: string;
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

export default function DoctorAvailabilityManagement() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [availabilitySlots, setAvailabilitySlots] = useState<
    AvailabilitySlot[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<AvailabilitySlot | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [slotDuration, setSlotDuration] = useState<number>(30);
  const [isRecurring, setIsRecurring] = useState<boolean>(false);

  // New states for weekly schedule
  const [showWeeklySchedule, setShowWeeklySchedule] = useState<boolean>(false);
  const [weeklySchedule, setWeeklySchedule] = useState<
    Record<
      number,
      Array<{
        id?: string;
        start_time: string;
        end_time: string;
        slot_duration: number;
      }>
    >
  >({});
  const [weeklySlots, setWeeklySlots] = useState<AvailabilitySlot[]>([]);

  // Generate next 7 days
  const getNext7Days = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date.toISOString().split("T")[0]);
    }
    return days;
  };

  const [availableDates] = useState<string[]>(getNext7Days());

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (selectedDoctor) {
      fetchDoctorAvailability(selectedDoctor.id);
    }
  }, [selectedDoctor]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/admin/doctors", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDoctors(data.doctors || []);
      } else {
        setError("Failed to fetch doctors");
      }
    } catch (err) {
      console.error("Error loading doctors:", err);
      setError("Error loading doctors");
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorAvailability = async (doctorId: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `/api/admin/doctors/schedule?doctor_id=${doctorId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAvailabilitySlots(data.slots || []);

        // Extract weekly recurring slots
        const recurringSlots = data.slots.filter(
          (slot: AvailabilitySlot) => slot.is_recurring
        );
        setWeeklySlots(recurringSlots);

        // Initialize weekly schedule
        const schedule: Record<
          number,
          Array<{
            id?: string;
            start_time: string;
            end_time: string;
            slot_duration: number;
          }>
        > = {};
        DAYS_OF_WEEK.forEach((day) => {
          schedule[day.id] = [];
        });

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
    } catch (err) {
      console.error("Error loading doctor availability:", err);
      setError("Error loading doctor availability");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSlot = async () => {
    if (!selectedDoctor || !selectedDate || !startTime || !endTime) {
      setError("Please fill all required fields");
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const startDateTime = `${selectedDate}T${startTime}:00`;
      const endDateTime = `${selectedDate}T${endTime}:00`;

      const response = await fetch("/api/admin/doctors/schedule", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          doctor_id: selectedDoctor.id,
          start_time: startDateTime,
          end_time: endDateTime,
          slot_duration: slotDuration,
          is_recurring: isRecurring,
          recurrence_pattern: isRecurring
            ? {
                type: "weekly",
                days: [new Date(startDateTime).getDay()],
              }
            : null,
        }),
      });

      if (response.ok) {
        await fetchDoctorAvailability(selectedDoctor.id);
        setShowModal(false);
        resetForm();
      } else {
        const errorData = await response.json();
        console.error("API Error:", errorData); // Log the error for debugging
        setError(errorData.error || "Failed to create availability slot");
      }
    } catch (err) {
      console.error("Network Error:", err); // Log the network error
      console.error("Network error: Failed to create availability slot:", err);
      setError("Network error: Failed to create availability slot");
    }
  };

  const handleUpdateSlot = async () => {
    if (!editingSlot) return;

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/admin/doctors/schedule", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slot_id: editingSlot.id,
          is_available: editingSlot.is_available,
        }),
      });

      if (response.ok) {
        await fetchDoctorAvailability(selectedDoctor?.id || "");
        setEditingSlot(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update availability slot");
      }
    } catch (err) {
      console.error("Error updating availability slot:", err);
      setError("Error updating availability slot");
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
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
        await fetchDoctorAvailability(selectedDoctor?.id || "");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to delete availability slot");
      }
    } catch (err) {
      console.error("Error deleting availability slot:", err);
      setError("Error deleting availability slot");
    }
  };

  // Handle weekly schedule creation
  const handleCreateWeeklySlot = async (
    dayId: number,
    startTime: string,
    endTime: string
  ) => {
    if (!selectedDoctor) {
      setError("Please select a doctor first");
      return;
    }

    try {
      const token = localStorage.getItem("authToken");

      // Create a date for next occurrence of this day
      const today = new Date();
      const daysUntilTarget = (dayId - today.getDay() + 7) % 7;
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + daysUntilTarget);

      // Create local Date instances to avoid timezone shifts when converting to ISO
      const [startHour, startMinute] = startTime.split(":").map(Number);
      const [endHour, endMinute] = endTime.split(":").map(Number);
      const startLocal = new Date(targetDate);
      startLocal.setHours(startHour, startMinute, 0, 0);
      const endLocal = new Date(targetDate);
      endLocal.setHours(endHour, endMinute, 0, 0);

      const response = await fetch("/api/admin/doctors/schedule", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          doctor_id: selectedDoctor.id,
          start_time: startLocal.toISOString(),
          end_time: endLocal.toISOString(),
          slot_duration: slotDuration,
          is_recurring: true,
          recurrence_pattern: {
            type: "weekly",
            days: [dayId],
          },
        }),
      });

      if (response.ok) {
        await fetchDoctorAvailability(selectedDoctor.id);
      } else {
        const errorData = await response.json();
        console.error("API Error:", errorData); // Log the error for debugging
        setError(
          errorData.error || "Failed to create weekly availability slot"
        );
      }
    } catch (err) {
      console.error("Network Error:", err); // Log the network error
      console.error(
        "Network error: Failed to create weekly availability slot:",
        err
      );
      setError("Network error: Failed to create weekly availability slot");
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
        await fetchDoctorAvailability(selectedDoctor?.id || "");
      } else {
        const errorData = await response.json();
        setError(
          errorData.error || "Failed to delete weekly availability slot"
        );
      }
    } catch (err) {
      console.error("Error deleting weekly availability slot:", err);
      setError("Error deleting weekly availability slot");
    }
  };

  const resetForm = () => {
    setSelectedDate("");
    setStartTime("");
    setEndTime("");
    setSlotDuration(30);
    setIsRecurring(false);
    setEditingSlot(null);
  };

  const toggleSlotAvailability = (slot: AvailabilitySlot) => {
    setEditingSlot({
      ...slot,
      is_available: !slot.is_available,
    });
  };

  // Add a new time slot for a specific day in weekly schedule
  const addWeeklyTimeSlot = (dayId: number) => {
    const newSchedule = { ...weeklySchedule };
    if (!newSchedule[dayId]) newSchedule[dayId] = [];
    newSchedule[dayId].push({
      id: Date.now().toString(),
      start_time: "09:00",
      end_time: "17:00",
      slot_duration: 30,
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
    field: keyof {
      id?: string;
      start_time: string;
      end_time: string;
      slot_duration: number;
    },
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      {/* Doctor Selection */}
      <ResponsiveCard>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-900">Select Doctor</h3>
          <div className="flex flex-wrap gap-2">
            {doctors.map((doctor) => (
              <button
                key={doctor.id}
                onClick={() => setSelectedDoctor(doctor)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedDoctor?.id === doctor.id
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {doctor.name}
              </button>
            ))}
          </div>
        </div>
      </ResponsiveCard>

      {selectedDoctor && (
        <>
          {/* View Toggle */}
          <div className="flex space-x-2">
            <button
              onClick={() => setShowWeeklySchedule(false)}
              className={`px-4 py-2 rounded-lg ${
                !showWeeklySchedule
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              Daily View
            </button>
            <button
              onClick={() => setShowWeeklySchedule(true)}
              className={`px-4 py-2 rounded-lg flex items-center ${
                showWeeklySchedule
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              <Repeat className="h-4 w-4 mr-2" />
              Weekly Schedule
            </button>
          </div>

          {/* Weekly Schedule View */}
          {showWeeklySchedule ? (
            <ResponsiveCard>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedDoctor.name}&apos;s Weekly Schedule
                  </h3>
                  <p className="text-sm text-gray-500">
                    Set recurring weekly availability
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <select
                    value={slotDuration}
                    onChange={(e) => setSlotDuration(Number(e.target.value))}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value={15}>15 min slots</option>
                    <option value={30}>30 min slots</option>
                    <option value={45}>45 min slots</option>
                    <option value={60}>60 min slots</option>
                  </select>
                  <ResponsiveButton
                    onClick={() => {
                      // Save all weekly slots
                      Object.keys(weeklySchedule).forEach((dayId) => {
                        (weeklySchedule[parseInt(dayId)] || []).forEach(
                          (slot: {
                            id?: string;
                            start_time: string;
                            end_time: string;
                            slot_duration: number;
                          }) => {
                            if (slot.id && slot.id.startsWith("temp")) {
                              // This is a new slot, create it
                              handleCreateWeeklySlot(
                                parseInt(dayId),
                                slot.start_time,
                                slot.end_time
                              );
                            }
                          }
                        );
                      });
                    }}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Save All
                  </ResponsiveButton>
                </div>
              </div>

              {/* Weekly Schedule Grid */}
              <div className="space-y-6">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">{day.name}</h4>
                      <ResponsiveButton
                        size="sm"
                        onClick={() => addWeeklyTimeSlot(day.id)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Slot
                      </ResponsiveButton>
                    </div>

                    {weeklySchedule[day.id] &&
                    weeklySchedule[day.id].length > 0 ? (
                      <div className="space-y-3">
                        {weeklySchedule[day.id].map(
                          (
                            slot: {
                              id?: string;
                              start_time: string;
                              end_time: string;
                              slot_duration: number;
                            },
                            index: number
                          ) => (
                            <div
                              key={slot.id || index}
                              className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                            >
                              <input
                                type="time"
                                value={slot.start_time}
                                onChange={(e) =>
                                  updateWeeklyTimeSlot(
                                    day.id,
                                    index,
                                    "start_time",
                                    e.target.value
                                  )
                                }
                                className="border border-gray-300 rounded px-2 py-1 text-sm"
                              />
                              <span className="text-gray-500">to</span>
                              <input
                                type="time"
                                value={slot.end_time}
                                onChange={(e) =>
                                  updateWeeklyTimeSlot(
                                    day.id,
                                    index,
                                    "end_time",
                                    e.target.value
                                  )
                                }
                                className="border border-gray-300 rounded px-2 py-1 text-sm"
                              />
                              <button
                                onClick={() =>
                                  removeWeeklyTimeSlot(day.id, index)
                                }
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                              {slot.id && !slot.id.startsWith("temp") && (
                                <button
                                  onClick={() =>
                                    slot.id && handleDeleteWeeklySlot(slot.id)
                                  }
                                  className="text-red-500 hover:text-red-700 text-xs"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">
                        No availability set for {day.name}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </ResponsiveCard>
          ) : (
            /* Daily View */
            <ResponsiveCard>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedDoctor.name}&apos;s Availability
                  </h3>
                  <p className="text-sm text-gray-500">
                    Manage availability for the next 7 days
                  </p>
                </div>
                <ResponsiveButton
                  onClick={() => {
                    resetForm();
                    setShowModal(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Availability Slot
                </ResponsiveButton>
              </div>

              {/* Availability Slots by Date */}
              <div className="space-y-6">
                {availableDates.map((date) => {
                  const slotsForDate = availabilitySlots.filter(
                    (slot) =>
                      new Date(slot.start_time).toISOString().split("T")[0] ===
                      date
                  );

                  return (
                    <div key={date} className="border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">
                        {new Date(date).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </h4>
                      {slotsForDate.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {slotsForDate.map((slot) => (
                            <motion.div
                              key={slot.id}
                              whileHover={{ scale: 1.02 }}
                              className={`border rounded-lg p-3 ${
                                slot.is_booked
                                  ? "bg-red-50 border-red-200"
                                  : slot.is_available
                                  ? "bg-green-50 border-green-200"
                                  : "bg-gray-50 border-gray-200"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 mr-2 text-gray-500" />
                                  <span className="font-medium">
                                    {new Date(
                                      slot.start_time
                                    ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}{" "}
                                    -{" "}
                                    {new Date(slot.end_time).toLocaleTimeString(
                                      [],
                                      {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      }
                                    )}
                                  </span>
                                  {slot.is_recurring && (
                                    <Repeat className="h-4 w-4 ml-2 text-blue-500" />
                                  )}
                                </div>
                                <div className="flex items-center space-x-1">
                                  {slot.is_booked ? (
                                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                      Booked
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() =>
                                        toggleSlotAvailability(slot)
                                      }
                                      className={`text-xs px-2 py-1 rounded ${
                                        slot.is_available
                                          ? "bg-green-100 text-green-800"
                                          : "bg-gray-100 text-gray-800"
                                      }`}
                                    >
                                      {slot.is_available
                                        ? "Available"
                                        : "Blocked"}
                                    </button>
                                  )}
                                </div>
                              </div>
                              {!slot.is_booked && (
                                <div className="flex items-center justify-end space-x-2 mt-2">
                                  <button
                                    onClick={() => handleDeleteSlot(slot.id)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">
                          No availability slots set for this date
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </ResponsiveCard>
          )}

          {/* Save Changes Button */}
          {editingSlot && (
            <div className="fixed bottom-6 right-6 flex space-x-2">
              <ResponsiveButton
                onClick={() => setEditingSlot(null)}
                variant="outline"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </ResponsiveButton>
              <ResponsiveButton onClick={handleUpdateSlot}>
                <Check className="h-4 w-4 mr-2" />
                Save Changes
              </ResponsiveButton>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Slot Modal */}
      <ResponsiveModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title="Add Availability Slot"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a date</option>
              {availableDates.map((date) => (
                <option key={date} value={date}>
                  {new Date(date).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slot Duration (minutes)
            </label>
            <select
              value={slotDuration}
              onChange={(e) => setSlotDuration(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isRecurring"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label
              htmlFor="isRecurring"
              className="ml-2 block text-sm text-gray-700"
            >
              Recurring slot (weekly)
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <ResponsiveButton
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              variant="outline"
            >
              Cancel
            </ResponsiveButton>
            <ResponsiveButton onClick={handleCreateSlot}>
              Add Slot
            </ResponsiveButton>
          </div>
        </div>
      </ResponsiveModal>
    </div>
  );
}
