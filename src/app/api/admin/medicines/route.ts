import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

// Define type for JWT payload
interface JwtPayload {
  role: string;
  [key: string]: unknown;
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
    const category = searchParams.get("category");

    const whereClause: Prisma.MedicineWhereInput = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { generic_name: { contains: search, mode: "insensitive" } },
        { manufacturer: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category && category !== "all") {
      whereClause.category = category;
    }

    const medicines = await prisma.medicine.findMany({
      where: whereClause,
      orderBy: {
        created_at: "desc",
      },
    });

    // Transform data to include computed fields
    const transformedMedicines = medicines.map((medicine) => ({
      ...medicine,
      unit_price: parseFloat(medicine.unit_price.toString()),
      stock_status:
        medicine.stock_quantity < 10
          ? "Critical"
          : medicine.stock_quantity < 50
          ? "Low"
          : "Good",
    }));

    return NextResponse.json({
      medicines: transformedMedicines,
      total: transformedMedicines.length,
    });
  } catch (error) {
    console.error("Error fetching medicines:", error);
    return NextResponse.json(
      { error: "Failed to fetch medicines" },
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

    const medicineData = await request.json();

    const medicine = await prisma.medicine.create({
      data: {
        ...medicineData,
        unit_price: parseFloat(medicineData.unit_price),
        stock_quantity: parseInt(medicineData.stock_quantity) || 0,
      },
    });

    return NextResponse.json(
      {
        medicine: {
          ...medicine,
          unit_price: parseFloat(medicine.unit_price.toString()),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating medicine:", error);
    return NextResponse.json(
      { error: "Failed to create medicine" },
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

    const { id, ...updateData } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Medicine ID is required" },
        { status: 400 }
      );
    }

    // Convert numeric fields
    if (updateData.unit_price) {
      updateData.unit_price = parseFloat(updateData.unit_price);
    }
    if (updateData.stock_quantity !== undefined) {
      updateData.stock_quantity = parseInt(updateData.stock_quantity);
    }

    const medicine = await prisma.medicine.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      medicine: {
        ...medicine,
        unit_price: parseFloat(medicine.unit_price.toString()),
      },
    });
  } catch (error) {
    console.error("Error updating medicine:", error);
    return NextResponse.json(
      { error: "Failed to update medicine" },
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
        { error: "Medicine ID is required" },
        { status: 400 }
      );
    }

    // Soft delete - mark as inactive
    await prisma.medicine.update({
      where: { id },
      data: { is_active: false },
    });

    return NextResponse.json({ message: "Medicine deleted successfully" });
  } catch (error) {
    console.error("Error deleting medicine:", error);
    return NextResponse.json(
      { error: "Failed to delete medicine" },
      { status: 500 }
    );
  }
}
