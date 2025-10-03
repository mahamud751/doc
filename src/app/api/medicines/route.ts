import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJWT } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");

    const whereClause: Prisma.MedicineWhereInput = {
      is_active: true,
    };

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
        name: "asc",
      },
    });

    return NextResponse.json({ medicines });
  } catch (error) {
    console.error("Error fetching medicines:", error);
    return NextResponse.json(
      { error: "Failed to fetch medicines" },
      { status: 500 }
    );
  }
}

// Create new medicine (Admin only)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyJWT(token);

    if (
      !decoded ||
      !["ADMIN", "SUPERADMIN", "PHARMACY"].includes(decoded.role)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const medicineData = await request.json();

    const {
      name,
      generic_name,
      brand_name,
      manufacturer,
      category,
      strength,
      unit_price,
      stock_quantity,
      description,
      side_effects,
      contraindications,
      dosage_instructions,
      prescription_required,
      image_url,
    } = medicineData;

    if (!name || !category || !unit_price) {
      return NextResponse.json(
        {
          error: "Name, category, and unit price are required",
        },
        { status: 400 }
      );
    }

    const medicine = await prisma.medicine.create({
      data: {
        name,
        generic_name,
        brand_name,
        manufacturer,
        category,
        strength,
        unit_price: parseFloat(unit_price),
        stock_quantity: parseInt(stock_quantity) || 0,
        description,
        side_effects,
        contraindications,
        dosage_instructions,
        prescription_required: prescription_required || true,
        image_url,
      },
    });

    return NextResponse.json({ medicine }, { status: 201 });
  } catch (error) {
    console.error("Error creating medicine:", error);
    return NextResponse.json(
      { error: "Failed to create medicine" },
      { status: 500 }
    );
  }
}

// Update medicine (Admin only)
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyJWT(token);

    if (
      !decoded ||
      !["ADMIN", "SUPERADMIN", "PHARMACY"].includes(decoded.role)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const updatedMedicine = await prisma.medicine.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ medicine: updatedMedicine });
  } catch (error) {
    console.error("Error updating medicine:", error);
    return NextResponse.json(
      { error: "Failed to update medicine" },
      { status: 500 }
    );
  }
}

// Delete medicine (Admin only)
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyJWT(token);

    if (!decoded || !["ADMIN", "SUPERADMIN"].includes(decoded.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    if ((error as Prisma.PrismaClientKnownRequestError).code === "P2025") {
      return NextResponse.json(
        { error: "Medicine not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete medicine" },
      { status: 500 }
    );
  }
}
