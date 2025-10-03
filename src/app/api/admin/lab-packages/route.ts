import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth-utils";
import { LabTest, Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    // Verify admin authorization
    const authResult = await verifyAuthToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "SUPERADMIN", "LAB"].includes(authResult.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");

    const whereClause: Prisma.LabPackageWhereInput = {
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

    const packages = await prisma.labPackage.findMany({
      where: whereClause,
      orderBy: {
        created_at: "desc",
      },
      include: {
        lab_package_tests: {
          include: {
            test: true,
          },
        },
      },
    });

    // Transform data to include computed fields and tests_included for compatibility
    const transformedPackages = packages.map((pkg) => ({
      ...pkg,
      price: parseFloat(pkg.price.toString()),
      tests_included: pkg.lab_package_tests.map((pt) => pt.test.name),
    }));

    return NextResponse.json({
      packages: transformedPackages,
      total: transformedPackages.length,
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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const packageData = await request.json();
    const {
      name,
      description,
      category,
      tests_included, // This should be test_ids now
      test_ids,
      price,
      preparation_required,
      preparation_instructions,
      sample_type,
      reporting_time,
      is_home_collection,
    } = packageData;

    // Validate required fields
    if (!name || !category || !price) {
      return NextResponse.json(
        { error: "Name, category, and price are required" },
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

    // Get test IDs (support both tests_included and test_ids for backward compatibility)
    const actualTestIds = test_ids || tests_included || [];

    // Verify all test IDs exist if provided
    let tests: LabTest[] = [];
    if (Array.isArray(actualTestIds) && actualTestIds.length > 0) {
      tests = await prisma.labTest.findMany({
        where: {
          id: {
            in: actualTestIds,
          },
        },
      });

      if (tests.length !== actualTestIds.length) {
        return NextResponse.json(
          { error: "One or more test IDs are invalid" },
          { status: 400 }
        );
      }
    }

    // Create lab package
    const labPackage = await prisma.labPackage.create({
      data: {
        name,
        description,
        category,
        price: parseFloat(price),
        preparation_required: Boolean(preparation_required),
        preparation_instructions,
        sample_type,
        reporting_time,
        is_home_collection: Boolean(is_home_collection),
        is_active: true,
        lab_package_tests: {
          create: tests.map((test) => ({
            test: {
              connect: { id: test.id },
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
      price: parseFloat(labPackage.price.toString()),
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
          price: parseFloat(price),
          tests_count: tests.length,
        },
      },
    });

    return NextResponse.json(
      {
        package: transformedPackage,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating lab package:", error);
    return NextResponse.json(
      { error: "Failed to create lab package" },
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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const packageData = await request.json();
    const { id, test_ids, tests_included, ...updateData } = packageData;

    if (!id) {
      return NextResponse.json(
        { error: "Package ID is required" },
        { status: 400 }
      );
    }

    // Build update object
    const dataToUpdate: Prisma.LabPackageUpdateInput = {};

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

    // Handle test_ids update if provided (support both tests_included and test_ids)
    const actualTestIds = test_ids || tests_included;
    if (Array.isArray(actualTestIds)) {
      // Verify all test IDs exist
      const tests: LabTest[] = await prisma.labTest.findMany({
        where: {
          id: {
            in: actualTestIds,
          },
        },
      });

      if (tests.length !== actualTestIds.length) {
        return NextResponse.json(
          { error: "One or more test IDs are invalid" },
          { status: 400 }
        );
      }

      // Update the package tests relationship
      dataToUpdate.lab_package_tests = {
        deleteMany: {},
        create: tests.map((test) => ({
          test: {
            connect: { id: test.id },
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
      price: parseFloat(labPackage.price.toString()),
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

    return NextResponse.json({
      package: transformedPackage,
    });
  } catch (error) {
    console.error("Error updating lab package:", error);
    return NextResponse.json(
      { error: "Failed to update lab package" },
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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Package ID is required" },
        { status: 400 }
      );
    }

    // Soft delete - mark as inactive
    await prisma.labPackage.update({
      where: { id },
      data: { is_active: false },
    });

    // Log the deletion
    await prisma.auditLog.create({
      data: {
        user_id: authResult.user.id,
        action: "DELETE",
        resource: "LabPackage",
        resource_id: id,
        details: {
          package_id: id,
        },
      },
    });

    return NextResponse.json({ message: "Lab package deleted successfully" });
  } catch (error) {
    console.error("Error deleting lab package:", error);
    return NextResponse.json(
      { error: "Failed to delete lab package" },
      { status: 500 }
    );
  }
}
