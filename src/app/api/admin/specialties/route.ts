import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { Prisma } from "@prisma/client";

interface JwtPayload {
  userId: string;
  role: string;
  iat: number;
  exp: number;
}

interface SpecialtyUpdateData {
  name?: string;
  description?: string;
  icon_url?: string;
  is_active?: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    if (decoded.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const whereClause: Prisma.SpecialtyWhereInput = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const specialties = await prisma.specialty.findMany({
      where: whereClause,
      orderBy: {
        created_at: "desc",
      },
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
          doctor_count: doctorCount,
        };
      })
    );

    return NextResponse.json({
      specialties: specialtiesWithCounts,
      total: specialtiesWithCounts.length,
    });
  } catch (error) {
    console.error("Error fetching specialties:", error);
    return NextResponse.json(
      { error: "Failed to fetch specialties" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    if (decoded.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, description, icon_url } = await request.json();

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

    const specialty = await prisma.specialty.create({
      data: {
        name,
        description,
        icon_url,
      },
    });

    return NextResponse.json({ specialty }, { status: 201 });
  } catch (error) {
    console.error("Error creating specialty:", error);
    return NextResponse.json(
      { error: "Failed to create specialty" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    if (decoded.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, name, description, icon_url, is_active } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Specialty ID is required" },
        { status: 400 }
      );
    }

    const updateData: SpecialtyUpdateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (icon_url !== undefined) updateData.icon_url = icon_url;
    if (is_active !== undefined) updateData.is_active = is_active;

    const specialty = await prisma.specialty.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ specialty });
  } catch (error) {
    console.error("Error updating specialty:", error);
    return NextResponse.json(
      { error: "Failed to update specialty" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    if (decoded.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Specialty ID is required" },
        { status: 400 }
      );
    }

    // Soft delete - mark as inactive
    await prisma.specialty.update({
      where: { id },
      data: { is_active: false },
    });

    return NextResponse.json({ message: "Specialty deleted successfully" });
  } catch (error) {
    console.error("Error deleting specialty:", error);
    return NextResponse.json(
      { error: "Failed to delete specialty" },
      { status: 500 }
    );
  }
}
