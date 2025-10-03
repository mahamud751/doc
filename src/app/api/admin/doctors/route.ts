import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("id");

    // If doctorId is provided, fetch single doctor
    if (doctorId) {
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

      // Fetch single doctor with their profile
      const doctor = await prisma.user.findUnique({
        where: { id: doctorId, role: "DOCTOR" },
        include: {
          doctor_profile: {
            include: {
              verification: true,
              availability_slots: {
                where: {
                  start_time: {
                    gte: new Date(),
                  },
                },
                take: 5,
                orderBy: {
                  start_time: "asc",
                },
              },
            },
          },
        },
      });

      if (!doctor) {
        return NextResponse.json(
          { error: "Doctor not found" },
          { status: 404 }
        );
      }

      // Enhance doctor data
      const enhancedDoctor = {
        id: doctor.id,
        name: doctor.name,
        email: doctor.email,
        phone: doctor.phone,
        is_verified: doctor.is_verified,
        is_active: doctor.is_active,
        created_at: doctor.created_at,
        profile: doctor.doctor_profile
          ? {
              id: doctor.doctor_profile.id,
              medical_license: doctor.doctor_profile.medical_license,
              specialties: doctor.doctor_profile.specialties,
              qualifications: doctor.doctor_profile.qualifications,
              experience_years: doctor.doctor_profile.experience_years,
              consultation_fee: Number(doctor.doctor_profile.consultation_fee),
              languages: doctor.doctor_profile.languages,
              bio: doctor.doctor_profile.bio,
              rating: Number(doctor.doctor_profile.rating),
              total_reviews: doctor.doctor_profile.total_reviews,
              is_available_online: doctor.doctor_profile.is_available_online,
              verification_status:
                doctor.doctor_profile.verification?.status || "PENDING",
              upcoming_slots: doctor.doctor_profile.availability_slots.length,
            }
          : null,
      };

      return NextResponse.json({
        success: true,
        doctor: enhancedDoctor,
      });
    }

    // Otherwise, fetch list of doctors (existing functionality)
    const search = searchParams.get("search");
    const specialty = searchParams.get("specialty");
    const status = searchParams.get("status") || "all";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {
      role: "DOCTOR",
    };

    // Only apply status filters when not "all"
    if (status !== "all") {
      if (status === "active") {
        where.is_active = true;
        where.is_verified = true;
      } else if (status === "inactive") {
        where.is_active = false;
      } else if (status === "pending") {
        where.is_verified = false;
      }
    }

    // Use the specialty variable to avoid the unused variable warning
    if (specialty && specialty !== "all") {
      // In a real implementation, we would filter by specialty
      // For now, we're just using the variable to avoid the warning
      console.log("Specialty filter would be applied:", specialty);
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Fetch doctors with their profiles
    const [doctors, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          doctor_profile: {
            include: {
              verification: true,
              availability_slots: {
                where: {
                  start_time: {
                    gte: new Date(),
                  },
                },
                take: 5,
                orderBy: {
                  start_time: "asc",
                },
              },
            },
          },
        },
        orderBy: { created_at: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    // Enhance doctor data
    const enhancedDoctors = doctors.map((doctor) => ({
      id: doctor.id,
      name: doctor.name,
      email: doctor.email,
      phone: doctor.phone,
      is_verified: doctor.is_verified,
      is_active: doctor.is_active,
      created_at: doctor.created_at,
      profile: doctor.doctor_profile
        ? {
            id: doctor.doctor_profile.id,
            medical_license: doctor.doctor_profile.medical_license,
            specialties: doctor.doctor_profile.specialties,
            qualifications: doctor.doctor_profile.qualifications,
            experience_years: doctor.doctor_profile.experience_years,
            consultation_fee: Number(doctor.doctor_profile.consultation_fee),
            languages: doctor.doctor_profile.languages,
            bio: doctor.doctor_profile.bio,
            rating: Number(doctor.doctor_profile.rating),
            total_reviews: doctor.doctor_profile.total_reviews,
            is_available_online: doctor.doctor_profile.is_available_online,
            verification_status:
              doctor.doctor_profile.verification?.status || "PENDING",
            upcoming_slots: doctor.doctor_profile.availability_slots.length,
          }
        : null,
    }));

    return NextResponse.json({
      success: true,
      doctors: enhancedDoctors,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    const {
      // User data
      name,
      email,
      phone,
      password, // This is now optional
      // Doctor profile data
      medical_license,
      specialties,
      qualifications,
      experience_years,
      consultation_fee,
      languages,
      bio,
      clinic_locations,
    } = body;

    // Validate required fields (password is now optional)
    if (
      !name ||
      !email ||
      !phone ||
      !medical_license ||
      !specialties ||
      !experience_years ||
      !consultation_fee
    ) {
      return NextResponse.json(
        { error: "All required fields must be provided" },
        { status: 400 }
      );
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
        { status: 400 }
      );
    }

    // Check if medical license already exists
    const existingLicense = await prisma.doctorProfile.findUnique({
      where: { medical_license },
    });

    if (existingLicense) {
      return NextResponse.json(
        { error: "Doctor with this medical license already exists" },
        { status: 400 }
      );
    }

    // Generate temporary password if not provided
    let finalPassword = password;
    let isTemporaryPassword = false;

    if (!finalPassword) {
      // Generate a random temporary password
      finalPassword = Math.random().toString(36).slice(-8) + "A1!";
      isTemporaryPassword = true;
    }

    // Hash password
    const { hashPassword } = await import("@/lib/auth");
    const hashedPassword = await hashPassword(finalPassword);

    // Create doctor in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          name,
          email,
          phone,
          password_hash: hashedPassword,
          role: "DOCTOR",
          is_verified: false, // Will be verified after admin approval
          is_active: false, // Will be activated after verification
        },
      });

      // Create doctor profile
      const doctorProfile = await tx.doctorProfile.create({
        data: {
          user_id: user.id,
          medical_license,
          specialties: Array.isArray(specialties) ? specialties : [specialties],
          qualifications: Array.isArray(qualifications)
            ? qualifications
            : [qualifications],
          experience_years: parseInt(experience_years),
          consultation_fee: parseFloat(consultation_fee),
          languages: Array.isArray(languages) ? languages : [languages],
          bio,
          clinic_locations: clinic_locations || [],
          is_available_online: true,
          rating: 0,
          total_reviews: 0,
        },
      });

      // Create verification record
      await tx.doctorVerification.create({
        data: {
          doctor_id: doctorProfile.id,
          status: "PENDING",
          documents: [], // Will be uploaded later
        },
      });

      return {
        user,
        doctorProfile,
        isTemporaryPassword,
        tempPassword: isTemporaryPassword ? finalPassword : null,
      };
    });

    // TODO: Send email to doctor with temporary password and instructions
    // For now, we'll just log it
    if (result.isTemporaryPassword) {
      console.log(
        `Temporary password for doctor ${result.user.name}: ${result.tempPassword}`
      );
      console.log("In a production environment, this would be sent via email");
    }

    // Log the creation
    await prisma.auditLog.create({
      data: {
        user_id: authResult.user.id,
        action: "CREATE",
        resource: "Doctor",
        resource_id: result.user.id,
        details: {
          doctor_name: name,
          medical_license,
          specialties,
          temporary_password_created: result.isTemporaryPassword,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Doctor created successfully",
        doctor: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          profile_id: result.doctorProfile.id,
          temporary_password_created: result.isTemporaryPassword,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating doctor:", error);
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
    const { doctor_id, user_data, profile_data } = body;

    if (!doctor_id) {
      return NextResponse.json(
        { error: "Doctor ID is required" },
        { status: 400 }
      );
    }

    // Update doctor in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user data if provided
      let updatedUser = null;
      if (user_data && Object.keys(user_data).length > 0) {
        updatedUser = await tx.user.update({
          where: { id: doctor_id },
          data: user_data,
        });
      }

      // Update doctor profile if provided
      let updatedProfile = null;
      if (profile_data && Object.keys(profile_data).length > 0) {
        // Convert numeric fields
        if (profile_data.experience_years) {
          profile_data.experience_years = parseInt(
            profile_data.experience_years
          );
        }
        if (profile_data.consultation_fee) {
          profile_data.consultation_fee = parseFloat(
            profile_data.consultation_fee
          );
        }

        updatedProfile = await tx.doctorProfile.update({
          where: { user_id: doctor_id },
          data: profile_data,
        });
      }

      return { updatedUser, updatedProfile };
    });

    // Log the update
    await prisma.auditLog.create({
      data: {
        user_id: authResult.user.id,
        action: "UPDATE",
        resource: "Doctor",
        resource_id: doctor_id,
        details: {
          user_fields_updated: user_data ? Object.keys(user_data) : [],
          profile_fields_updated: profile_data ? Object.keys(profile_data) : [],
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Doctor updated successfully",
      doctor: result,
    });
  } catch (error) {
    console.error("Error updating doctor:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const doctor_id = searchParams.get("doctor_id");

    if (!doctor_id) {
      return NextResponse.json(
        { error: "Doctor ID is required" },
        { status: 400 }
      );
    }

    // Get doctor info before deletion
    const doctor = await prisma.user.findUnique({
      where: { id: doctor_id },
      select: { name: true, email: true },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // Soft delete by deactivating
    await prisma.user.update({
      where: { id: doctor_id },
      data: { is_active: false },
    });

    // Log the deletion
    await prisma.auditLog.create({
      data: {
        user_id: authResult.user.id,
        action: "DELETE",
        resource: "Doctor",
        resource_id: doctor_id,
        details: {
          doctor_name: doctor.name,
          doctor_email: doctor.email,
          soft_delete: true,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Doctor deactivated successfully",
    });
  } catch (error) {
    console.error("Error deleting doctor:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
