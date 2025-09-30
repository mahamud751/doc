import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, MeetingType } from "@prisma/client";
import { verifyJWT } from "@/lib/auth";

const prisma = new PrismaClient();

// Get appointments for a user
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyJWT(token);

    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const userRole = searchParams.get("role") || decoded.role;

    let whereClause: any = {};

    if (userRole === "PATIENT") {
      whereClause.patient_id = decoded.userId;
    } else if (userRole === "DOCTOR") {
      whereClause.doctor_id = decoded.userId;
    } else {
      return NextResponse.json({ error: "Invalid role" }, { status: 403 });
    }

    if (status) {
      whereClause.status = status;
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        scheduled_at: "desc",
      },
    });

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointments" },
      { status: 500 }
    );
  }
}

// Create new appointment
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyJWT(token);

    if (!decoded || decoded.role !== "PATIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      doctor_id,
      appointment_date,
      appointment_time,
      consultation_type,
      symptoms,
      notes,
    } = await request.json();

    if (!doctor_id || !appointment_date || !appointment_time) {
      return NextResponse.json(
        {
          error: "Doctor ID, appointment date, and time are required",
        },
        { status: 400 }
      );
    }

    // Check if doctor exists and is verified
    const doctor = await prisma.user.findUnique({
      where: {
        id: doctor_id,
        role: "DOCTOR",
      },
      include: {
        doctor_profile: {
          include: {
            verification: true,
          },
        },
      },
    });

    if (
      !doctor ||
      !doctor.doctor_profile ||
      doctor.doctor_profile.verification?.status !== "APPROVED"
    ) {
      return NextResponse.json(
        {
          error: "Doctor not found or not verified",
        },
        { status: 404 }
      );
    }

    // Get patient profile
    const patient = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        patient_profile: true,
      },
    });

    if (!patient || !patient.patient_profile) {
      return NextResponse.json(
        {
          error: "Patient profile not found",
        },
        { status: 404 }
      );
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        patient_id: decoded.userId,
        doctor_id: doctor_id,
        scheduled_at: new Date(`${appointment_date}T${appointment_time}`),
        meeting_type:
          (consultation_type?.toUpperCase() as MeetingType) ||
          MeetingType.VIDEO,
        symptoms: symptoms || "",
        notes: notes || "",
        status: "PENDING",
        // Generate unique channel name for video call
        meeting_token: `appointment_${Date.now()}_${
          decoded.userId
        }_${doctor_id}`,
        meeting_link: `/video-call/appointment_${Date.now()}_${
          decoded.userId
        }_${doctor_id}`,
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    console.error("Error creating appointment:", error);
    return NextResponse.json(
      { error: "Failed to create appointment" },
      { status: 500 }
    );
  }
}
