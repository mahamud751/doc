import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isOTPExpired } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp } = body;

    // Validate required fields
    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and OTP are required" },
        { status: 400 }
      );
    }

    // Find user by email and OTP
    const user = await prisma.user.findFirst({
      where: {
        email,
        otp_code: otp,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid OTP or email" },
        { status: 400 }
      );
    }

    // Check if OTP is expired
    if (!user.otp_expires_at || isOTPExpired(user.otp_expires_at)) {
      return NextResponse.json({ error: "OTP has expired" }, { status: 400 });
    }

    // Verify email and clear OTP
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        is_verified: true,
        otp_code: null,
        otp_expires_at: null,
        updated_at: new Date(),
      },
    });

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.name, user.role);
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
      // Continue even if welcome email fails
    }

    return NextResponse.json(
      {
        message: "Email verified successfully",
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          role: updatedUser.role,
          emailVerified: updatedUser.is_verified,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("OTP verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
