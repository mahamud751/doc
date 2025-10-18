"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  FileText,
  Pill,
  TestTube,
  Package,
  Plus,
  Trash2,
  Download,
  AlertCircle,
} from "lucide-react";

interface Medicine {
  id: string;
  name: string;
  strength: string;
  dosage_instructions: string;
}

interface LabTest {
  id: string;
  name: string;
  price: number;
}

interface LabPackage {
  id: string;
  name: string;
  price: number;
}

interface PrescriptionDrug {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface PrescriptionLabTest {
  id: string;
  name: string;
  price: number;
}

export default function PrescriptionCreator({
  appointmentId,
  patient,
  onPrescriptionCreated,
}: {
  appointmentId: string;
  patient: {
    id: string;
    name: string;
    email: string;
    phone: string;
    profile?: {
      date_of_birth?: string;
      gender?: string;
      blood_group?: string;
      address?: string;
    };
  };
  onPrescriptionCreated: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form fields
  const [diagnosis, setDiagnosis] = useState("");
  const [instructions, setInstructions] = useState("");
  const [followUpInstructions, setFollowUpInstructions] = useState("");

  // Prescription items
  const [drugs, setDrugs] = useState<PrescriptionDrug[]>([]);
  const [labTests, setLabTests] = useState<PrescriptionLabTest[]>([]);

  // New item forms
  const [newDrug, setNewDrug] = useState({
    name: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: "",
  });

  const [newLabTest, setNewLabTest] = useState({
    name: "",
    price: 0,
  });

  const addDrug = () => {
    if (!newDrug.name || !newDrug.dosage) {
      setError("Please fill in required drug fields");
      return;
    }

    const drug: PrescriptionDrug = {
      id: Date.now().toString(),
      ...newDrug,
    };

    setDrugs([...drugs, drug]);
    setNewDrug({
      name: "",
      dosage: "",
      frequency: "",
      duration: "",
      instructions: "",
    });
  };

  const removeDrug = (id: string) => {
    setDrugs(drugs.filter((drug) => drug.id !== id));
  };

  const addLabTest = () => {
    if (!newLabTest.name) {
      setError("Please enter a lab test name");
      return;
    }

    const test: PrescriptionLabTest = {
      id: Date.now().toString(),
      ...newLabTest,
    };

    setLabTests([...labTests, test]);
    setNewLabTest({
      name: "",
      price: 0,
    });
  };

  const removeLabTest = (id: string) => {
    setLabTests(labTests.filter((test) => test.id !== id));
  };

  const createPrescription = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("Authentication required");
        setLoading(false);
        return;
      }

      // Prepare prescription data
      const prescriptionData = {
        appointment_id: appointmentId || null, // Allow null appointment_id
        patient_id: patient.id,
        diagnosis,
        instructions,
        follow_up_instructions: followUpInstructions,
        drugs: drugs.map((drug) => ({
          name: drug.name,
          dosage: drug.dosage,
          frequency: drug.frequency,
          duration: drug.duration,
          instructions: drug.instructions,
        })),
        lab_tests: labTests.map((test) => ({
          name: test.name,
          price: test.price,
        })),
      };

      const response = await fetch("/api/doctors/prescriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(prescriptionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create prescription");
      }

      const data = await response.json();
      setSuccess("Prescription created successfully!");

      // Generate PDF in background without blocking the UI
      generatePrescriptionPDF(data.prescription.id)
        .then(() => {
          console.log("PDF generated successfully");
        })
        .catch((pdfError) => {
          console.error("Error generating PDF:", pdfError);
          // Don't show error to user as prescription was created successfully
        });

