const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

async function testUpdateDoctorDynamic() {
  try {
    // First, login as admin to get a token
    console.log("Logging in as admin...");
    const loginResponse = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "admin@mediconnect.com",
        password: "admin123",
      }),
    });

    if (!loginResponse.ok) {
      const loginError = await loginResponse.json();
      console.log("Login failed:", loginError);
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log("Login successful. Token received.");

    // Use the doctor ID from your example
    const doctorId = "cmga1c7tz000diqeefhlwx57c";
    console.log(
      `\nTesting update via dynamic route with doctor ID: ${doctorId}`
    );

    // Test updating doctor using dynamic route
    console.log("\nUpdating doctor using dynamic route...");
    const updateResponse = await fetch(
      `http://localhost:3000/api/admin/doctors/${doctorId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_data: {
            name: "tumpa updated",
          },
          profile_data: {
            bio: "Updated bio for testing",
            experience_years: 5,
            consultation_fee: 150,
            specialties: ["Cardiology", "Orthopedics", "Dermatology"],
            languages: ["Bengali", "English"],
          },
        }),
      }
    );

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      console.log("Failed to update doctor via dynamic route:", errorData);
      return;
    }

    const updateData = await updateResponse.json();
    console.log("Dynamic route update successful!");
    console.log("Update response:", updateData);

    // Verify the update by fetching the doctor again
    console.log("\nVerifying update...");
    const verifyResponse = await fetch(
      `http://localhost:3000/api/admin/doctors/${doctorId}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!verifyResponse.ok) {
      const errorData = await verifyResponse.json();
      console.log("Failed to verify update:", errorData);
      return;
    }

    const verifyData = await verifyResponse.json();
    console.log("Verification successful!");
    console.log("Updated doctor name:", verifyData.doctor.name);
    console.log("Updated doctor bio:", verifyData.doctor.profile.bio);
    console.log(
      "Updated experience years:",
      verifyData.doctor.profile.experience_years
    );
    console.log(
      "Updated consultation fee:",
      verifyData.doctor.profile.consultation_fee
    );
    console.log("Updated specialties:", verifyData.doctor.profile.specialties);
    console.log("Updated languages:", verifyData.doctor.profile.languages);

    console.log("\n🎉 Dynamic route update test completed successfully!");
  } catch (error) {
    console.error("Error:", error);
  }
}

testUpdateDoctorDynamic();
