import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(request: NextRequest) {
  try {
    // Generate a simple test JWT token
    const payload = {
      userId: "test-user-id",
      email: "test@example.com",
      role: "PATIENT", // Assuming PATIENT role for testing
    };

    const secret = process.env.JWT_SECRET || "test-secret";
    const token = jwt.sign(payload, secret, { expiresIn: "1h" });

    return NextResponse.json({
      token,
      message: "Test JWT token generated successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to generate test token: " + error.message },
      { status: 500 }
    );
  }
}