      // Reset form after a short delay to allow PDF download to start
      setTimeout(() => {
        setDiagnosis("");
        setInstructions("");
        setFollowUpInstructions("");
        setDrugs([]);
        setLabTests([]);

        // Notify parent component
        onPrescriptionCreated();
      }, 1000);
    } catch (error) {
      console.error("Error creating prescription:", error);
      setError(
        error instanceof Error ? error.message : "Failed to create prescription"
      );
    } finally {
      setLoading(false);
    }
  };

  const generatePrescriptionPDF = async (prescriptionId: string) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      throw new Error("Authentication required");
    }

    const response = await fetch(
      `/api/prescriptions/${prescriptionId}/generate-pdf`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to generate prescription PDF");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prescription-${prescriptionId.substring(0, 8)}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-2xl rounded-3xl">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
          <CardTitle className="flex items-center text-2xl font-bold text-gray-900">
            <FileText className="h-6 w-6 mr-3 text-blue-600" />
            Create Prescription for {patient.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-2xl">
              {success}
            </div>
          )}

          {/* Patient Information */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <h3 className="font-bold text-gray-900 mb-2">
              Patient Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Name:</span>{" "}
                <span className="text-gray-900"> {patient.name}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Phone:</span>{" "}
                <span className="text-gray-900"> {patient.phone}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Email:</span>{" "}
                <span className="text-gray-900"> {patient.email}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Blood Group:</span>{" "}
                <span className="text-gray-900">
                  {" "}
                  {patient.profile?.blood_group || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Diagnosis */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Diagnosis *
            </label>
            <textarea
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              rows={3}
              className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 shadow-sm resize-none placeholder-gray-500"
              placeholder="Enter diagnosis"
            />
          </div>

          {/* Medications */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <Pill className="h-5 w-5 mr-2 text-green-600" />
                Medications
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={addDrug}
                className="rounded-full"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Drug
              </Button>
            </div>

            {/* Add Drug Form */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Drug Name *
                  </label>
                  <input
                    type="text"
                    value={newDrug.name}
                    onChange={(e) =>
                      setNewDrug({ ...newDrug, name: e.target.value })
                    }
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 shadow-sm placeholder-gray-500"
                    placeholder="Enter drug name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dosage *
                  </label>
                  <input
                    type="text"
                    value={newDrug.dosage}
                    onChange={(e) =>
                      setNewDrug({ ...newDrug, dosage: e.target.value })
                    }
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 shadow-sm placeholder-gray-500"
                    placeholder="e.g., 10mg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frequency
                  </label>
                  <input
                    type="text"
                    value={newDrug.frequency}
                    onChange={(e) =>
                      setNewDrug({ ...newDrug, frequency: e.target.value })
                    }
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 shadow-sm placeholder-gray-500"
                    placeholder="e.g., Twice daily"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={newDrug.duration}
                    onChange={(e) =>
                      setNewDrug({ ...newDrug, duration: e.target.value })
                    }
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 shadow-sm placeholder-gray-500"
                    placeholder="e.g., 7 days"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instructions
                  </label>
                  <input
                    type="text"
                    value={newDrug.instructions}
                    onChange={(e) =>
                      setNewDrug({ ...newDrug, instructions: e.target.value })
                    }
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 shadow-sm placeholder-gray-500"
                    placeholder="Additional instructions"
                  />
                </div>
              </div>
            </div>

            {/* Drug List */}
            {drugs.length > 0 && (
              <div className="space-y-3">
                {drugs.map((drug) => (
                  <div
                    key={drug.id}
                    className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-200 shadow-sm"
                  >
                    <div>
                      <h4 className="font-bold text-gray-900">{drug.name}</h4>
                      <p className="text-sm text-gray-600">
                        {drug.dosage} - {drug.frequency} - {drug.duration}
                      </p>
                      {drug.instructions && (
                        <p className="text-sm text-gray-500 mt-1">
                          {drug.instructions}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDrug(drug.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lab Tests */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <TestTube className="h-5 w-5 mr-2 text-blue-600" />
                Lab Tests & Packages
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={addLabTest}
                className="rounded-full"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Test
              </Button>
            </div>

            {/* Add Lab Test Form */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Test Name *
                  </label>
                  <input
                    type="text"
                    value={newLabTest.name}
                    onChange={(e) =>
                      setNewLabTest({ ...newLabTest, name: e.target.value })
                    }
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 shadow-sm placeholder-gray-500"
                    placeholder="Enter test name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (৳)
                  </label>
                  <input
                    type="number"
                    value={newLabTest.price}
                    onChange={(e) =>
                      setNewLabTest({
                        ...newLabTest,
                        price: Number(e.target.value),
                      })
                    }
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 shadow-sm placeholder-gray-500"
                    placeholder="Enter price"
                  />
                </div>
              </div>
            </div>

            {/* Lab Test List */}
            {labTests.length > 0 && (
              <div className="space-y-3">
                {labTests.map((test) => (
                  <div
                    key={test.id}
                    className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-200 shadow-sm"
                  >
                    <div>
                      <h4 className="font-bold text-gray-900">{test.name}</h4>
                      <p className="text-sm text-gray-600">
                        Price: ৳{test.price}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLabTest(test.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              General Instructions
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
              className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 shadow-sm resize-none placeholder-gray-500"
              placeholder="General instructions for the patient"
            />
          </div>

          {/* Follow-up Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Follow-up Instructions
            </label>
            <textarea
              value={followUpInstructions}
              onChange={(e) => setFollowUpInstructions(e.target.value)}
              rows={2}
              className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 shadow-sm resize-none placeholder-gray-500"
              placeholder="Follow-up instructions"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => {
                setDiagnosis("");
                setInstructions("");
                setFollowUpInstructions("");
                setDrugs([]);
                setLabTests([]);
              }}
            >
              Clear
            </Button>
            <Button
              onClick={createPrescription}
              disabled={loading || !diagnosis}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-full shadow-lg"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </div>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Create Prescription
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
