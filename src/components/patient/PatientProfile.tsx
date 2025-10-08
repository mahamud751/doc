"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  User,
  Edit,
  Save,
  X,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Heart,
  Shield,
  AlertTriangle,
} from "lucide-react";

interface PatientProfileProps {
  patientData: {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatar_url?: string;
    profile?: {
      date_of_birth?: string;
      gender?: string;
      blood_group?: string;
      address?: string;
      emergency_contact?: string;
      allergies?: string[];
      medical_history?: string;
    };
  };
  onUpdate: () => void;
}

export default function PatientProfile({
  patientData,
  onUpdate,
}: PatientProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    // User data
    name: patientData.name || "",
    email: patientData.email || "",
    phone: patientData.phone || "",

    // Profile data
    date_of_birth:
      patientData.profile?.date_of_birth &&
      patientData.profile.date_of_birth !== null
        ? new Date(patientData.profile.date_of_birth)
            .toISOString()
            .split("T")[0]
        : "",
    gender: patientData.profile?.gender || "",
    blood_group: patientData.profile?.blood_group || "",
    address: patientData.profile?.address || "",
    emergency_contact: patientData.profile?.emergency_contact || "",
    allergies: patientData.profile?.allergies?.join(", ") || "",
    medical_history: patientData.profile?.medical_history || "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("Authentication required");
        return;
      }

      // Separate user data from profile data - only include changed fields
      const user_data: Record<string, string> = {};

      // Only send name if it has changed
      if (formData.name !== patientData.name) {
        user_data.name = formData.name;
      }

      // Email cannot be changed, so don't send it

      // Only send phone if it has changed
      if (formData.phone !== patientData.phone) {
        user_data.phone = formData.phone;
      }

      // Only include profile_data if there are actual changes
      const profile_data: Record<string, any> = {};
      let hasProfileChanges = false;

      // Check each profile field for changes
      if (
        formData.date_of_birth !==
        (patientData.profile?.date_of_birth &&
        patientData.profile.date_of_birth !== null
          ? new Date(patientData.profile.date_of_birth)
              .toISOString()
              .split("T")[0]
          : "")
      ) {
        if (formData.date_of_birth) {
          profile_data.date_of_birth = formData.date_of_birth;
        } else {
          profile_data.date_of_birth = null;
        }
        hasProfileChanges = true;
      }

      if (formData.gender !== (patientData.profile?.gender || "")) {
        profile_data.gender = formData.gender || null;
        hasProfileChanges = true;
      }

      if (formData.blood_group !== (patientData.profile?.blood_group || "")) {
        profile_data.blood_group = formData.blood_group || null;
        hasProfileChanges = true;
      }

      if (formData.address !== (patientData.profile?.address || "")) {
        profile_data.address = formData.address || null;
        hasProfileChanges = true;
      }

      if (
        formData.emergency_contact !==
        (patientData.profile?.emergency_contact || "")
      ) {
        profile_data.emergency_contact = formData.emergency_contact || null;
        hasProfileChanges = true;
      }

      if (
        formData.medical_history !==
        (patientData.profile?.medical_history || "")
      ) {
        profile_data.medical_history = formData.medical_history || null;
        hasProfileChanges = true;
      }

      // Handle allergies comparison
      const currentAllergies = patientData.profile?.allergies?.join(", ") || "";
      if (formData.allergies !== currentAllergies) {
        profile_data.allergies = formData.allergies
          ? formData.allergies
              .split(",")
              .map((a) => a.trim())
              .filter((a) => a !== "")
          : [];
        hasProfileChanges = true;
      }

      // If no changes, show message and return
      if (Object.keys(user_data).length === 0 && !hasProfileChanges) {
        setSuccess("No changes to save");
        setIsEditing(false);
        // Clear success message after 2 seconds
        setTimeout(() => setSuccess(""), 2000);
        setLoading(false);
        return;
      }

      const response = await fetch("/api/patients/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...(Object.keys(user_data).length > 0 && { user_data }),
          ...(hasProfileChanges && { profile_data }),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update profile");
      }

      setSuccess("Profile updated successfully!");
      setIsEditing(false);
      onUpdate(); // Refresh the parent component data

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update profile"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original values
    setFormData({
      name: patientData.name || "",
      email: patientData.email || "",
      phone: patientData.phone || "",
      date_of_birth:
        patientData.profile?.date_of_birth &&
        patientData.profile.date_of_birth !== null
          ? new Date(patientData.profile.date_of_birth)
              .toISOString()
              .split("T")[0]
          : "",
      gender: patientData.profile?.gender || "",
      blood_group: patientData.profile?.blood_group || "",
      address: patientData.profile?.address || "",
      emergency_contact: patientData.profile?.emergency_contact || "",
      allergies: patientData.profile?.allergies?.join(", ") || "",
      medical_history: patientData.profile?.medical_history || "",
    });
    setIsEditing(false);
    setError("");
    setSuccess("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-gray-900">My Profile</h1>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          {!isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-full shadow-lg"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex space-x-3">
              <Button
                onClick={handleSave}
                disabled={loading}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-full shadow-lg"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                className="rounded-full"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-2xl"
        >
          {error}
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 text-green-600 px-6 py-4 rounded-2xl"
        >
          {success}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Basic Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-2xl rounded-3xl">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
              <CardTitle className="flex items-center text-2xl font-bold text-gray-900">
                <User className="h-6 w-6 mr-3 text-blue-600" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm text-black placeholder-black"
                    placeholder="Enter your full name"
                  />
                ) : (
                  <p className="text-black font-semibold text-lg">
                    {patientData.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  <Mail className="h-4 w-4 inline mr-1" />
                  Email
                </label>
                {isEditing ? (
                  <>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm text-black placeholder-black"
                      placeholder="Enter your email address"
                      readOnly
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Email cannot be changed for security reasons
                    </p>
                  </>
                ) : (
                  <p className="text-black">{patientData.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  <Phone className="h-4 w-4 inline mr-1" />
                  Phone
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm text-black placeholder-black"
                    placeholder="Enter your phone number"
                  />
                ) : (
                  <p className="text-black">{patientData.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Date of Birth
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleInputChange}
                    className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm text-black placeholder-black"
                  />
                ) : (
                  <p className="text-black">
                    {patientData.profile?.date_of_birth &&
                    patientData.profile.date_of_birth !== null
                      ? new Date(
                          patientData.profile.date_of_birth
                        ).toLocaleDateString()
                      : "Not provided"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Gender
                </label>
                {isEditing ? (
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm text-black placeholder-black"
                  >
                    <option value="">Select Gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                ) : (
                  <p className="text-black">
                    {patientData.profile?.gender || "Not provided"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Address
                </label>
                {isEditing ? (
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm resize-none text-black placeholder-black"
                    placeholder="Enter your full address"
                  />
                ) : (
                  <p className="text-black">
                    {patientData.profile?.address || "Not provided"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Medical Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-2xl rounded-3xl">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
              <CardTitle className="flex items-center text-2xl font-bold text-gray-900">
                <Heart className="h-6 w-6 mr-3 text-green-600" />
                Medical Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Blood Group
                </label>
                {isEditing ? (
                  <select
                    name="blood_group"
                    value={formData.blood_group}
                    onChange={handleInputChange}
                    className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm text-black placeholder-black"
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                ) : (
                  <p className="text-black">
                    {patientData.profile?.blood_group || "Not provided"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  <Shield className="h-4 w-4 inline mr-1" />
                  Emergency Contact
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="emergency_contact"
                    value={formData.emergency_contact}
                    onChange={handleInputChange}
                    placeholder="Emergency contact phone number"
                    className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm text-black placeholder-black"
                  />
                ) : (
                  <p className="text-black">
                    {patientData.profile?.emergency_contact || "Not provided"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  <AlertTriangle className="h-4 w-4 inline mr-1" />
                  Allergies
                </label>
                {isEditing ? (
                  <textarea
                    name="allergies"
                    value={formData.allergies}
                    onChange={handleInputChange}
                    placeholder="Enter allergies separated by commas (e.g., Peanuts, Shellfish, Penicillin)"
                    rows={3}
                    className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm resize-none text-black placeholder-black"
                  />
                ) : (
                  <div>
                    {patientData.profile?.allergies &&
                    patientData.profile.allergies.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {patientData.profile.allergies.map((allergy, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium"
                          >
                            {allergy}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-black">No known allergies</p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Medical History
                </label>
                {isEditing ? (
                  <textarea
                    name="medical_history"
                    value={formData.medical_history}
                    onChange={handleInputChange}
                    placeholder="Enter your medical history, previous conditions, surgeries, etc."
                    rows={4}
                    className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm resize-none text-black placeholder-black"
                  />
                ) : (
                  <p className="text-black">
                    {patientData.profile?.medical_history ||
                      "No medical history provided"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
