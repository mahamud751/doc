import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const specialty = searchParams.get("specialty") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sortBy = searchParams.get("sortBy") || "rating";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const skip = (page - 1) * limit;

    // Build search conditions
    const whereConditions: Prisma.UserWhereInput = {
      role: "DOCTOR",
      is_active: true,
      doctor_profile: {
        verification: {
          status: "APPROVED",
        },
      },
    };

    // Search by name or specialties
    if (search) {
      whereConditions.OR = [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          doctor_profile: {
            specialties: {
              hasSome: [search],
            },
          },
        },
      ];
    }

    // Filter by specialty
    if (specialty) {
      if (whereConditions.doctor_profile) {
        whereConditions.doctor_profile.specialties = {
          has: specialty,
        };
      } else {
        whereConditions.doctor_profile = {
          specialties: {
            has: specialty,
          },
        };
      }
    }

    // Search doctors
    const doctors = await prisma.user.findMany({
      where: whereConditions,
      include: {
        doctor_profile: {
          include: {
            verification: true,
            availability_slots: {
              where: {
                start_time: {
                  gte: new Date(),
                },
                is_available: true,
                is_booked: false,
              },
              take: 5,
              orderBy: {
                start_time: "asc",
              },
            },
          },
        },
        doctor_appointments: {
          where: {
            status: "COMPLETED",
          },
          include: {
            review: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy:
        sortBy === "rating"
          ? { doctor_profile: { rating: sortOrder as Prisma.SortOrder } }
          : sortBy === "fee"
          ? {
              doctor_profile: {
                consultation_fee: sortOrder as Prisma.SortOrder,
              },
            }
          : { name: sortOrder as Prisma.SortOrder },
    });

    // Get total count for pagination
    const totalCount = await prisma.user.count({
      where: whereConditions,
    });

    // Transform the data for frontend
    const transformedDoctors = doctors.map((doctor) => ({
      id: doctor.id,
      name: doctor.name,
      email: doctor.email,
      phone: doctor.phone,
      avatar_url: doctor.avatar_url,
      specialties: doctor.doctor_profile?.specialties || [],
      qualifications: doctor.doctor_profile?.qualifications || [],
      experience_years: doctor.doctor_profile?.experience_years || 0,
      consultation_fee: doctor.doctor_profile?.consultation_fee || 0,
      languages: doctor.doctor_profile?.languages || [],
      bio: doctor.doctor_profile?.bio || "",
      rating: doctor.doctor_profile?.rating || 0,
      total_reviews: doctor.doctor_profile?.total_reviews || 0,
      is_available_online: doctor.doctor_profile?.is_available_online || false,
      next_available_slots: doctor.doctor_profile?.availability_slots || [],
      total_consultations: doctor.doctor_appointments?.length || 0,
      verified: doctor.doctor_profile?.verification?.status === "APPROVED",
    }));

    return NextResponse.json({
      doctors: transformedDoctors,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error searching doctors:", error);
    return NextResponse.json(
      { error: "Failed to search doctors" },
      { status: 500 }
    );
  }
}

// Get specialties for filter dropdown
export async function POST() {
  try {
    const specialties = await prisma.user.findMany({
      where: {
        role: "DOCTOR",
        is_active: true,
        doctor_profile: {
          verification: {
            status: "APPROVED",
          },
        },
      },
      select: {
        doctor_profile: {
          select: {
            specialties: true,
          },
        },
      },
    });

    // Get unique specialties
    const allSpecialties = specialties
      .flatMap((doctor) => doctor.doctor_profile?.specialties || [])
      .filter((specialty, index, array) => array.indexOf(specialty) === index)
      .sort();

    return NextResponse.json({ specialties: allSpecialties });
  } catch (error) {
    console.error("Error fetching specialties:", error);
    return NextResponse.json(
      { error: "Failed to fetch specialties" },
      { status: 500 }
    );
  }
}
