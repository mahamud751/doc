import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    let whereClause: any = {
      is_active: true,
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category && category !== "all") {
      whereClause.category = category;
    }

    const [packages, totalCount] = await Promise.all([
      prisma.labPackage.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: {
          name: "asc",
        },
        include: {
          lab_package_tests: {
            include: {
              test: true,
            },
          },
        },
      }),
      prisma.labPackage.count({ where: whereClause }),
    ]);

    // Transform packages to include tests_included array for backward compatibility
    const transformedPackages = packages.map((pkg) => ({
      ...pkg,
      tests_included: pkg.lab_package_tests.map((pt) => pt.test.name),
    }));

    return NextResponse.json({
      success: true,
      packages: transformedPackages,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching lab packages:", error);
    return NextResponse.json(
      { error: "Failed to fetch lab packages" },
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

    if (!["ADMIN", "SUPERADMIN", "LAB"].includes(authResult.user.role)) {
      return NextResponse.json(
        { error: "Forbidden: Admin or Lab access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      category,
      test_ids, // Array of test IDs
      price,
      preparation_required,
      preparation_instructions,
      sample_type,
      reporting_time,
      is_home_collection,
    } = body;

    // Validate required fields
    if (
      !name ||
      !category ||
      !price ||
      !Array.isArray(test_ids) ||
      test_ids.length === 0
    ) {
      return NextResponse.json(
        { error: "Name, category, price, and test_ids (array) are required" },
        { status: 400 }
      );
    }

    // Check if package with same name exists
    const existingPackage = await prisma.labPackage.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
    });

    if (existingPackage) {
      return NextResponse.json(
        { error: "Lab package with this name already exists" },
        { status: 400 }
      );
    }

    // Verify all test IDs exist
    const tests = await prisma.labTest.findMany({
      where: {
        id: {
          in: test_ids,
        },
      },
    });

    if (tests.length !== test_ids.length) {
      return NextResponse.json(
        { error: "One or more test IDs are invalid" },
        { status: 400 }
      );
    }

    // Calculate total price from individual tests if not provided
    let calculatedPrice = parseFloat(price);
    if (isNaN(calculatedPrice)) {
      calculatedPrice = tests.reduce(
        (sum, test) => sum + parseFloat(test.price.toString()),
        0
      );
    }

    // Create lab package
    const labPackage = await prisma.labPackage.create({
      data: {
        name,
        description,
        category,
        price: calculatedPrice,
        preparation_required: Boolean(preparation_required),
        preparation_instructions,
        sample_type,
        reporting_time,
        is_home_collection: Boolean(is_home_collection),
        is_active: true,
        lab_package_tests: {
          create: test_ids.map((test_id: string) => ({
            test: {
              connect: { id: test_id },
            },
          })),
        },
      },
      include: {
        lab_package_tests: {
          include: {
            test: true,
          },
        },
      },
    });

    // Transform for response
    const transformedPackage = {
      ...labPackage,
      tests_included: labPackage.lab_package_tests.map((pt) => pt.test.name),
    };

    // Log the creation
    await prisma.auditLog.create({
      data: {
        user_id: authResult.user.id,
        action: "CREATE",
        resource: "LabPackage",
        resource_id: labPackage.id,
        details: {
          package_name: name,
          category,
          price: calculatedPrice,
          tests_count: test_ids.length,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Lab package created successfully",
        package: transformedPackage,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating lab package:", error);
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

    if (!["ADMIN", "SUPERADMIN", "LAB"].includes(authResult.user.role)) {
      return NextResponse.json(
        { error: "Forbidden: Admin or Lab access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, test_ids, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Package ID is required" },
        { status: 400 }
      );
    }

    // Build update object
    const dataToUpdate: any = {};

    if (updateData.name !== undefined) dataToUpdate.name = updateData.name;
    if (updateData.description !== undefined)
      dataToUpdate.description = updateData.description;
    if (updateData.category !== undefined)
      dataToUpdate.category = updateData.category;
    if (updateData.price !== undefined)
      dataToUpdate.price = parseFloat(updateData.price);
    if (updateData.preparation_required !== undefined)
      dataToUpdate.preparation_required = Boolean(
        updateData.preparation_required
      );
    if (updateData.preparation_instructions !== undefined)
      dataToUpdate.preparation_instructions =
        updateData.preparation_instructions;
    if (updateData.sample_type !== undefined)
      dataToUpdate.sample_type = updateData.sample_type;
    if (updateData.reporting_time !== undefined)
      dataToUpdate.reporting_time = updateData.reporting_time;
    if (updateData.is_home_collection !== undefined)
      dataToUpdate.is_home_collection = Boolean(updateData.is_home_collection);
    if (updateData.is_active !== undefined)
      dataToUpdate.is_active = Boolean(updateData.is_active);

    // Handle test_ids update if provided
    if (Array.isArray(test_ids)) {
      // Verify all test IDs exist
      const tests = await prisma.labTest.findMany({
        where: {
          id: {
            in: test_ids,
          },
        },
      });

      if (tests.length !== test_ids.length) {
        return NextResponse.json(
          { error: "One or more test IDs are invalid" },
          { status: 400 }
        );
      }

      // Update the package tests relationship
      dataToUpdate.lab_package_tests = {
        deleteMany: {},
        create: test_ids.map((test_id: string) => ({
          test: {
            connect: { id: test_id },
          },
        })),
      };
    }

    // Update lab package
    const labPackage = await prisma.labPackage.update({
      where: { id },
      data: dataToUpdate,
      include: {
        lab_package_tests: {
          include: {
            test: true,
          },
        },
      },
    });

    // Transform for response
    const transformedPackage = {
      ...labPackage,
      tests_included: labPackage.lab_package_tests.map((pt) => pt.test.name),
    };

    // Log the update
    await prisma.auditLog.create({
      data: {
        user_id: authResult.user.id,
        action: "UPDATE",
        resource: "LabPackage",
        resource_id: labPackage.id,
        details: updateData,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Lab package updated successfully",
        package: transformedPackage,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating lab package:", error);
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
        { error: "Package ID is required" },
        { status: 400 }
      );
    }

    // Delete lab package (this will cascade delete lab_package_tests due to foreign key constraint)
    const labPackage = await prisma.labPackage.delete({
      where: { id },
    });

    // Log the deletion
    await prisma.auditLog.create({
      data: {
        user_id: authResult.user.id,
        action: "DELETE",
        resource: "LabPackage",
        resource_id: labPackage.id,
        details: {
          package_name: labPackage.name,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Lab package deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting lab package:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
