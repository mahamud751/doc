"use client";

import { useEffect, useState } from "react";

export default function TestAppointments() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("authToken");
        if (!token) {
          setError("No auth token found");
          return;
        }

        // Get doctor ID from localStorage or use a placeholder
        const userId = localStorage.getItem("userId");

        // Properly encode the status array as a JSON string
        const statusArray = ["CONFIRMED"];
        const statusParam = encodeURIComponent(JSON.stringify(statusArray));
        const url = `/api/appointments?doctorId=${userId}&status=${statusParam}`;

        console.log("Fetching from URL:", url);

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log("API Response:", result);
        setData(result);
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.message || "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Test Appointments Data</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
