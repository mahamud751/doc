import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authorization
    const authResult = await verifyAuthToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "SUPERADMIN"].includes(authResult.user.role)) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const doctorId = params.id;

    // Fetch single doctor with their profile
    const doctor = await prisma.user.findUnique({
      where: { id: doctorId, role: "DOCTOR" },
      include: {
        doctor_profile: {
          include: {
            verification: true,
            availability_slots: {
              where: {
                start_time: {
                  gte: new Date(),
                },
              },
              take: 5,
              orderBy: {
                start_time: "asc",
              },
            },
          },
        },
      },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // Enhance doctor data
    const enhancedDoctor = {
      id: doctor.id,
      name: doctor.name,
      email: doctor.email,
      phone: doctor.phone,
      is_verified: doctor.is_verified,
      is_active: doctor.is_active,
      created_at: doctor.created_at,
      profile: doctor.doctor_profile
        ? {
            id: doctor.doctor_profile.id,
            medical_license: doctor.doctor_profile.medical_license,
            specialties: doctor.doctor_profile.specialties,
            qualifications: doctor.doctor_profile.qualifications,
            experience_years: doctor.doctor_profile.experience_years,
            consultation_fee: Number(doctor.doctor_profile.consultation_fee),
            languages: doctor.doctor_profile.languages,
            bio: doctor.doctor_profile.bio,
            rating: Number(doctor.doctor_profile.rating),
            total_reviews: doctor.doctor_profile.total_reviews,
            is_available_online: doctor.doctor_profile.is_available_online,
            verification_status:
              doctor.doctor_profile.verification?.status || "PENDING",
            upcoming_slots: doctor.doctor_profile.availability_slots.length,
          }
        : null,
    };

    return NextResponse.json({
      success: true,
      doctor: enhancedDoctor,
    });
  } catch (error) {
    console.error("Error fetching doctor:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authorization
    const authResult = await verifyAuthToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "SUPERADMIN"].includes(authResult.user.role)) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const doctorId = params.id;
    const body = await request.json();
    const { user_data, profile_data } = body;

    // Update doctor in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user data if provided
      let updatedUser = null;
      if (user_data && Object.keys(user_data).length > 0) {
        updatedUser = await tx.user.update({
          where: { id: doctorId },
          data: user_data,
        });
      }

      // Update doctor profile if provided
      let updatedProfile = null;
      if (profile_data && Object.keys(profile_data).length > 0) {
        // Convert numeric fields
        if (profile_data.experience_years) {
          profile_data.experience_years = parseInt(
            profile_data.experience_years
          );
        }
        if (profile_data.consultation_fee) {
          profile_data.consultation_fee = parseFloat(
            profile_data.consultation_fee
          );
        }

        updatedProfile = await tx.doctorProfile.update({
          where: { user_id: doctorId },
          data: profile_data,
        });
      }

      return { updatedUser, updatedProfile };
    });

    // Log the update
    await prisma.auditLog.create({
      data: {
        user_id: authResult.user.id,
        action: "UPDATE",
        resource: "Doctor",
        resource_id: doctorId,
        details: {
          user_fields_updated: user_data ? Object.keys(user_data) : [],
          profile_fields_updated: profile_data ? Object.keys(profile_data) : [],
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Doctor updated successfully",
      doctor: result,
    });
  } catch (error) {
    console.error("Error updating doctor:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authorization
    const authResult = await verifyAuthToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "SUPERADMIN"].includes(authResult.user.role)) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const doctorId = params.id;

    // Get doctor info before deletion
    const doctor = await prisma.user.findUnique({
      where: { id: doctorId },
      select: { name: true, email: true },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // Soft delete by deactivating
    await prisma.user.update({
      where: { id: doctorId },
      data: { is_active: false },
    });

    // Log the deletion
    await prisma.auditLog.create({
      data: {
        user_id: authResult.user.id,
        action: "DELETE",
        resource: "Doctor",
        resource_id: doctorId,
        details: {
          doctor_name: doctor.name,
          doctor_email: doctor.email,
          soft_delete: true,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Doctor deactivated successfully",
    });
  } catch (error) {
    console.error("Error deleting doctor:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
