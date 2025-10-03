import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, generateJWT } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        patient_profile: true,
        doctor_profile: {
          include: {
            verification: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check if doctor is verified
    if (user.role === "DOCTOR") {
      // Check if doctor has a profile and verification record
      if (!user.doctor_profile?.verification) {
        return NextResponse.json(
          {
            error:
              "Doctor profile is not verified yet. Please wait for admin approval.",
            status: "pending_verification",
          },
          { status: 403 }
        );
      }

      // Check verification status
      if (user.doctor_profile.verification.status !== "APPROVED") {
        return NextResponse.json(
          {
            error:
              "Doctor profile is not verified yet. Please wait for admin approval.",
            status: "pending_verification",
          },
          { status: 403 }
        );
      }

      // For doctors, also check if account is active
      if (!user.is_active) {
        return NextResponse.json(
          {
            error:
              "Doctor account is not active yet. Please wait for admin approval.",
            status: "inactive",
          },
          { status: 403 }
        );
      }
    }

    // Generate JWT token
    const token = generateJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Update last login timestamp (using updated_at field)
    await prisma.user.update({
      where: { id: user.id },
      data: { updated_at: new Date() },
    });

    // Return user data and token
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profile:
        user.role === "PATIENT" ? user.patient_profile : user.doctor_profile,
    };

    return NextResponse.json(
      {
        message: "Login successful",
        user: userData,
        token,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
