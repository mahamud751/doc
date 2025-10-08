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

  // Create individual lab tests
  const labTests = [
    {
      name: "Hemoglobin",
      code: "HGB",
      description: "Measures the amount of hemoglobin in blood",
      category: "Hematology",
      price: 15.0,
      sample_type: "Blood",
      preparation_required: false,
      preparation_instructions: "No special preparation required",
      reporting_time: "Same day",
      normal_range: "12.0-15.5 g/dL (Female), 13.5-17.5 g/dL (Male)",
    },
    {
      name: "Blood Glucose Fasting",
      code: "FBS",
      description: "Measures blood sugar levels after fasting",
      category: "Biochemistry",
      price: 20.0,
      sample_type: "Blood",
      preparation_required: true,
      preparation_instructions: "8-12 hours fasting required",
      reporting_time: "Same day",
      normal_range: "70-100 mg/dL",
    },
    {
      name: "Urine Routine",
      code: "UR",
      description: "Basic urine analysis",
      category: "Urine Test",
      price: 25.0,
      sample_type: "Urine",
      preparation_required: false,
      preparation_instructions: "First morning urine sample preferred",
      reporting_time: "Same day",
      normal_range: "Normal physical and chemical properties",
    },
    {
      name: "X-Ray Chest",
      code: "CXR",
      description: "Chest X-ray to examine lungs and heart",
      category: "Radiology",
      price: 50.0,
      sample_type: "X-Ray",
      preparation_required: false,
      preparation_instructions: "Remove metal objects from chest area",
      reporting_time: "1-2 hours",
      normal_range: "Normal lung fields and cardiac silhouette",
    },
  ];

  for (const labTest of labTests) {
    const existingTest = await prisma.labTest.findFirst({
      where: { name: labTest.name },
    });

    if (!existingTest) {
      await prisma.labTest.create({
        data: labTest,
      });
    }
  }

  console.log("✅ Sample lab tests created");

  // Create specialties
  const specialties = [
    {
      name: "Cardiology",
      description: "Heart and cardiovascular system specialists",
    },
    {
      name: "Pediatrics",
      description: "Medical care for infants, children, and adolescents",
    },
    {
      name: "Dermatology",
      description: "Skin, hair, and nail disorders",
    },
    {
      name: "Orthopedics",
      description: "Musculoskeletal system disorders",
    },
    {
      name: "Neurology",
      description: "Nervous system disorders",
    },
    {
      name: "Gynecology",
      description: "Women's reproductive health",
    },
    {
      name: "Psychiatry",
      description: "Mental health and behavioral disorders",
    },
    {
      name: "General Medicine",
      description: "Primary healthcare and general medical conditions",
    },
  ];

  for (const specialty of specialties) {
    const existingSpecialty = await prisma.specialty.findFirst({
      where: { name: specialty.name },
    });

    if (!existingSpecialty) {
      await prisma.specialty.create({
        data: specialty,
      });
    }
  }

  console.log("✅ Medical specialties created");

  // Create more doctors with different specialties
  const additionalDoctors = [
    {
      email: "dr.emma.davis@mediconnect.com",
      phone: "+1234567895",
      name: "Dr. Emma Davis",
      license: "MD123458",
      specialties: ["Dermatology", "Cosmetic Surgery"],
      qualifications: [
        "MBBS",
        "MD Dermatology",
        "Fellowship in Cosmetic Surgery",
      ],
      experience: 10,
      fee: 180,
      languages: ["English", "French"],
      bio: "Experienced dermatologist specializing in skin disorders and cosmetic procedures.",
      rating: 4.7,
      reviews: 156,
    },
    {
      email: "dr.james.rodriguez@mediconnect.com",
      phone: "+1234567896",
      name: "Dr. James Rodriguez",
      license: "MD123459",
      specialties: ["Orthopedics", "Sports Medicine"],
      qualifications: [
        "MBBS",
        "MS Orthopedics",
        "Fellowship in Sports Medicine",
      ],
      experience: 15,
      fee: 200,
      languages: ["English", "Spanish"],
      bio: "Orthopedic surgeon with expertise in sports injuries and joint replacement.",
      rating: 4.9,
      reviews: 298,
    },
    {
      email: "dr.priya.sharma@mediconnect.com",
      phone: "+1234567897",
      name: "Dr. Priya Sharma",
      license: "MD123460",
      specialties: ["Gynecology", "Obstetrics"],
      qualifications: ["MBBS", "MD Gynecology", "DGO"],
      experience: 12,
      fee: 160,
      languages: ["English", "Hindi"],
      bio: "Gynecologist and obstetrician providing comprehensive women's healthcare.",
      rating: 4.8,
      reviews: 210,
    },
  ];

  for (const doctorData of additionalDoctors) {
    const doctor = await prisma.user.upsert({
      where: { email: doctorData.email },
      update: {},
      create: {
        email: doctorData.email,
        phone: doctorData.phone,
        password_hash: doctorPassword,
        name: doctorData.name,
        role: "DOCTOR",
        is_verified: true,
        is_active: true,
      },
    });

    const doctorProfile = await prisma.doctorProfile.upsert({
      where: { user_id: doctor.id },
      update: {},
      create: {
        user_id: doctor.id,
        medical_license: doctorData.license,
        specialties: doctorData.specialties,
        qualifications: doctorData.qualifications,
        experience_years: doctorData.experience,
        consultation_fee: doctorData.fee,
        languages: doctorData.languages,
        bio: doctorData.bio,
        is_available_online: true,
        rating: doctorData.rating,
        total_reviews: doctorData.reviews,
      },
    });

    await prisma.doctorVerification.upsert({
      where: { doctor_id: doctorProfile.id },
      update: {},
      create: {
        doctor_id: doctorProfile.id,
        status: "APPROVED",
        reviewed_by: admin.id,
        reviewed_at: new Date(),
        notes: "All documents verified successfully",
      },
    });
  }

  console.log("✅ Additional doctors created");

  // Create more patients
  const additionalPatients = [
    {
      email: "jane.smith@example.com",
      phone: "+1234567898",
      name: "Jane Smith",
      dob: new Date("1985-08-22"),
      gender: "FEMALE" as const,
      address: "456 Oak Ave, Springfield, IL 62701",
      emergency: "+1234567899",
      bloodGroup: "A+",
      allergies: ["Aspirin", "Shellfish"],
      history: "Hypertension, managed with medication",
    },
    {
      email: "robert.johnson@example.com",
      phone: "+1234567900",
      name: "Robert Johnson",
      dob: new Date("1978-03-10"),
      gender: "MALE" as const,
      address: "789 Pine St, Chicago, IL 60601",
      emergency: "+1234567901",
      bloodGroup: "B-",
      allergies: [],
      history: "Diabetes Type 2, well controlled",
    },
  ];

  for (const patientData of additionalPatients) {
    const patient = await prisma.user.upsert({
      where: { email: patientData.email },
      update: {},
      create: {
        email: patientData.email,
        phone: patientData.phone,
        password_hash: patientPassword,
        name: patientData.name,
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
        date_of_birth: patientData.dob,
        gender: patientData.gender as any,
        address: patientData.address,
        emergency_contact: patientData.emergency,
        blood_group: patientData.bloodGroup,
        allergies: patientData.allergies,
        medical_history: patientData.history,
      },
    });
  }

  console.log("✅ Additional patients created");

  // Create some sample appointments
  const doctors = await prisma.user.findMany({
    where: { role: "DOCTOR" },
    include: { doctor_profile: true },
  });

  const patients = await prisma.user.findMany({
    where: { role: "PATIENT" },
  });

  if (doctors.length > 0 && patients.length > 0) {
    const sampleAppointments = [
      {
        patient_id: patients[0].id,
        doctor_id: doctors[0].id,
        status: "COMPLETED" as const,
        payment_status: "COMPLETED" as const,
        scheduled_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        started_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        ended_at: new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000
        ),
        duration_minutes: 30,
        symptoms: "Chest pain and shortness of breath",
        diagnosis: "Mild anxiety, recommended lifestyle changes",
        notes: "Patient responded well to consultation. Follow-up in 2 weeks.",
      },
      {
        patient_id: patients[0].id,
        doctor_id: doctors[1].id,
        status: "CONFIRMED" as const,
        payment_status: "COMPLETED" as const,
        scheduled_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        symptoms: "Persistent headaches",
      },
    ];

    for (const appointmentData of sampleAppointments) {
      await prisma.appointment.create({
        data: appointmentData,
      });
    }

    console.log("✅ Sample appointments created");
  }

  // Create system configurations
  const systemConfigs = [
    {
      key: "consultation_fee_min",
      value: { amount: 50, currency: "USD" },
      description: "Minimum consultation fee allowed",
    },
    {
      key: "consultation_fee_max",
      value: { amount: 500, currency: "USD" },
      description: "Maximum consultation fee allowed",
    },
    {
      key: "appointment_duration_default",
      value: { minutes: 30 },
      description: "Default appointment duration in minutes",
    },
    {
      key: "platform_commission",
      value: { percentage: 10 },
      description: "Platform commission percentage",
    },
  ];

  for (const config of systemConfigs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: config,
    });
  }

  console.log("✅ System configurations created");
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
