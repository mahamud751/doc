"use client";

import { Button } from "@/components/ui/Button";
import { useEffect, useState } from "react";

export default function DebugLocalStoragePage() {
  const [storageData, setStorageData] = useState<Record<string, string | null>>({});
  const [refreshCount, setRefreshCount] = useState(0);

  const checkLocalStorage = () => {
    const data = {
      authToken: localStorage.getItem("authToken"),
      userId: localStorage.getItem("userId"),
      userName: localStorage.getItem("userName"),
      userRole: localStorage.getItem("userRole"),
    };
    setStorageData(data);
    setRefreshCount(prev => prev + 1);
    console.log("🔍 LocalStorage Check:", data);
  };

  useEffect(() => {
    checkLocalStorage();
    
    // Check every second
    const interval = setInterval(checkLocalStorage, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔍 LocalStorage Debug</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Current LocalStorage Data (Refresh #{refreshCount})</h2>
          <div className="space-y-3">
            {Object.entries(storageData).map(([key, value]) => (
              <div key={key} className="flex items-center">
                <span className="font-medium w-32">{key}:</span>
                <span className={`ml-4 px-3 py-1 rounded ${value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {value ? `"${value}"` : "null"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Button onClick={checkLocalStorage} className="w-full">
            🔄 Refresh Check
          </Button>
          <Button 
            onClick={() => {
              localStorage.clear();
              checkLocalStorage();
            }}
            className="w-full bg-red-500 hover:bg-red-600"
          >
            🗑️ Clear LocalStorage
          </Button>
        </div>

        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">🧪 Quick Test</h3>
          <p className="text-sm text-gray-600 mb-4">
            This page automatically checks localStorage every second. If you see all green values, 
            the GlobalIncomingCallHandler should work. If you see red "null" values, you need to log in first.
          </p>
          <div className="flex gap-4">
            <Button 
              onClick={() => window.open('/auth/login', '_blank')}
              className="bg-blue-500 hover:bg-blue-600"
            >
              🔐 Open Login (New Tab)
            </Button>
            <Button 
              onClick={() => window.open('/patient/dashboard', '_blank')}
              className="bg-green-500 hover:bg-green-600"
            >
              🤒 Open Patient Dashboard (New Tab)
            </Button>
            <Button 
              onClick={() => window.open('/doctor/dashboard', '_blank')}
              className="bg-purple-500 hover:bg-purple-600"
            >
              👨‍⚕️ Open Doctor Dashboard (New Tab)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}