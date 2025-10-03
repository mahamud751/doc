// Simple test to verify the component can be imported and rendered
console.log("Testing DoctorVerificationTab component import...");

// Since this is a React component, we'll just test the import
import("./src/components/admin/DoctorVerificationTab.tsx")
  .then((module) => {
    console.log("✅ DoctorVerificationTab component imported successfully");
    console.log("Component:", module.default);
  })
  .catch((error) => {
    console.error(
      "❌ Failed to import DoctorVerificationTab component:",
      error
    );
  });
