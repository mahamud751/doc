"use client";

import PatientListWithAppointments from "@/components/patient/PatientListWithAppointments";
import NavigationHeader from "@/components/NavigationHeader";

export default function PatientListPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <NavigationHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PatientListWithAppointments />
      </div>
    </div>
  );
}