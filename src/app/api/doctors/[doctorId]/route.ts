import { NextRequest, NextResponse } from "next/server";
import { verifyJWT } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ doctorId: string }> }
) {
  try {
    // Verify user authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyJWT(token);

    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { doctorId } = await params;

    if (!doctorId) {
      return NextResponse.json(
        { error: "Doctor ID is required" },
        { status: 400 }
      );
    }

    // Fetch doctor details from database
    const doctor = await prisma.user.findUnique({
      where: {
        id: doctorId,
        role: "DOCTOR",
      },
      include: {
        doctor_profile: {
          include: {
            availability_slots: {
              where: {
                is_available: true,
                start_time: {
                  gte: new Date(),
                },
              },
              orderBy: {
                start_time: "asc",
              },
              take: 10,
            },
          },
        },
      },
    });

    if (!doctor || !doctor.doctor_profile) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // Transform the data to match the frontend interface
    const transformedDoctor = {
      id: doctor.id,
      name: doctor.name,
      email: doctor.email,
      phone: doctor.phone,
      specialties: doctor.doctor_profile.specialties || [],
      qualifications: doctor.doctor_profile.qualifications || [],
      experience_years: doctor.doctor_profile.experience_years || 0,
      consultation_fee: Number(doctor.doctor_profile.consultation_fee || 0),
      rating: Number(doctor.doctor_profile.rating || 4.5),
      total_reviews: doctor.doctor_profile.total_reviews || 0,
      bio: doctor.doctor_profile.bio || "",
      avatar_url: doctor.avatar_url,
      is_available_online: doctor.doctor_profile.is_available_online || false,
      next_available_slots: doctor.doctor_profile.availability_slots.map(
        (slot: any) => ({
          id: slot.id,
          start_time: slot.start_time,
          end_time: slot.end_time,
          is_available: slot.is_available,
        })
      ),
      medical_license: doctor.doctor_profile.medical_license,
      languages: doctor.doctor_profile.languages || [],
    };

    return NextResponse.json({
      doctor: transformedDoctor,
    });
  } catch (error) {
    console.error("Error fetching doctor:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
