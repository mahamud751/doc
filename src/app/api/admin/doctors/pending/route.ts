import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
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

    // Fetch pending doctor verifications
    const pendingDoctors = await prisma.doctorVerification.findMany({
      where: {
        status: "PENDING",
      },
      include: {
        doctor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                created_at: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: "asc", // Oldest first for fair processing
      },
    });

    // Format the response
    const doctors = pendingDoctors.map((verification) => ({
      id: verification.id,
      doctor_id: verification.doctor_id,
      name: verification.doctor.user.name,
      email: verification.doctor.user.email,
      phone: verification.doctor.user.phone,
      specialties: verification.doctor.specialties,
      qualifications: verification.doctor.qualifications,
      experience_years: verification.doctor.experience_years,
      consultation_fee: verification.doctor.consultation_fee,
      medical_license: verification.doctor.medical_license,
      documents: verification.documents,
      bio: verification.doctor.bio,
      submitted_at: verification.created_at,
      status: verification.status,
    }));

    return NextResponse.json({
      success: true,
      doctors,
    });
  } catch (error) {
    console.error("Error fetching pending doctors:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { verification_id, action, rejection_reason, notes } = body;

    if (!verification_id || !action) {
      return NextResponse.json(
        { error: "Verification ID and action are required" },
        { status: 400 }
      );
    }

    if (!["APPROVED", "REJECTED"].includes(action)) {
      return NextResponse.json(
        { error: "Action must be either APPROVED or REJECTED" },
        { status: 400 }
      );
    }

    if (action === "REJECTED" && !rejection_reason) {
      return NextResponse.json(
        { error: "Rejection reason is required when rejecting" },
        { status: 400 }
      );
    }

    // Update verification status
    const verification = await prisma.doctorVerification.update({
      where: { id: verification_id },
      data: {
        status: action,
        reviewed_by: authResult.user.id,
        reviewed_at: new Date(),
        rejection_reason: action === "REJECTED" ? rejection_reason : null,
        notes,
      },
      include: {
        doctor: {
          include: {
            user: true,
          },
        },
      },
    });

    // If approved, activate the doctor user account
    if (action === "APPROVED") {
      await prisma.user.update({
        where: { id: verification.doctor.user.id },
        data: {
          is_verified: true,
          is_active: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Doctor ${action.toLowerCase()} successfully`,
      verification,
    });
  } catch (error) {
    console.error("Error updating doctor verification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
