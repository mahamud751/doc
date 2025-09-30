"use client";

import { useState } from "react";
import { X, Plus, Trash2, Download, Send, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Medicine {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface PrescriptionData {
  patientId: string;
  patientName: string;
  appointmentId: string;
  diagnosis: string;
  symptoms: string;
  medicines: Medicine[];
  followUpDate?: string;
  generalInstructions: string;
}

interface PrescriptionCreatorProps {
  patientId: string;
  patientName: string;
  appointmentId: string;
  onClose: () => void;
  onSave: (prescription: PrescriptionData) => void;
}

export default function PrescriptionCreator({
  patientId,
  patientName,
  appointmentId,
  onClose,
  onSave,
}: PrescriptionCreatorProps) {
  const [prescription, setPrescription] = useState<PrescriptionData>({
    patientId,
    patientName,
    appointmentId,
    diagnosis: "",
    symptoms: "",
    medicines: [],
    followUpDate: "",
    generalInstructions: "",
  });

  const [currentMedicine, setCurrentMedicine] = useState<Medicine>({
    id: "",
    name: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: "",
  });

  // Mock medicine database for autocomplete
  const availableMedicines = [
    { name: "Paracetamol 500mg", category: "Pain Relief" },
    { name: "Amoxicillin 250mg", category: "Antibiotic" },
    { name: "Ibuprofen 400mg", category: "Anti-inflammatory" },
    { name: "Omeprazole 20mg", category: "Acid Reducer" },
    { name: "Metformin 500mg", category: "Diabetes" },
    { name: "Amlodipine 5mg", category: "Blood Pressure" },
    { name: "Atorvastatin 10mg", category: "Cholesterol" },
    { name: "Aspirin 75mg", category: "Blood Thinner" },
  ];

  const frequencyOptions = [
    "Once daily",
    "Twice daily",
    "Three times daily",
    "Four times daily",
    "Every 8 hours",
    "Every 12 hours",
    "As needed",
  ];

  const durationOptions = [
    "3 days",
    "5 days",
    "7 days",
    "10 days",
    "14 days",
    "21 days",
    "1 month",
    "3 months",
    "Until finished",
  ];

  const addMedicine = () => {
    if (
      currentMedicine.name &&
      currentMedicine.dosage &&
      currentMedicine.frequency
    ) {
      const newMedicine = {
        ...currentMedicine,
        id: Date.now().toString(),
      };
      setPrescription((prev) => ({
        ...prev,
        medicines: [...prev.medicines, newMedicine],
      }));
      setCurrentMedicine({
        id: "",
        name: "",
        dosage: "",
        frequency: "",
        duration: "",
        instructions: "",
      });
    }
  };

  const removeMedicine = (id: string) => {
    setPrescription((prev) => ({
      ...prev,
      medicines: prev.medicines.filter((med) => med.id !== id),
    }));
  };

  const handleSave = () => {
    if (prescription.diagnosis && prescription.medicines.length > 0) {
      onSave(prescription);
    }
  };

  const generatePDF = () => {
    // Mock PDF generation - in real implementation, use libraries like jsPDF or react-pdf
    const prescriptionText = `
PRESCRIPTION

Patient: ${prescription.patientName}
Date: ${new Date().toLocaleDateString()}
Appointment ID: ${prescription.appointmentId}

DIAGNOSIS: ${prescription.diagnosis}
SYMPTOMS: ${prescription.symptoms}

MEDICATIONS:
${prescription.medicines
  .map(
    (med) => `
- ${med.name}
  Dosage: ${med.dosage}
  Frequency: ${med.frequency}
  Duration: ${med.duration}
  Instructions: ${med.instructions}
`
  )
  .join("")}

GENERAL INSTRUCTIONS:
${prescription.generalInstructions}

Follow-up Date: ${prescription.followUpDate || "As needed"}

Doctor's Signature: _________________
    `;

    // Create downloadable text file (replace with PDF in real implementation)
    const blob = new Blob([prescriptionText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prescription-${patientName}-${
      new Date().toISOString().split("T")[0]
    }.txt`;
    a.click();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <FileText className="text-blue-600" size={24} />
            <div>
              <h2 className="text-xl font-semibold">Create Prescription</h2>
              <p className="text-gray-600">Patient: {patientName}</p>
            </div>
          </div>
          <Button onClick={onClose} variant="ghost">
            <X size={20} />
          </Button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Diagnosis and Symptoms */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Diagnosis *
              </label>
              <textarea
                value={prescription.diagnosis}
                onChange={(e) =>
                  setPrescription((prev) => ({
                    ...prev,
                    diagnosis: e.target.value,
                  }))
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Enter primary diagnosis..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Symptoms
              </label>
              <textarea
                value={prescription.symptoms}
                onChange={(e) =>
                  setPrescription((prev) => ({
                    ...prev,
                    symptoms: e.target.value,
                  }))
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Enter observed symptoms..."
              />
            </div>
          </div>

          {/* Add Medicine Section */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium mb-4">Add Medicine</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medicine Name *
                </label>
                <select
                  value={currentMedicine.name}
                  onChange={(e) =>
                    setCurrentMedicine((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select medicine...</option>
                  {availableMedicines.map((med, index) => (
                    <option key={index} value={med.name}>
                      {med.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dosage *
                </label>
                <input
                  type="text"
                  value={currentMedicine.dosage}
                  onChange={(e) =>
                    setCurrentMedicine((prev) => ({
                      ...prev,
                      dosage: e.target.value,
                    }))
                  }
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 1 tablet"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frequency *
                </label>
                <select
                  value={currentMedicine.frequency}
                  onChange={(e) =>
                    setCurrentMedicine((prev) => ({
                      ...prev,
                      frequency: e.target.value,
                    }))
                  }
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select frequency...</option>
                  {frequencyOptions.map((freq, index) => (
                    <option key={index} value={freq}>
                      {freq}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration
                </label>
                <select
                  value={currentMedicine.duration}
                  onChange={(e) =>
                    setCurrentMedicine((prev) => ({
                      ...prev,
                      duration: e.target.value,
                    }))
                  }
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select duration...</option>
                  {durationOptions.map((dur, index) => (
                    <option key={index} value={dur}>
                      {dur}
                    </option>
                  ))}
                </select>
              </div>
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Special Instructions
                </label>
                <input
                  type="text"
                  value={currentMedicine.instructions}
                  onChange={(e) =>
                    setCurrentMedicine((prev) => ({
                      ...prev,
                      instructions: e.target.value,
                    }))
                  }
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Take with food, Before meals..."
                />
              </div>
            </div>
            <Button
              onClick={addMedicine}
              className="mt-4"
              disabled={
                !currentMedicine.name ||
                !currentMedicine.dosage ||
                !currentMedicine.frequency
              }
            >
              <Plus size={16} className="mr-2" />
              Add Medicine
            </Button>
          </div>

          {/* Medicine List */}
          {prescription.medicines.length > 0 && (
            <div>
              <h3 className="font-medium mb-4">Prescribed Medicines</h3>
              <div className="space-y-3">
                {prescription.medicines.map((medicine) => (
                  <div
                    key={medicine.id}
                    className="border border-gray-200 rounded-lg p-4 flex justify-between items-start"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {medicine.name}
                      </h4>
                      <div className="mt-1 text-sm text-gray-600">
                        <p>
                          <strong>Dosage:</strong> {medicine.dosage}
                        </p>
                        <p>
                          <strong>Frequency:</strong> {medicine.frequency}
                        </p>
                        {medicine.duration && (
                          <p>
                            <strong>Duration:</strong> {medicine.duration}
                          </p>
                        )}
                        {medicine.instructions && (
                          <p>
                            <strong>Instructions:</strong>{" "}
                            {medicine.instructions}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => removeMedicine(medicine.id)}
                      variant="ghost"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional Information */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Follow-up Date
              </label>
              <input
                type="date"
                value={prescription.followUpDate}
                onChange={(e) =>
                  setPrescription((prev) => ({
                    ...prev,
                    followUpDate: e.target.value,
                  }))
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                General Instructions
              </label>
              <textarea
                value={prescription.generalInstructions}
                onChange={(e) =>
                  setPrescription((prev) => ({
                    ...prev,
                    generalInstructions: e.target.value,
                  }))
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="General care instructions, lifestyle advice..."
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50 rounded-b-lg">
          <div className="text-sm text-gray-600">* Required fields</div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={generatePDF}
              variant="outline"
              disabled={
                !prescription.diagnosis || prescription.medicines.length === 0
              }
            >
              <Download size={16} className="mr-2" />
              Generate PDF
            </Button>
            <Button onClick={onClose} variant="outline">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                !prescription.diagnosis || prescription.medicines.length === 0
              }
            >
              <Send size={16} className="mr-2" />
              Save Prescription
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
