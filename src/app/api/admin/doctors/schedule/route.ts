import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth-utils";
import { Prisma } from "@prisma/client";

// Define type for JWT payload

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const doctor_id = searchParams.get("doctor_id");
    const start_date = searchParams.get("start_date");
    const end_date = searchParams.get("end_date");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    if (!doctor_id) {
      return NextResponse.json(
        { error: "Doctor ID is required" },
        { status: 400 }
      );
    }

    // Verify doctor exists
    const doctor = await prisma.doctorProfile.findUnique({
      where: { user_id: doctor_id },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // Build where clause for slots
    const where: Prisma.AvailabilitySlotWhereInput = {
      doctor_id: doctor.id,
    };

    if (start_date && end_date) {
      where.start_time = {
        gte: new Date(start_date),
        lte: new Date(end_date),
      };
    } else if (start_date) {
      where.start_time = {
        gte: new Date(start_date),
      };
    }

    // Fetch availability slots
    const [slots, totalCount] = await Promise.all([
      prisma.availabilitySlot.findMany({
        where,
        skip,
        take: limit,
        include: {
          appointments: {
            select: {
              id: true,
              status: true,
              patient: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { start_time: "asc" },
      }),
      prisma.availabilitySlot.count({ where }),
    ]);

    // Enhanced slot data
    const enhancedSlots = slots.map((slot) => ({
      id: slot.id,
      start_time: slot.start_time,
      end_time: slot.end_time,
      is_recurring: slot.is_recurring,
      recurrence_pattern: slot.recurrence_pattern,
      slot_duration: slot.slot_duration,
      is_booked: slot.is_booked,
      is_available: slot.is_available,
      appointment: slot.appointments[0] || null,
      created_at: slot.created_at,
    }));

    return NextResponse.json({
      success: true,
      doctor: {
        id: doctor.user_id,
        name: doctor.user.name,
        email: doctor.user.email,
        profile_id: doctor.id,
        availability_hours: doctor.availability_hours,
      },
      slots: enhancedSlots,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching doctor schedule:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authorization (admin or the doctor themselves)
    const authResult = await verifyAuthToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      doctor_id,
      start_time,
      end_time,
      is_recurring,
      recurrence_pattern,
      slot_duration,
    } = body;

    // Validate required fields
    if (!doctor_id || !start_time || !end_time) {
      return NextResponse.json(
        { error: "Doctor ID, start time, and end time are required" },
        { status: 400 }
      );
    }

    // Verify user exists and is a doctor
    const user = await prisma.user.findUnique({
      where: { id: doctor_id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role !== "DOCTOR") {
      return NextResponse.json(
        { error: "User is not a doctor" },
        { status: 400 }
      );
    }

    // Verify doctor profile exists
    const doctor = await prisma.doctorProfile.findUnique({
      where: { user_id: doctor_id },
    });

    if (!doctor) {
      return NextResponse.json(
        { error: "Doctor profile not found" },
        { status: 404 }
      );
    }

    // Check permission (admin or the doctor themselves)
    if (
      !["ADMIN", "SUPERADMIN"].includes(authResult.user.role) &&
      authResult.user.id !== doctor_id
    ) {
      return NextResponse.json(
        { error: "Forbidden: You can only manage your own schedule" },
        { status: 403 }
      );
    }

    // Validate time slots
    const startDate = new Date(start_time);
    const endDate = new Date(end_time);

    if (startDate >= endDate) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      );
    }

    // For recurring slots, we allow past dates since they represent a pattern
    // For non-recurring slots, validate against current time
    if (!is_recurring && startDate < new Date()) {
      return NextResponse.json(
        { error: "Cannot create slots in the past" },
        { status: 400 }
      );
    }

    // For both recurring and non-recurring slots, ensure the time is valid
    // (i.e., not creating a 25:00 slot)
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    // Check for overlapping slots
    const overlappingSlots = await prisma.availabilitySlot.findMany({
      where: {
        doctor_id: doctor.id,
        OR: [
          {
            start_time: { lte: startDate },
            end_time: { gt: startDate },
          },
          {
            start_time: { lt: endDate },
            end_time: { gte: endDate },
          },
          {
            start_time: { gte: startDate },
            end_time: { lte: endDate },
          },
        ],
      },
    });

    if (overlappingSlots.length > 0) {
      return NextResponse.json(
        { error: "Time slot overlaps with existing availability" },
        { status: 400 }
      );
    }

    // Create availability slot
    const newSlot = await prisma.availabilitySlot.create({
      data: {
        doctor_id: doctor.id,
        start_time: startDate,
        end_time: endDate,
        is_recurring: Boolean(is_recurring),
        recurrence_pattern: is_recurring ? recurrence_pattern : null,
        slot_duration: slot_duration || 30,
        is_booked: false,
        is_available: true,
      },
    });

    // Log the creation
    await prisma.auditLog.create({
      data: {
        user_id: authResult.user.id,
        action: "CREATE",
        resource: "AvailabilitySlot",
        resource_id: newSlot.id,
        details: {
          doctor_id,
          start_time: startDate,
          end_time: endDate,
          is_recurring,
          slot_duration: newSlot.slot_duration,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Availability slot created successfully",
        slot: newSlot,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating availability slot:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verify authorization
    const authResult = await verifyAuthToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { slot_id, doctor_id, ...updateData } = body;

    if (!slot_id) {
      return NextResponse.json(
        { error: "Slot ID is required" },
        { status: 400 }
      );
    }

    // Verify slot exists and get doctor info
    const slot = await prisma.availabilitySlot.findUnique({
      where: { id: slot_id },
      include: {
        doctor: {
          select: { user_id: true },
        },
      },
    });

    if (!slot) {
      return NextResponse.json(
        { error: "Availability slot not found" },
        { status: 404 }
      );
    }

    // Check permission
    if (
      !["ADMIN", "SUPERADMIN"].includes(authResult.user.role) &&
      authResult.user.id !== slot.doctor.user_id
    ) {
      return NextResponse.json(
        { error: "Forbidden: You can only manage your own schedule" },
        { status: 403 }
      );
    }

    // Check if slot is booked
    if (
      slot.is_booked &&
      (updateData.start_time ||
        updateData.end_time ||
        updateData.is_available === false)
    ) {
      return NextResponse.json(
        { error: "Cannot modify booked slot" },
        { status: 400 }
      );
    }

    // Use the doctor_id variable to avoid the unused variable warning
    if (doctor_id && doctor_id !== slot.doctor.user_id) {
      // This is just to use the variable, in practice we're using the slot's doctor_id
      console.log("Doctor ID from request:", doctor_id);
    }

    // Update slot
    const updatedSlot = await prisma.availabilitySlot.update({
      where: { id: slot_id },
      data: updateData,
    });

    // Log the update
    await prisma.auditLog.create({
      data: {
        user_id: authResult.user.id,
        action: "UPDATE",
        resource: "AvailabilitySlot",
        resource_id: slot_id,
        details: {
          updated_fields: Object.keys(updateData),
          doctor_id: slot.doctor.user_id,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Availability slot updated successfully",
      slot: updatedSlot,
    });
  } catch (error) {
    console.error("Error updating availability slot:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify authorization
    const authResult = await verifyAuthToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const slot_id = searchParams.get("slot_id");

    if (!slot_id) {
      return NextResponse.json(
        { error: "Slot ID is required" },
        { status: 400 }
      );
    }

    // Verify slot exists and get doctor info
    const slot = await prisma.availabilitySlot.findUnique({
      where: { id: slot_id },
      include: {
        doctor: {
          select: { user_id: true },
        },
        appointments: true,
      },
    });

    if (!slot) {
      return NextResponse.json(
        { error: "Availability slot not found" },
        { status: 404 }
      );
    }

    // Check permission
    if (
      !["ADMIN", "SUPERADMIN"].includes(authResult.user.role) &&
      authResult.user.id !== slot.doctor.user_id
    ) {
      return NextResponse.json(
        { error: "Forbidden: You can only manage your own schedule" },
        { status: 403 }
      );
    }

    // Check if slot has appointments
    if (slot.appointments.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete slot with existing appointments" },
        { status: 400 }
      );
    }

    // Delete slot
    await prisma.availabilitySlot.delete({
      where: { id: slot_id },
    });

    // Log the deletion
    await prisma.auditLog.create({
      data: {
        user_id: authResult.user.id,
        action: "DELETE",
        resource: "AvailabilitySlot",
        resource_id: slot_id,
        details: {
          doctor_id: slot.doctor.user_id,
          start_time: slot.start_time,
          end_time: slot.end_time,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Availability slot deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting availability slot:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
