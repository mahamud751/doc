import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth-utils";
import { sendWelcomeEmail } from "@/lib/email";
import { UserRole } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, password, role = "PATIENT" } = body;

    // Validate required fields
    if (!name || !email || !phone || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate role
    if (!Object.values(UserRole).includes(role)) {
      return NextResponse.json({ error: "Invalid user role" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email or phone already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    if (role === "DOCTOR") {
      // For doctors, create user as unverified and inactive, and create doctor profile
      const user = await prisma.user.create({
        data: {
          name,
          email,
          phone,
          password_hash: hashedPassword,
          role,
          is_verified: false, // Doctor needs admin approval
          is_active: false, // Doctor needs admin approval
          otp_code: null,
          otp_expires_at: null,
        },
      });

      // Create initial doctor profile with a unique temporary medical license
      const timestamp = Date.now();
      const doctorProfile = await prisma.doctorProfile.create({
        data: {
          user_id: user.id,
          medical_license: `TEMP_LICENSE_${timestamp}`, // Unique temporary license
          specialties: [],
          qualifications: [],
          experience_years: 0,
          consultation_fee: 0,
          languages: [],
          bio: "",
          is_available_online: false,
          rating: 0,
          total_reviews: 0,
        },
      });

      // Create verification record
      await prisma.doctorVerification.create({
        data: {
          doctor_id: doctorProfile.id,
          status: "PENDING",
          documents: [],
        },
      });

      return NextResponse.json(
        {
          message:
            "Doctor registration submitted. Please wait for admin approval.",
          userId: user.id,
          email: user.email,
          verified: false,
          status: "pending_verification",
        },
        { status: 201 }
      );
    } else {
      // For patients and other roles, auto-verify
      const user = await prisma.user.create({
        data: {
          name,
          email,
          phone,
          password_hash: hashedPassword,
          role,
          is_verified: true, // Auto-verify non-doctor users
          otp_code: null,
          otp_expires_at: null,
        },
      });

      // Create role-specific profile
      if (role === "PATIENT") {
        await prisma.patientProfile.create({
          data: {
            user_id: user.id,
          },
        });
      }

      // Send welcome email (optional)
      try {
        await sendWelcomeEmail(email, name, role);
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
        // Continue registration even if email fails
      }

      return NextResponse.json(
        {
          message: "User registered successfully. You can now login.",
          userId: user.id,
          email: user.email,
          verified: true,
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
