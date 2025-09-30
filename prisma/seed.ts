import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const adminPassword = await hashPassword("admin123");
  const admin = await prisma.user.upsert({
    where: { email: "admin@mediconnect.com" },
    update: {},
    create: {
      email: "admin@mediconnect.com",
      phone: "+1234567890",
      password_hash: adminPassword,
      name: "Admin User",
      role: "ADMIN",
      is_verified: true,
      is_active: true,
    },
  });

  console.log("✅ Admin user created:", admin.email);

  // Create verified doctors
  const doctorPassword = await hashPassword("doctor123");

  const doctor1 = await prisma.user.upsert({
    where: { email: "sarah.wilson@mediconnect.com" },
    update: {},
    create: {
      email: "sarah.wilson@mediconnect.com",
      phone: "+1234567891",
      password_hash: doctorPassword,
      name: "Dr. Sarah Wilson",
      role: "DOCTOR",
      is_verified: true,
      is_active: true,
    },
  });

  const doctor1Profile = await prisma.doctorProfile.upsert({
    where: { user_id: doctor1.id },
    update: {},
    create: {
      user_id: doctor1.id,
      medical_license: "MD123456",
      specialties: ["Cardiology", "Internal Medicine"],
      qualifications: ["MBBS", "MD Cardiology", "FRCP"],
      experience_years: 12,
      consultation_fee: 150,
      languages: ["English", "Spanish"],
      bio: "Experienced cardiologist with over 12 years of practice. Specializes in heart disease prevention and treatment.",
      is_available_online: true,
      rating: 4.8,
      total_reviews: 234,
    },
  });

  await prisma.doctorVerification.upsert({
    where: { doctor_id: doctor1Profile.id },
    update: {},
    create: {
      doctor_id: doctor1Profile.id,
      status: "APPROVED",
      reviewed_by: admin.id,
      reviewed_at: new Date(),
      notes: "All documents verified successfully",
    },
  });

  const doctor2 = await prisma.user.upsert({
    where: { email: "michael.chen@mediconnect.com" },
    update: {},
    create: {
      email: "michael.chen@mediconnect.com",
      phone: "+1234567892",
      password_hash: doctorPassword,
      name: "Dr. Michael Chen",
      role: "DOCTOR",
      is_verified: true,
      is_active: true,
    },
  });

  const doctor2Profile = await prisma.doctorProfile.upsert({
    where: { user_id: doctor2.id },
    update: {},
    create: {
      user_id: doctor2.id,
      medical_license: "MD123457",
      specialties: ["Pediatrics", "General Medicine"],
      qualifications: ["MBBS", "DCH", "MD Pediatrics"],
      experience_years: 8,
      consultation_fee: 120,
      languages: ["English", "Mandarin"],
      bio: "Dedicated pediatrician with expertise in child healthcare and development.",
      is_available_online: true,
      rating: 4.9,
      total_reviews: 189,
    },
  });

  await prisma.doctorVerification.upsert({
    where: { doctor_id: doctor2Profile.id },
    update: {},
    create: {
      doctor_id: doctor2Profile.id,
      status: "APPROVED",
      reviewed_by: admin.id,
      reviewed_at: new Date(),
      notes: "All documents verified successfully",
    },
  });

  // Create sample patient
  const patientPassword = await hashPassword("patient123");
  const patient = await prisma.user.upsert({
    where: { email: "patient@example.com" },
    update: {},
    create: {
      email: "patient@example.com",
      phone: "+1234567893",
      password_hash: patientPassword,
      name: "John Doe",
      role: "PATIENT",
      is_verified: true,
      is_active: true,
    },
  });

  await prisma.patientProfile.upsert({
    where: { user_id: patient.id },
    update: {},
    create: {
      user_id: patient.id,
      date_of_birth: new Date("1990-05-15"),
      gender: "MALE",
      address: "123 Main St, City, State 12345",
      emergency_contact: "+1234567894",
      blood_group: "O+",
      allergies: ["Penicillin"],
      medical_history: "No significant medical history",
    },
  });

  console.log("✅ Sample doctors and patient created");

  // Create some medicines
  const medicines = [
    {
      name: "Paracetamol",
      generic_name: "Acetaminophen",
      manufacturer: "PharmaCorp",
      category: "Pain Relief",
      strength: "500mg",
      unit_price: 5.99,
      stock_quantity: 1000,
      prescription_required: false,
    },
    {
      name: "Amoxicillin",
      generic_name: "Amoxicillin",
      manufacturer: "AntibioticLab",
      category: "Antibiotics",
      strength: "250mg",
      unit_price: 12.5,
      stock_quantity: 500,
      prescription_required: true,
    },
    {
      name: "Lisinopril",
      generic_name: "Lisinopril",
      manufacturer: "CardioMed",
      category: "Cardiovascular",
      strength: "10mg",
      unit_price: 8.75,
      stock_quantity: 750,
      prescription_required: true,
    },
  ];

  for (const medicine of medicines) {
    const existingMedicine = await prisma.medicine.findFirst({
      where: { name: medicine.name },
    });

    if (!existingMedicine) {
      await prisma.medicine.create({
        data: medicine,
      });
    }
  }

  console.log("✅ Sample medicines created");

  // Create lab packages
  const labPackages = [
    {
      name: "Complete Blood Count (CBC)",
      description:
        "Comprehensive blood test including RBC, WBC, platelets, and hemoglobin levels",
      category: "Blood Test",
      price: 45.0,
      preparation_required: false,
      preparation_instructions: "Fasting not required",
      sample_type: "Blood",
      reporting_time: "1-2 days",
      tests_included: [
        "RBC Count",
        "WBC Count",
        "Platelet Count",
        "Hemoglobin",
        "Hematocrit",
      ],
      is_home_collection: true,
    },
    {
      name: "Lipid Profile",
      description: "Cholesterol and triglyceride levels assessment",
      category: "Blood Test",
      price: 35.0,
      preparation_required: true,
      preparation_instructions: "12-hour fasting required",
      sample_type: "Blood",
      reporting_time: "1 day",
      tests_included: ["Total Cholesterol", "HDL", "LDL", "Triglycerides"],
      is_home_collection: true,
    },
    {
      name: "Thyroid Function Test",
      description: "Comprehensive thyroid hormone evaluation",
      category: "Hormone Test",
      price: 55.0,
      preparation_required: false,
      preparation_instructions: "No special preparation required",
      sample_type: "Blood",
      reporting_time: "2-3 days",
      tests_included: ["TSH", "T3", "T4", "Free T4"],
      is_home_collection: true,
    },
  ];

  for (const labPackage of labPackages) {
    const existingPackage = await prisma.labPackage.findFirst({
      where: { name: labPackage.name },
    });

    if (!existingPackage) {
      await prisma.labPackage.create({
        data: labPackage,
      });
    }
  }

  console.log("✅ Sample lab packages created");
  console.log("🎉 Database seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
