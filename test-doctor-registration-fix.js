const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

async function testDoctorRegistrationFix() {
  try {
    const timestamp = Date.now();
    const doctorEmail = `test.doctor.${timestamp}@example.com`;

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
          password: "TestPassword123!",
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
    console.log("- Message:", registerData.message);
    console.log("- Verified:", registerData.verified);
    console.log("- Status:", registerData.status);

    // Try to login before verification (should fail)
    console.log("\nTrying to login before verification...");
    const loginResponse = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: doctorEmail,
        password: "TestPassword123!",
      }),
    });

    const loginData = await loginResponse.json();
    console.log("Login response:", loginData);

    if (loginResponse.status === 403) {
      console.log("✅ Login correctly blocked before verification");
      console.log("- Error:", loginData.error);
      console.log("- Status:", loginData.status);
    } else {
      console.log("❌ Login should have been blocked before verification");
    }

    // Now let's verify the fix by checking the database directly
    console.log("\nLogging in as admin to check doctor status...");
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

    // Fetch all doctors to find our newly registered doctor
    console.log("\nFetching all doctors as admin...");
    const doctorsResponse = await fetch(
      "http://localhost:3000/api/admin/doctors?status=all",
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
      }
    );

    if (!doctorsResponse.ok) {
      console.log("❌ Failed to fetch doctors");
      return;
    }

    const doctorsData = await doctorsResponse.json();
    console.log(`Found ${doctorsData.doctors?.length || 0} doctors`);

    // Find our doctor
    const ourDoctor = doctorsData.doctors?.find(
      (doc) => doc.email === doctorEmail
    );

    if (!ourDoctor) {
      console.log("❌ Our doctor not found in doctors list");
      return;
    }

    console.log("✅ Our doctor found in doctors list");
    console.log("- Name:", ourDoctor.name);
    console.log("- Email:", ourDoctor.email);
    console.log("- Is Active:", ourDoctor.is_active);
    console.log("- Is Verified:", ourDoctor.is_verified);
    console.log(
      "- Profile Verification Status:",
      ourDoctor.profile?.verification_status
    );

    if (
      !ourDoctor.is_active &&
      !ourDoctor.is_verified &&
      ourDoctor.profile?.verification_status === "PENDING"
    ) {
      console.log(
        "✅ Doctor correctly set as inactive and pending verification"
      );
    } else {
      console.log("❌ Doctor status is not correct");
    }

    console.log("\n🎉 Doctor registration fix verification completed!");
  } catch (error) {
    console.error("Error:", error);
  }
}

testDoctorRegistrationFix();
