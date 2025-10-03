// Simple test to verify the component can be imported
console.log("Testing DoctorVerificationTab component import...");

import("./src/components/admin/DoctorVerificationTab.tsx")
  .then(() => {
    console.log("✅ DoctorVerificationTab component imported successfully");
  })
  .catch((error) => {
    console.error(
      "❌ Failed to import DoctorVerificationTab component:",
      error
    );
  });
