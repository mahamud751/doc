import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const include_counts = searchParams.get("include_counts") === "true";

    let specialties;

    if (include_counts) {
      // Fetch specialties with doctor counts
      specialties = await prisma.specialty.findMany({
        where: { is_active: true },
        select: {
          id: true,
          name: true,
          description: true,
          icon_url: true,
          is_active: true,
          created_at: true,
        },
        orderBy: { name: "asc" },
      });

      // Get doctor counts for each specialty
      const specialtiesWithCounts = await Promise.all(
        specialties.map(async (specialty) => {
          const doctorCount = await prisma.doctorProfile.count({
            where: {
              specialties: {
                has: specialty.name,
              },
              user: {
                is_active: true,
                is_verified: true,
              },
            },
          });

          return {
            ...specialty,
            count: doctorCount,
            color: getSpecialtyColor(specialty.name), // Helper function for UI colors
            icon: getSpecialtyIcon(specialty.name), // Helper function for UI icons
          };
        })
      );

      specialties = specialtiesWithCounts;
    } else {
      // Simple fetch without counts
      specialties = await prisma.specialty.findMany({
        where: { is_active: true },
        orderBy: { name: "asc" },
      });
    }

    return NextResponse.json({
      success: true,
      specialties,
    });
  } catch (error) {
    console.error("Error fetching specialties:", error);
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
    const { name, description, icon_url } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Specialty name is required" },
        { status: 400 }
      );
    }

    // Check if specialty already exists
    const existing = await prisma.specialty.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Specialty with this name already exists" },
        { status: 400 }
      );
    }

    // Create specialty
    const specialty = await prisma.specialty.create({
      data: {
        name,
        description,
        icon_url,
        is_active: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Specialty created successfully",
        specialty,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating specialty:", error);
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
    const { id, name, description, icon_url, is_active } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Specialty ID is required" },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (icon_url !== undefined) updateData.icon_url = icon_url;
    if (is_active !== undefined) updateData.is_active = is_active;

    // Update specialty
    const specialty = await prisma.specialty.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "Specialty updated successfully",
      specialty,
    });
  } catch (error) {
    console.error("Error updating specialty:", error);
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
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Specialty ID is required" },
        { status: 400 }
      );
    }

    // Soft delete by deactivating
    await prisma.specialty.update({
      where: { id },
      data: { is_active: false },
    });

    return NextResponse.json({
      success: true,
      message: "Specialty deactivated successfully",
    });
  } catch (error) {
    console.error("Error deleting specialty:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper functions for UI
function getSpecialtyColor(specialtyName: string): string {
  const colors: { [key: string]: string } = {
    Cardiology: "from-red-500 to-pink-500",
    Neurology: "from-purple-500 to-violet-500",
    Orthopedics: "from-blue-500 to-cyan-500",
    Pediatrics: "from-green-500 to-emerald-500",
    Dermatology: "from-orange-500 to-amber-500",
    Gynecology: "from-pink-500 to-rose-500",
    Psychiatry: "from-indigo-500 to-purple-500",
    "General Medicine": "from-gray-500 to-slate-500",
  };
  return colors[specialtyName] || "from-blue-500 to-cyan-500";
}

function getSpecialtyIcon(specialtyName: string): string {
  const icons: { [key: string]: string } = {
    Cardiology: "Heart",
    Neurology: "Brain",
    Orthopedics: "Bone",
    Pediatrics: "Baby",
    Dermatology: "Eye",
    Gynecology: "User",
    Psychiatry: "Brain",
    "General Medicine": "Stethoscope",
  };
  return icons[specialtyName] || "Stethoscope";
}
