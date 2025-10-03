"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LabTestsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.push("/lab-items");
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-3xl shadow-2xl mb-6 mx-auto w-24 h-24 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
        <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Redirecting to Lab Items...
        </h3>
        <p className="text-gray-600 mt-2">Please wait while we redirect you</p>
      </div>
    </div>
  );
}
