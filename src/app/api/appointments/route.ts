import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyAuthToken } from "@/lib/auth-utils";
import { emailService } from "@/lib/email-service";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuthToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const doctorId = searchParams.get("doctorId");
    const patientId = searchParams.get("patientId");
    const date = searchParams.get("date");

    const offset = (page - 1) * limit;

    const where: any = {};

    // If user is a doctor, they can only see their own appointments
    if (authResult.user.role === "DOCTOR") {
      where.doctor_id = authResult.user.id;
    } else if (doctorId) {
      where.doctor_id = doctorId;
    }

    if (patientId) where.patient_id = patientId;

    // Handle status filtering - can be a single status or multiple statuses
    if (status) {
      try {
        // Try to parse as JSON array first (for multiple statuses)
        const statusArray = JSON.parse(decodeURIComponent(status));
        if (Array.isArray(statusArray)) {
          where.status = { in: statusArray };
        } else if (typeof statusArray === "object" && statusArray.in) {
          where.status = statusArray;
        } else {
          where.status = status;
        }
      } catch (e) {
        // If parsing fails, treat as single status
        where.status = status;
      }
    }

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      where.scheduled_at = {
        gte: startDate,
        lt: endDate,
      };
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip: offset,
        take: limit,
        include: {
          doctor: {
            include: {
              doctor_profile: true,
            },
          },
          patient: true,
          slot: true,
        },
        orderBy: [{ scheduled_at: "asc" }],
      }),
      prisma.appointment.count({ where }),
    ]);

    return NextResponse.json({
      appointments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get appointments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuthToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const {
      doctorId,
      patientId,
      appointmentDate,
      appointmentTime,
      reason,
      type = "VIDEO",
    } = data;

    // Validate required fields
    if (!doctorId || !patientId || !appointmentDate || !appointmentTime) {
      return NextResponse.json(
        {
          error: "Doctor, patient, date, and time are required",
        },
        { status: 400 }
      );
    }

    // Check if doctor exists and is active
    const doctor = await prisma.user.findUnique({
      where: { id: doctorId, role: "DOCTOR" },
      include: {
        doctor_profile: {
          include: {
            availability_slots: {
              where: {
                is_available: true,
              },
            },
          },
        },
      },
    });

    if (!doctor || !doctor.is_active || !doctor.doctor_profile) {
      return NextResponse.json(
        { error: "Doctor not found or inactive" },
        { status: 400 }
      );
    }

    // Check if patient exists
    const patient = await prisma.user.findUnique({
      where: { id: patientId, role: "PATIENT" },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 400 });
    }

    // Check doctor availability for the requested time slot
    const requestedDateTime = new Date(`${appointmentDate}T${appointmentTime}`);

    // Find available slot for the requested time
    const availableSlot = doctor.doctor_profile.availability_slots.find(
      (slot) => {
        const slotStart = new Date(slot.start_time);
        const slotEnd = new Date(slot.end_time);
        return (
          requestedDateTime >= slotStart &&
          requestedDateTime < slotEnd &&
          !slot.is_booked
        );
      }
    );

    if (!availableSlot) {
      return NextResponse.json(
        {
          error: "Doctor is not available at the requested time",
        },
        { status: 400 }
      );
    }

    // Check for conflicting appointments
    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        doctor_id: doctorId,
        scheduled_at: requestedDateTime,
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
      },
    });

    if (conflictingAppointment) {
      return NextResponse.json(
        {
          error: "This time slot is already booked",
        },
        { status: 400 }
      );
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        doctor_id: doctorId,
        patient_id: patientId,
        scheduled_at: requestedDateTime,
        symptoms: reason || "",
        meeting_type: type,
        status: "PENDING",
        slot_id: availableSlot.id,
      },
      include: {
        doctor: {
          include: {
            doctor_profile: true,
          },
        },
        patient: true,
        slot: true,
      },
    });

    // Mark the slot as booked
    await prisma.availabilitySlot.update({
      where: { id: availableSlot.id },
      data: { is_booked: true },
    });

    // Send confirmation email to patient
    try {
      await emailService.sendAppointmentNotification(
        patient.email,
        patient.name,
        doctor.name,
        appointmentDate,
        appointmentTime,
        "confirmed"
      );
    } catch (emailError) {
      console.error(
        "Failed to send appointment confirmation email:",
        emailError
      );
    }

    return NextResponse.json(
      {
        appointment,
        message: "Appointment scheduled successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create appointment error:", error);
    return NextResponse.json(
      { error: "Failed to create appointment" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await verifyAuthToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { id, status, appointmentDate, appointmentTime, reason, notes } =
      data;

    if (!id) {
      return NextResponse.json(
        { error: "Appointment ID is required" },
        { status: 400 }
      );
    }

    // Get existing appointment
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        doctor: {
          include: {
            doctor_profile: true,
          },
        },
        patient: true,
        slot: true,
      },
    });

    if (!existingAppointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Check permissions - doctors can only update their own appointments
    if (
      authResult.user.role === "DOCTOR" &&
      existingAppointment.doctor_id !== authResult.user.id
    ) {
      return NextResponse.json(
        { error: "You can only update your own appointments" },
        { status: 403 }
      );
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (reason !== undefined) updateData.symptoms = reason;
    if (notes !== undefined) updateData.notes = notes;

    // Handle rescheduling
    if (appointmentDate && appointmentTime) {
      // Validate new time slot
      const newDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
      const conflictingAppointment = await prisma.appointment.findFirst({
        where: {
          doctor_id: existingAppointment.doctor_id,
          scheduled_at: newDateTime,
          status: {
            in: ["PENDING", "CONFIRMED"],
          },
          id: { not: id },
        },
      });

      if (conflictingAppointment) {
        return NextResponse.json(
          {
            error: "New time slot is already booked",
          },
          { status: 400 }
        );
      }

      updateData.scheduled_at = newDateTime;
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        doctor: {
          include: {
            doctor_profile: true,
          },
        },
        patient: true,
        slot: true,
      },
    });

    // Send notification email for status changes
    try {
      if (status === "CANCELLED") {
        await emailService.sendAppointmentNotification(
          existingAppointment.patient.email,
          existingAppointment.patient.name,
          existingAppointment.doctor.name,
          existingAppointment.scheduled_at.toISOString().split("T")[0],
          existingAppointment.scheduled_at
            .toTimeString()
            .split(" ")[0]
            .substring(0, 5),
          "cancelled"
        );
      } else if (appointmentDate && appointmentTime) {
        await emailService.sendAppointmentNotification(
          existingAppointment.patient.email,
          existingAppointment.patient.name,
          existingAppointment.doctor.name,
          appointmentDate,
          appointmentTime,
          "rescheduled"
        );
      } else if (status === "CONFIRMED") {
        await emailService.sendAppointmentNotification(
          existingAppointment.patient.email,
          existingAppointment.patient.name,
          existingAppointment.doctor.name,
          existingAppointment.scheduled_at.toISOString().split("T")[0],
          existingAppointment.scheduled_at
            .toTimeString()
            .split(" ")[0]
            .substring(0, 5),
          "confirmed"
        );
      }
    } catch (emailError) {
      console.error(
        "Failed to send appointment notification email:",
        emailError
      );
    }

    return NextResponse.json({
      appointment: updatedAppointment,
      message: "Appointment updated successfully",
    });
  } catch (error) {
    console.error("Update appointment error:", error);
    return NextResponse.json(
      { error: "Failed to update appointment" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await verifyAuthToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Appointment ID is required" },
        { status: 400 }
      );
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        doctor: {
          include: {
            doctor_profile: true,
          },
        },
        patient: true,
        slot: true,
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    await prisma.appointment.delete({
      where: { id },
    });

    // Send cancellation email
    try {
      await emailService.sendAppointmentNotification(
        appointment.patient.email,
        appointment.patient.name,
        appointment.doctor.name,
        appointment.scheduled_at.toISOString().split("T")[0],
        appointment.scheduled_at.toTimeString().split(" ")[0].substring(0, 5),
        "cancelled"
      );
    } catch (emailError) {
      console.error("Failed to send cancellation email:", emailError);
    }

    return NextResponse.json({ message: "Appointment deleted successfully" });
  } catch (error) {
    console.error("Delete appointment error:", error);
    return NextResponse.json(
      { error: "Failed to delete appointment" },
      { status: 500 }
    );
  }
}
