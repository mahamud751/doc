import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Prisma, AppointmentStatus } from "@prisma/client";
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

    const whereClause: Prisma.AppointmentWhereInput = {};

    if (userRole === "PATIENT") {
      whereClause.patient_id = decoded.userId;
    } else if (userRole === "DOCTOR") {
      whereClause.doctor_id = decoded.userId;
    } else {
      return NextResponse.json({ error: "Invalid role" }, { status: 403 });
    }

    if (status) {
      whereClause.status = status as AppointmentStatus;
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
            patient_profile: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            doctor_profile: true,
          },
        },
        prescription: true,
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

    const { doctor_id, scheduled_at, meeting_type, symptoms, notes } =
      await request.json();

    if (!doctor_id || !scheduled_at) {
      return NextResponse.json(
        {
          error: "Doctor ID and scheduled time are required",
        },
        { status: 400 }
      );
    }

    // Check if doctor exists
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

    // Create appointment with video channel
    const channelName = `appointment_${Date.now()}_${
      decoded.userId
    }_${doctor_id}`;

    const appointment = await prisma.appointment.create({
      data: {
        patient_id: decoded.userId,
        doctor_id: doctor_id,
        scheduled_at: new Date(scheduled_at),
        meeting_type: meeting_type || "VIDEO",
        symptoms: symptoms || "",
        notes: notes || "",
        status: "PENDING",
        meeting_link: `/video-call/${channelName}`,
        meeting_token: channelName, // Store channel name for Agora
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
            doctor_profile: true,
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

// Update appointment status
export async function PATCH(request: NextRequest) {
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

    const { appointment_id, status, notes } = await request.json();

    if (!appointment_id || !status) {
      return NextResponse.json(
        {
          error: "Appointment ID and status are required",
        },
        { status: 400 }
      );
    }

    // Check if user has permission to update this appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointment_id },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    if (
      appointment.patient_id !== decoded.userId &&
      appointment.doctor_id !== decoded.userId
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointment_id },
      data: {
        status,
        notes: notes || appointment.notes,
        ...(status === "IN_PROGRESS" && { started_at: new Date() }),
        ...(status === "COMPLETED" && { ended_at: new Date() }),
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
            doctor_profile: true,
          },
        },
      },
    });

    return NextResponse.json({ appointment: updatedAppointment });
  } catch (error) {
    console.error("Error updating appointment:", error);
    return NextResponse.json(
      { error: "Failed to update appointment" },
      { status: 500 }
    );
  }
}
