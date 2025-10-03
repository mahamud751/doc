const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

async function testCompleteVerificationFlow() {
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

    // Fetch pending doctors to find our newly created doctor
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

    // Debug: Print all pending doctors with their IDs
    console.log("\nDebug: All pending doctors:");
    if (pendingData.doctors) {
      pendingData.doctors.forEach((doc, index) => {
        console.log(
          `${index + 1}. ${doc.name} (User ID: ${
            doc.doctor_id
          }, Verification ID: ${doc.id})`
        );
      });
    }

    // Find our doctor in the pending list using the profile ID (doctor_id field)
    let ourDoctor = pendingData.doctors?.find(
      (doc) => doc.doctor_id === profileId
    );

    // If not found, wait a bit more and try again
    if (!ourDoctor) {
      console.log("Doctor not found, waiting more and retrying...");
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const pendingResponseRetry = await fetch(
        "http://localhost:3000/api/admin/doctors/pending",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (pendingResponseRetry.ok) {
        const pendingDataRetry = await pendingResponseRetry.json();
        console.log(
          `Found ${
            pendingDataRetry.doctors?.length || 0
          } pending doctors on retry`
        );

        // Debug: Print all pending doctors on retry
        console.log("\nDebug: All pending doctors on retry:");
        if (pendingDataRetry.doctors) {
          pendingDataRetry.doctors.forEach((doc, index) => {
            console.log(
              `${index + 1}. ${doc.name} (User ID: ${
                doc.doctor_id
              }, Verification ID: ${doc.id})`
            );
          });
        }

        ourDoctor = pendingDataRetry.doctors?.find(
          (doc) => doc.doctor_id === profileId
        );
      }
    }

    if (!ourDoctor) {
      console.log("❌ Our doctor not found in pending list");
      return;
    }

    console.log("✅ Our doctor found in pending list");
    console.log("- Name:", ourDoctor.name);
    console.log("- Verification ID:", ourDoctor.id);

    // Approve the doctor
    console.log("\nApproving the doctor...");
    const verifyResponse = await fetch(
      "http://localhost:3000/api/admin/doctors/pending",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          verification_id: ourDoctor.id,
          action: "APPROVED",
        }),
      }
    );

    if (!verifyResponse.ok) {
      const errorData = await verifyResponse.json();
      console.log("❌ Doctor verification failed:", errorData);
      return;
    }

    const verifyData = await verifyResponse.json();
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

    console.log("\n🎉 Complete verification flow test completed successfully!");
  } catch (error) {
    console.error("Error:", error);
  }
}

testCompleteVerificationFlow();
