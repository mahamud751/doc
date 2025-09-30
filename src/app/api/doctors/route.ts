import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const specialty = searchParams.get("specialty");
    const search = searchParams.get("search");
    const available = searchParams.get("available");

    let whereClause: any = {
      role: "DOCTOR",
      is_active: true,
      is_verified: true,
      doctor_profile: {
        verification: {
          status: "APPROVED",
        },
      },
    };

    // Add specialty filter
    if (specialty) {
      whereClause.doctor_profile.specialties = {
        has: specialty,
      };
    }

    // Add search filter
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { doctor_profile: { specialties: { hasSome: [search] } } },
      ];
    }

    // Add availability filter
    if (available === "true") {
      whereClause.doctor_profile.is_available_online = true;
    }

    const doctors = await prisma.user.findMany({
      where: whereClause,
      include: {
        doctor_profile: {
          include: {
            verification: true,
          },
        },
      },
      orderBy: {
        doctor_profile: {
          rating: "desc",
        },
      },
    });

    // Transform the data to match the expected format
    const formattedDoctors = doctors.map((doctor) => ({
      id: doctor.id,
      name: doctor.name,
      email: doctor.email,
      phone: doctor.phone,
      avatar_url: doctor.avatar_url,
      specialties: doctor.doctor_profile?.specialties || [],
      qualifications: doctor.doctor_profile?.qualifications || [],
      experience_years: doctor.doctor_profile?.experience_years || 0,
      consultation_fee: Number(doctor.doctor_profile?.consultation_fee || 0),
      rating: Number(doctor.doctor_profile?.rating || 0),
      total_reviews: doctor.doctor_profile?.total_reviews || 0,
      bio: doctor.doctor_profile?.bio || "",
      is_available_online: doctor.doctor_profile?.is_available_online || false,
      languages: doctor.doctor_profile?.languages || [],
      clinic_locations: doctor.doctor_profile?.clinic_locations || [],
      next_available_slots: [], // Can be populated with real availability logic
    }));

    return NextResponse.json({ doctors: formattedDoctors });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    return NextResponse.json(
      { error: "Failed to fetch doctors" },
      { status: 500 }
    );
  }
}
