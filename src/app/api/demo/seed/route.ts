import { hashPassword } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST() {
  try {
    // Create demo users
    const hashedPassword = await hashPassword("password123");

    // Create demo patient
    const patient = await prisma.user.upsert({
      where: { email: "patient@demo.com" },
      update: {},
      create: {
        email: "patient@demo.com",
        phone: "+1234567890",
        password_hash: hashedPassword,
        name: "John Patient",
        role: "PATIENT",
        is_verified: true,
        patient_profile: {
          create: {
            date_of_birth: new Date("1990-01-01"),
            gender: "MALE",
            address: "123 Main St, Anytown, ST 12345",
            blood_group: "O+",
            allergies: ["Peanuts"],
            medical_history: "No significant history",
          },
        },
      },
      include: {
        patient_profile: true,
      },
    });

    // Create demo doctor
    const doctor = await prisma.user.upsert({
      where: { email: "doctor@demo.com" },
      update: {},
      create: {
        email: "doctor@demo.com",
        phone: "+1234567891",
        password_hash: hashedPassword,
        name: "Dr. Sarah Wilson",
        role: "DOCTOR",
        is_verified: true,
        doctor_profile: {
          create: {
            medical_license: "MD12345",
            specialties: ["Cardiology", "Internal Medicine"],
            qualifications: ["MBBS", "MD Cardiology"],
            experience_years: 12,
            consultation_fee: 150,
            languages: ["English", "Spanish"],
            bio: "Experienced cardiologist with over 12 years of practice",
            is_available_online: true,
            rating: 4.8,
            total_reviews: 234,
            verification: {
              create: {
                status: "APPROVED",
                reviewed_at: new Date(),
                notes: "All documents verified",
              },
            },
          },
        },
      },
      include: {
        doctor_profile: {
          include: {
            verification: true,
          },
        },
      },
    });

    // Create demo admin
    const admin = await prisma.user.upsert({
      where: { email: "admin@demo.com" },
      update: {},
      create: {
        email: "admin@demo.com",
        phone: "+1234567892",
        password_hash: hashedPassword,
        name: "Admin User",
        role: "ADMIN",
        is_verified: true,
      },
    });

    // Create demo appointment
    const appointment = await prisma.appointment.create({
      data: {
        patient_id: patient.id,
        doctor_id: doctor.id,
        scheduled_at: new Date(Date.now() + 3600000), // 1 hour from now
        meeting_type: "VIDEO",
        status: "CONFIRMED",
        meeting_token: `demo_channel_${Date.now()}`,
        meeting_link: `/video-consultation`,
        symptoms: "Chest pain and shortness of breath",
        notes: "Patient reports symptoms started yesterday",
      },
    });

    // Create demo medicines
    const medicines = await prisma.medicine.createMany({
      data: [
        {
          name: "Paracetamol",
          generic_name: "Acetaminophen",
          manufacturer: "PharmaCorp Ltd",
          category: "Pain Relief",
          strength: "500mg",
          unit_price: 2.5,
          stock_quantity: 500,
          prescription_required: false,
          description: "Pain reliever and fever reducer",
          side_effects: "Nausea, stomach upset (rare)",
          contraindications: "Liver disease, alcohol dependency",
          dosage_instructions: "Take 1-2 tablets every 4-6 hours as needed",
        },
        {
          name: "Amoxicillin",
          generic_name: "Amoxicillin",
          manufacturer: "MediGen Pharma",
          category: "Antibiotic",
          strength: "250mg",
          unit_price: 8.75,
          stock_quantity: 200,
          prescription_required: true,
          description: "Broad-spectrum antibiotic",
          side_effects: "Diarrhea, nausea, skin rash",
          contraindications: "Penicillin allergy",
          dosage_instructions: "Take as prescribed by physician",
        },
      ],
      skipDuplicates: true,
    });

    return NextResponse.json({
      message: "Demo data created successfully",
      data: {
        patient: { id: patient.id, email: patient.email },
        doctor: { id: doctor.id, email: doctor.email },
        admin: { id: admin.id, email: admin.email },
        appointment: { id: appointment.id },
        medicines: medicines.count,
      },
    });
  } catch (error) {
    console.error("Error creating demo data:", error);
    return NextResponse.json(
      { error: "Failed to create demo data" },
      { status: 500 }
    );
  }
}
