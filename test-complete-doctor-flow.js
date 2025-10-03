const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

async function testCompleteDoctorFlow() {
  try {
    const timestamp = Date.now();
    const doctorEmail = `test.doctor.${timestamp}@example.com`;
    const doctorPassword = "TestPassword123!";

    // Test doctor registration
    console.log("Registering a new doctor...");
    const registerResponse = await fetch(
      "http://localhost:3000/api/auth/register",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `Dr. Test Doctor ${timestamp}`,
          email: doctorEmail,
          phone: `01789999${Math.floor(1000 + Math.random() * 9000)}`,
          password: doctorPassword,
          role: "DOCTOR",
        }),
      }
    );

    const registerData = await registerResponse.json();
    console.log("Registration response:", registerData);

    if (!registerResponse.ok) {
      console.log("❌ Doctor registration failed");
      return;
    }

    console.log("✅ Doctor registered successfully");

    // Try to login before verification (should fail)
    console.log("\nTrying to login before verification...");
    const loginResponse1 = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: doctorEmail,
        password: doctorPassword,
      }),
    });

    const loginData1 = await loginResponse1.json();
    console.log("Login response:", loginData1);

    if (loginResponse1.status === 403) {
      console.log("✅ Login correctly blocked before verification");
    } else {
      console.log("❌ Login should have been blocked before verification");
      return;
    }

    // Login as admin to approve the doctor
    console.log("\nLogging in as admin to approve doctor...");
    const adminLoginResponse = await fetch(
      "http://localhost:3000/api/auth/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "admin@mediconnect.com",
          password: "admin123",
        }),
      }
    );

    if (!adminLoginResponse.ok) {
      console.log("❌ Admin login failed");
      return;
    }

    const adminLoginData = await adminLoginResponse.json();
    const adminToken = adminLoginData.token;

    // Fetch pending doctors to find our doctor
    console.log("\nFetching pending doctors...");
    const pendingResponse = await fetch(
      "http://localhost:3000/api/admin/doctors/pending",
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
      }
    );

    if (!pendingResponse.ok) {
      console.log("❌ Failed to fetch pending doctors");
      return;
    }

    const pendingData = await pendingResponse.json();
    console.log(`Found ${pendingData.doctors?.length || 0} pending doctors`);

    // Find our doctor
    const ourPendingDoctor = pendingData.doctors?.find(
      (doc) => doc.email === doctorEmail
    );

    if (!ourPendingDoctor) {
      console.log("❌ Our doctor not found in pending list");
      return;
    }

    console.log("✅ Our doctor found in pending list");
    console.log("- Verification ID:", ourPendingDoctor.id);

    // Approve the doctor
    console.log("\nApproving the doctor...");
    const approveResponse = await fetch(
      "http://localhost:3000/api/admin/doctors/pending",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          verification_id: ourPendingDoctor.id,
          action: "APPROVED",
        }),
      }
    );

    if (!approveResponse.ok) {
      console.log("❌ Doctor approval failed");
      return;
    }

    const approveData = await approveResponse.json();
    console.log("✅ Doctor approved successfully");
    console.log("- Message:", approveData.message);

    // Wait a moment for the approval to propagate
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Now try to login again (should succeed)
    console.log("\nTrying to login after approval...");
    const loginResponse2 = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: doctorEmail,
        password: doctorPassword,
      }),
    });

    const loginData2 = await loginResponse2.json();
    console.log("Login response:", loginData2);

    if (loginResponse2.ok) {
      console.log("✅ Login successful after approval!");
      console.log("- Message:", loginData2.message);
      console.log("- User ID:", loginData2.user?.id);
      console.log("- User Role:", loginData2.user?.role);
    } else {
      console.log("❌ Login should have succeeded after approval");
      return;
    }

    console.log(
      "\n🎉 Complete doctor registration and approval flow working correctly!"
    );
  } catch (error) {
    console.error("Error:", error);
  }
}

testCompleteDoctorFlow();
