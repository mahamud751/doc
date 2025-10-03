import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Specialty } from "@prisma/client";
import jwt from "jsonwebtoken";

// Define type for JWT payload
interface JwtPayload {
  role: string;
  [key: string]: unknown;
}

// Define type for categories
interface Category {
  id: string;
  name: string;
  type: string;
  description?: string;
}

const prisma = new PrismaClient();

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
    const type = searchParams.get("type"); // medicine, lab, specialty

    // Since we don't have a dedicated categories table in the schema,
    // we'll return predefined categories for each type
    let categories: Category[] = [];

    switch (type) {
      case "medicine":
        categories = [
          { id: "tablet", name: "Tablet", type: "medicine" },
          { id: "capsule", name: "Capsule", type: "medicine" },
          { id: "syrup", name: "Syrup", type: "medicine" },
          { id: "injection", name: "Injection", type: "medicine" },
          { id: "cream", name: "Cream", type: "medicine" },
          { id: "ointment", name: "Ointment", type: "medicine" },
          { id: "drops", name: "Drops", type: "medicine" },
          { id: "powder", name: "Powder", type: "medicine" },
        ];
        break;
      case "lab":
        categories = [
          { id: "blood", name: "Blood Tests", type: "lab" },
          { id: "urine", name: "Urine Tests", type: "lab" },
          { id: "imaging", name: "Imaging", type: "lab" },
          { id: "cardiac", name: "Cardiac Tests", type: "lab" },
          { id: "hormone", name: "Hormone Tests", type: "lab" },
          { id: "genetic", name: "Genetic Tests", type: "lab" },
          { id: "microbiology", name: "Microbiology", type: "lab" },
          { id: "pathology", name: "Pathology", type: "lab" },
        ];
        break;
      case "specialty":
        // Get actual specialties from database
        const specialties = await prisma.specialty.findMany({
          where: { is_active: true },
          orderBy: { name: "asc" },
        });
        categories = specialties.map((specialty: Specialty) => ({
          id: specialty.id,
          name: specialty.name,
          type: "specialty",
          ...(specialty.description && { description: specialty.description }),
        }));
        break;
      default:
        // Return all types
        categories = [
          // Medicine categories
          { id: "tablet", name: "Tablet", type: "medicine" },
          { id: "capsule", name: "Capsule", type: "medicine" },
          { id: "syrup", name: "Syrup", type: "medicine" },
          { id: "injection", name: "Injection", type: "medicine" },
          // Lab categories
          { id: "blood", name: "Blood Tests", type: "lab" },
          { id: "urine", name: "Urine Tests", type: "lab" },
          { id: "imaging", name: "Imaging", type: "lab" },
          { id: "cardiac", name: "Cardiac Tests", type: "lab" },
        ];
    }

    return NextResponse.json({
      categories,
      total: categories.length,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
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

    const { name, description, type } = await request.json();

    if (!name || !type) {
      return NextResponse.json(
        { error: "Name and type are required" },
        { status: 400 }
      );
    }

    // Only specialty categories can be created in the database
    if (type === "specialty") {
      const specialty = await prisma.specialty.create({
        data: {
          name,
          description,
        },
      });

      return NextResponse.json(
        {
          category: {
            id: specialty.id,
            name: specialty.name,
            type: "specialty",
            description: specialty.description,
          },
        },
        { status: 201 }
      );
    } else {
      // For medicine and lab categories, return a mock response
      // since they're predefined in the code
      return NextResponse.json(
        {
          category: {
            id: name.toLowerCase().replace(/\s+/g, "-"),
            name,
            type,
            description,
          },
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
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

    const { id, name, description, type } = await request.json();

    if (!id || !name) {
      return NextResponse.json(
        { error: "ID and name are required" },
        { status: 400 }
      );
    }

    // Only specialty categories can be updated in the database
    if (type === "specialty") {
      const specialty = await prisma.specialty.update({
        where: { id },
        data: { name, description },
      });

      return NextResponse.json({
        category: {
          id: specialty.id,
          name: specialty.name,
          type: "specialty",
          description: specialty.description,
        },
      });
    } else {
      // For medicine and lab categories, return a mock response
      return NextResponse.json({
        category: {
          id,
          name,
          type,
          description,
        },
      });
    }
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
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
    const type = searchParams.get("type");

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    // Only specialty categories can be deleted from the database
    if (type === "specialty") {
      await prisma.specialty.update({
        where: { id },
        data: { is_active: false },
      });
    }

    return NextResponse.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
