import { verifyAuthToken } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { Prisma, User } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const whereClause: Prisma.LabTestWhereInput = {
      is_active: true,
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category && category !== "all") {
      whereClause.category = category;
    }

    const [tests, totalCount] = await Promise.all([
      prisma.labTest.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: {
          name: "asc",
        },
      }),
      prisma.labTest.count({ where: whereClause }),
    ]);

    // Get unique categories
    const categories = await prisma.labTest.findMany({
      select: {
        category: true,
      },
      distinct: ["category"],
    });

    const uniqueCategories = categories.map((cat) => cat.category);

    return NextResponse.json({
      success: true,
      tests,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
      categories: uniqueCategories,
    });
  } catch (error) {
    console.error("Error fetching lab tests:", error);
    return NextResponse.json(
      { error: "Failed to fetch lab tests" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authorization
    const authResult = (await verifyAuthToken(request)) as AuthResult;
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "SUPERADMIN", "LAB"].includes(authResult.user.role)) {
      return NextResponse.json(
        { error: "Forbidden: Admin or Lab access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      code,
      description,
      category,
      price,
      sample_type,
      preparation_required,
      preparation_instructions,
      reporting_time,
      normal_range,
    } = body;

    // Validate required fields
    if (
      !name ||
      !code ||
      !category ||
      price === undefined ||
      !sample_type ||
      !reporting_time
    ) {
      return NextResponse.json(
        {
          error:
            "Name, code, category, price, sample_type, and reporting_time are required",
        },
        { status: 400 }
      );
    }

    // Check if test with same name or code exists
    const existingTest = await prisma.labTest.findFirst({
      where: {
        OR: [
          {
            name: {
              equals: name,
              mode: "insensitive",
            },
          },
          {
            code: {
              equals: code,
              mode: "insensitive",
            },
          },
        ],
      },
    });

    if (existingTest) {
      return NextResponse.json(
        { error: "Lab test with this name or code already exists" },
        { status: 400 }
      );
    }

    // Create lab test
    const labTest = await prisma.labTest.create({
      data: {
        name,
        code,
        description,
        category,
        price: parseFloat(price),
        sample_type,
        preparation_required: Boolean(preparation_required),
        preparation_instructions,
        reporting_time,
        normal_range,
        is_active: true,
      },
    });

    // Log the creation
    await prisma.auditLog.create({
      data: {
        user_id: authResult.user.id,
        action: "CREATE",
        resource: "LabTest",
        resource_id: labTest.id,
        details: {
          test_name: name,
          category,
          price,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Lab test created successfully",
        test: labTest,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating lab test:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verify admin authorization
    const authResult = (await verifyAuthToken(request)) as AuthResult;
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "SUPERADMIN", "LAB"].includes(authResult.user.role)) {
      return NextResponse.json(
        { error: "Forbidden: Admin or Lab access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      id,
      name,
      code,
      description,
      category,
      price,
      sample_type,
      preparation_required,
      preparation_instructions,
      reporting_time,
      normal_range,
      is_active,
    } = body;

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { error: "Test ID is required" },
        { status: 400 }
      );
    }

    // Update lab test
    const labTest = await prisma.labTest.update({
      where: { id },
      data: {
        name,
        code,
        description,
        category,
        price: price !== undefined ? parseFloat(price) : undefined,
        sample_type,
        preparation_required:
          preparation_required !== undefined
            ? Boolean(preparation_required)
            : undefined,
        preparation_instructions,
        reporting_time,
        normal_range,
        is_active,
      },
    });

    // Log the update
    await prisma.auditLog.create({
      data: {
        user_id: authResult.user.id,
        action: "UPDATE",
        resource: "LabTest",
        resource_id: labTest.id,
        details: {
          test_name: name,
          category,
          price,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Lab test updated successfully",
        test: labTest,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating lab test:", error);

    if ((error as { code?: string }).code === "P2025") {
      return NextResponse.json(
        { error: "Lab test not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify admin authorization
    const authResult = (await verifyAuthToken(request)) as AuthResult;
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "SUPERADMIN", "LAB"].includes(authResult.user.role)) {
      return NextResponse.json(
        { error: "Forbidden: Admin or Lab access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Test ID is required" },
        { status: 400 }
      );
    }

    // Delete lab test
    const labTest = await prisma.labTest.delete({
      where: { id },
    });

    // Log the deletion
    await prisma.auditLog.create({
      data: {
        user_id: authResult.user.id,
        action: "DELETE",
        resource: "LabTest",
        resource_id: labTest.id,
        details: {
          test_name: labTest.name,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Lab test deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting lab test:", error);

    if ((error as { code?: string }).code === "P2025") {
      return NextResponse.json(
        { error: "Lab test not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
