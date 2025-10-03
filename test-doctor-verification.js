const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

async function testDoctorVerification() {
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

    // Test fetching pending doctors
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

    if (pendingData.doctors && pendingData.doctors.length > 0) {
      const doctorToVerify = pendingData.doctors[0];
      console.log(`\nVerifying doctor: ${doctorToVerify.name}`);

      // Test approving a doctor
      const verifyResponse = await fetch(
        "http://localhost:3000/api/admin/doctors/pending",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            verification_id: doctorToVerify.id,
            action: "APPROVED",
          }),
        }
      );

      if (verifyResponse.ok) {
        const verifyData = await verifyResponse.json();
        console.log("✅ Doctor verification successful:", verifyData.message);
      } else {
        const errorData = await verifyResponse.json();
        console.log("❌ Doctor verification failed:", errorData);
      }
    } else {
      console.log("No pending doctors to verify");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

testDoctorVerification();
