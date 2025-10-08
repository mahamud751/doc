import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJWT } from "@/lib/auth";

// Get patient profile
export async function GET(request: NextRequest) {
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

    const patient = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        patient_profile: true,
      },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      patient: {
        id: patient.id,
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        avatar_url: patient.avatar_url,
        profile: patient.patient_profile,
      },
    });
  } catch (error) {
    console.error("Error fetching patient profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update patient profile
export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { user_data, profile_data } = body;

    // Prevent email changes - remove email from user_data if present
    if (user_data && user_data.email) {
      delete user_data.email;
    }

    // Remove user_data if it's empty after email removal
    if (user_data && Object.keys(user_data).length === 0) {
      delete body.user_data;
    }

    // Update patient in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user data if provided
      let updatedUser = null;
      if (user_data && Object.keys(user_data).length > 0) {
        updatedUser = await tx.user.update({
          where: { id: decoded.userId },
          data: user_data,
        });
      }

      // Update patient profile if provided
      let updatedProfile = null;
      if (profile_data && Object.keys(profile_data).length > 0) {
        // Handle date_of_birth conversion carefully
        if ("date_of_birth" in profile_data) {
          if (
            profile_data.date_of_birth &&
            profile_data.date_of_birth.trim() !== ""
          ) {
            // Validate that it's a valid date string
            const dateValue = new Date(profile_data.date_of_birth);
            if (isNaN(dateValue.getTime())) {
              // If invalid date, set to null
              profile_data.date_of_birth = null;
            } else {
              // Valid date, use it
              profile_data.date_of_birth = dateValue;
            }
          } else {
            // Empty or null date, set to null
            profile_data.date_of_birth = null;
          }
        }

        // Handle other fields - convert empty strings to null
        const fieldsToConvert = [
          "gender",
          "blood_group",
          "address",
          "emergency_contact",
          "medical_history",
        ];

        fieldsToConvert.forEach((field) => {
          if (profile_data[field] === "") {
            profile_data[field] = null;
          }
        });

        // Handle allergies - ensure it's always an array
        if (!Array.isArray(profile_data.allergies)) {
          profile_data.allergies = [];
        }

        updatedProfile = await tx.patientProfile.upsert({
          where: { user_id: decoded.userId },
          update: profile_data,
          create: {
            user_id: decoded.userId,
            ...profile_data,
          },
        });
      }

      return { updatedUser, updatedProfile };
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      patient: {
        id: decoded.userId,
        ...result.updatedUser,
        profile: result.updatedProfile,
      },
    });
  } catch (error) {
    console.error("Error updating patient profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
