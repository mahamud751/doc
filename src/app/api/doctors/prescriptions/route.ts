import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJWT } from "@/lib/auth";

// Create a new prescription
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyJWT(token);

    if (!decoded || decoded.role !== "DOCTOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      appointment_id,
      patient_id,
      diagnosis,
      instructions,
      follow_up_instructions,
      drugs,
      lab_tests,
    } = body;

    // Validate required fields
    if (!patient_id || !diagnosis) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: patient_id and diagnosis are required",
        },
        { status: 400 }
      );
    }

    let validAppointmentId = appointment_id;

    // If no appointment_id is provided, we'll create a temporary one
    if (!appointment_id) {
      // Check if patient exists
      const patient = await prisma.user.findUnique({
        where: { id: patient_id },
      });

      if (!patient) {
        return NextResponse.json(
          { error: "Patient not found" },
          { status: 404 }
        );
      }

      // Create a temporary appointment for this prescription
      const tempAppointment = await prisma.appointment.create({
        data: {
          patient_id: patient_id,
          doctor_id: decoded.userId,
          status: "COMPLETED",
          payment_status: "COMPLETED",
          meeting_type: "CHAT",
          scheduled_at: new Date(),
          duration_minutes: 30,
          diagnosis: diagnosis,
        },
      });

      validAppointmentId = tempAppointment.id;
    } else {
      // Check if appointment exists and belongs to this doctor
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointment_id },
      });

      if (!appointment) {
        return NextResponse.json(
          { error: "Appointment not found" },
          { status: 404 }
        );
      }

      if (appointment.doctor_id !== decoded.userId) {
        return NextResponse.json(
          { error: "Unauthorized to create prescription for this appointment" },
          { status: 403 }
        );
      }
    }

    // Create prescription
    const prescription = await prisma.prescription.create({
      data: {
        appointment_id: validAppointmentId,
        doctor_id: decoded.userId,
        patient_id,
        diagnosis,
        instructions,
        follow_up_instructions,
        drugs: drugs || [],
      },
    });

    return NextResponse.json({
      success: true,
      message: "Prescription created successfully",
      prescription,
    });
  } catch (error) {
    console.error("Error creating prescription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Get doctor's prescriptions
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyJWT(token);

    if (!decoded || decoded.role !== "DOCTOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get prescriptions for this doctor
    const prescriptions = await prisma.prescription.findMany({
      where: {
        doctor_id: decoded.userId,
      },
      include: {
        appointment: {
          include: {
            patient: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                patient_profile: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      prescriptions,
    });
  } catch (error) {
    console.error("Error fetching prescriptions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
