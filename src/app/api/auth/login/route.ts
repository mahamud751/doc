import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, generateJWT } from "@/lib/auth";

// Handle CORS preflight requests for incognito/mobile compatibility
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('[LOGIN] Attempt for email:', email, 'from incognito-friendly endpoint');

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }

    // Find user by email (enhanced for incognito mode compatibility)
    let user = await prisma.user.findFirst({
      where: { 
        email: {
          equals: email.toLowerCase().trim(),
          mode: 'insensitive'
        }
      },
      include: {
        patient_profile: true,
        doctor_profile: {
          include: {
            verification: true,
          },
        },
      },
    });

    // Fallback for exact match if case-insensitive fails
    if (!user) {
      user = await prisma.user.findUnique({
        where: { email: email.trim() },
        include: {
          patient_profile: true,
          doctor_profile: {
            include: {
              verification: true,
            },
          },
        },
      });
    }

    if (!user) {
      console.log('[LOGIN] User not found for email:', email);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { 
          status: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }
    
    console.log('[LOGIN] User found:', user.id);

    // Verify password
    console.log('[LOGIN] Verifying password for user:', user.id);
    const isPasswordValid = await verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      console.log('[LOGIN] Invalid password for user:', user.id);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { 
          status: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }
    
    console.log('[LOGIN] Password verified for user:', user.id);

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

    console.log('[LOGIN] Login successful for user:', user.id);
    
    return NextResponse.json(
      {
        message: "Login successful",
        user: userData,
        token,
      },
      { 
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
