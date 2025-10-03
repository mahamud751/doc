const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

async function testDoctorManagementVerification() {
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

    // Create a new doctor
    console.log("\nCreating a new doctor...");
    const timestamp = Date.now();
    const doctorResponse = await fetch(
      "http://localhost:3000/api/admin/doctors",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: `Dr. Test Doctor ${timestamp}`,
          email: `test.doctor.${timestamp}@example.com`,
          phone: `01789999${Math.floor(1000 + Math.random() * 9000)}`,
          medical_license: `ML${timestamp}`,
          specialties: ["Cardiology", "Orthopedics"],
          qualifications: ["MBBS", "MD"],
          experience_years: 5,
          consultation_fee: 150,
          languages: ["English", "Hindi"],
          bio: "Test doctor for verification flow",
        }),
      }
    );

    const doctorData = await doctorResponse.json();
    console.log("Doctor creation response:", doctorData);

    if (!doctorData.success) {
      console.log("❌ Doctor creation failed:", doctorData.error);
      return;
    }

    console.log("✅ Doctor created successfully");
    const userId = doctorData.doctor.id;
    const profileId = doctorData.doctor.profile_id;
    console.log("Created user ID:", userId);
    console.log("Created profile ID:", profileId);

    // Wait a moment for the doctor to be fully created
    console.log("Waiting for doctor to appear in pending list...");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Fetch all doctors to find our newly created doctor
    console.log("\nFetching all doctors...");
    const doctorsResponse = await fetch(
      "http://localhost:3000/api/admin/doctors?status=all",
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!doctorsResponse.ok) {
      const errorData = await doctorsResponse.json();
      console.log("Failed to fetch doctors:", errorData);
      return;
    }

    const doctorsData = await doctorsResponse.json();
    console.log(`Found ${doctorsData.doctors?.length || 0} doctors`);

    // Find our doctor in the doctors list
    const ourDoctor = doctorsData.doctors?.find((doc) => doc.id === userId);

    if (!ourDoctor) {
      console.log("❌ Our doctor not found in doctors list");
      return;
    }

    console.log("✅ Our doctor found in doctors list");
    console.log("- Name:", ourDoctor.name);
    console.log("- User ID:", ourDoctor.id);
    console.log("- Profile ID:", ourDoctor.profile?.id);
    console.log(
      "- Verification Status:",
      ourDoctor.profile?.verification_status
    );

    // Check if doctor is pending verification
    if (ourDoctor.profile?.verification_status !== "PENDING") {
      console.log("Doctor is not in pending verification status");
      return;
    }

    console.log(
      "\nDoctor is pending verification. Testing approve/reject functionality..."
    );

    // Fetch pending doctors to get the verification ID
    console.log("\nFetching pending doctors...");
    const pendingResponse = await fetch(
      "http://localhost:3000/api/admin/doctors/pending",
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!pendingResponse.ok) {
      const errorData = await pendingResponse.json();
      console.log("Failed to fetch pending doctors:", errorData);
      return;
    }

    const pendingData = await pendingResponse.json();
    console.log(`Found ${pendingData.doctors?.length || 0} pending doctors`);

    // Find our doctor in the pending list
    const ourPendingDoctor = pendingData.doctors?.find(
      (doc) => doc.doctor_id === profileId
    );

    if (!ourPendingDoctor) {
      console.log("❌ Our doctor not found in pending list");
      return;
    }

    console.log("✅ Our doctor found in pending list");
    console.log("- Verification ID:", ourPendingDoctor.id);

    // Test the verification functionality that would be used in DoctorManagement component
    console.log("\nTesting verification via DoctorManagement approach...");

    // This simulates what handleVerifyDoctor does in DoctorManagement component
    const verificationResponse = await fetch(
      "http://localhost:3000/api/admin/doctors/pending",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          verification_id: ourPendingDoctor.id,
          action: "APPROVED",
        }),
      }
    );

    if (!verificationResponse.ok) {
      const errorData = await verificationResponse.json();
      console.log("❌ Doctor verification failed:", errorData);
      return;
    }

    const verifyData = await verificationResponse.json();
    console.log("✅ Doctor verification successful:", verifyData.message);

    // Verify the doctor is no longer in the pending list
    console.log("\nChecking if doctor is still in pending list...");
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const pendingResponse2 = await fetch(
      "http://localhost:3000/api/admin/doctors/pending",
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!pendingResponse2.ok) {
      const errorData = await pendingResponse2.json();
      console.log("Failed to fetch pending doctors:", errorData);
      return;
    }

    const pendingData2 = await pendingResponse2.json();
    const ourDoctorStillPending = pendingData2.doctors?.find(
      (doc) => doc.doctor_id === profileId
    );

    if (ourDoctorStillPending) {
      console.log("❌ Doctor still appears in pending list");
    } else {
      console.log("✅ Doctor no longer appears in pending list");
    }

    // Verify the doctor is now active
    console.log("\nChecking if doctor is now active...");
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const doctorsResponse2 = await fetch(
      "http://localhost:3000/api/admin/doctors?status=all",
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!doctorsResponse2.ok) {
      const errorData = await doctorsResponse2.json();
      console.log("Failed to fetch doctors:", errorData);
      return;
    }

    const doctorsData2 = await doctorsResponse2.json();
    const ourActiveDoctor = doctorsData2.doctors?.find(
      (doc) => doc.id === userId
    );

    if (ourActiveDoctor && ourActiveDoctor.is_active) {
      console.log("✅ Doctor is now active");
      console.log("- Active Status:", ourActiveDoctor.is_active);
      console.log(
        "- Verification Status:",
        ourActiveDoctor.profile?.verification_status
      );
    } else {
      console.log("❌ Doctor is not active");
    }

    console.log(
      "\n🎉 DoctorManagement verification test completed successfully!"
    );
  } catch (error) {
    console.error("Error:", error);
  }
}

testDoctorManagementVerification();
