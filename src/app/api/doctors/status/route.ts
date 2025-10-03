import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth-utils";

// Simple doctor status tracking without Socket.IO
// This can be enhanced with Socket.IO later

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";

    // Build where clause
    const where: any = {
      role: "DOCTOR",
      is_verified: true,
    };

    if (status === "online") {
      where.is_active = true;
      where.doctor_profile = {
        is_available_online: true,
      };
    } else if (status === "offline") {
      where.OR = [
        { is_active: false },
        {
          doctor_profile: {
            is_available_online: false,
          },
        },
      ];
    }

    // Fetch doctors with their online status
    const doctors = await prisma.user.findMany({
      where,
      include: {
        doctor_profile: {
          select: {
            id: true,
            specialties: true,
            rating: true,
            total_reviews: true,
            consultation_fee: true,
            is_available_online: true,
            availability_hours: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    // Enhance doctor data with calculated status
    const enhancedDoctors = doctors.map((doctor) => {
      const isOnline =
        doctor.is_active && doctor.doctor_profile?.is_available_online;

      return {
        id: doctor.id,
        name: doctor.name,
        email: doctor.email,
        specialties: doctor.doctor_profile?.specialties || [],
        rating: Number(doctor.doctor_profile?.rating || 0),
        total_reviews: doctor.doctor_profile?.total_reviews || 0,
        consultation_fee: Number(doctor.doctor_profile?.consultation_fee || 0),
        status: isOnline ? "online" : "offline",
        is_available_online:
          doctor.doctor_profile?.is_available_online || false,
        availability_hours: doctor.doctor_profile?.availability_hours || null,
        last_updated: doctor.updated_at,
      };
    });

    return NextResponse.json({
      success: true,
      doctors: enhancedDoctors,
      total_online: enhancedDoctors.filter((d) => d.status === "online").length,
      total_offline: enhancedDoctors.filter((d) => d.status === "offline")
        .length,
    });
  } catch (error) {
    console.error("Error fetching doctor status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verify authorization (doctor updating their own status or admin)
    const authResult = await verifyAuthToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { doctor_id, is_available_online, availability_hours } = body;

    // Check permission
    if (
      !["ADMIN", "SUPERADMIN"].includes(authResult.user.role) &&
      authResult.user.id !== doctor_id
    ) {
      return NextResponse.json(
        { error: "Forbidden: You can only update your own status" },
        { status: 403 }
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

    // Update doctor availability status
    const updateData: any = {};
    if (is_available_online !== undefined) {
      updateData.is_available_online = Boolean(is_available_online);
    }
    if (availability_hours !== undefined) {
      updateData.availability_hours = availability_hours;
    }

    const updatedDoctor = await prisma.doctorProfile.update({
      where: { user_id: doctor_id },
      data: updateData,
    });

    // Log the status change
    await prisma.auditLog.create({
      data: {
        user_id: authResult.user.id,
        action: "UPDATE",
        resource: "DoctorAvailability",
        resource_id: doctor_id,
        details: {
          doctor_name: doctor.user.name,
          new_availability: is_available_online,
          availability_hours: availability_hours,
          updated_by: authResult.user.role === "DOCTOR" ? "self" : "admin",
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Doctor availability status updated successfully",
      doctor: {
        id: doctor_id,
        name: doctor.user.name,
        is_available_online: updatedDoctor.is_available_online,
        availability_hours: updatedDoctor.availability_hours,
        updated_at: new Date(),
      },
    });
  } catch (error) {
    console.error("Error updating doctor status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Endpoint to track doctor activity (can be called periodically by frontend)
export async function POST(request: NextRequest) {
  try {
    // Verify doctor authorization
    const authResult = await verifyAuthToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (authResult.user.role !== "DOCTOR") {
      return NextResponse.json(
        { error: "Forbidden: Only doctors can ping activity" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { activity_type = "heartbeat" } = body;

    // Update doctor's last activity timestamp
    await prisma.doctorProfile.update({
      where: { user_id: authResult.user.id },
      data: {
        // We can add a last_activity field to track this
        // For now, we'll update the updated_at timestamp
      },
    });

    // Log activity
    await prisma.auditLog.create({
      data: {
        user_id: authResult.user.id,
        action: "ACTIVITY",
        resource: "DoctorActivity",
        resource_id: authResult.user.id,
        details: {
          activity_type,
          timestamp: new Date(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Activity recorded",
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Error recording doctor activity:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
