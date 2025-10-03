const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

async function testFetchSingleDoctor() {
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

    // Get a doctor ID to test with
    console.log("\nFetching list of doctors...");
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

    if (!doctorsData.doctors || doctorsData.doctors.length === 0) {
      console.log("No doctors found");
      return;
    }

    // Use the first doctor for testing
    const testDoctor = doctorsData.doctors[0];
    const doctorId = testDoctor.id;
    console.log(`\nTesting with doctor ID: ${doctorId}`);
    console.log(`Doctor name: ${testDoctor.name}`);
    console.log(`Doctor email: ${testDoctor.email}`);

    // Test fetching single doctor
    console.log("\nFetching single doctor by ID...");
    const singleDoctorResponse = await fetch(
      `http://localhost:3000/api/admin/doctors?id=${doctorId}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!singleDoctorResponse.ok) {
      const errorData = await singleDoctorResponse.json();
      console.log("Failed to fetch single doctor:", errorData);
      return;
    }

    const singleDoctorData = await singleDoctorResponse.json();
    console.log("Single doctor fetch successful!");
    console.log("Doctor data:", singleDoctorData.doctor);

    console.log("\n🎉 Single doctor fetch test completed successfully!");
  } catch (error) {
    console.error("Error:", error);
  }
}

testFetchSingleDoctor();
