const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

async function testDynamicRoute() {
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
    console.log(`\nTesting dynamic route with doctor ID: ${doctorId}`);

    // Test fetching doctor using dynamic route
    console.log("\nFetching doctor using dynamic route...");
    const doctorResponse = await fetch(
      `http://localhost:3000/api/admin/doctors/${doctorId}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!doctorResponse.ok) {
      const errorData = await doctorResponse.json();
      console.log("Failed to fetch doctor via dynamic route:", errorData);
      return;
    }

    const doctorData = await doctorResponse.json();
    console.log("Dynamic route fetch successful!");
    console.log("Doctor data:", doctorData.doctor);

    console.log("\n🎉 Dynamic route test completed successfully!");
  } catch (error) {
    console.error("Error:", error);
  }
}

testDynamicRoute();
