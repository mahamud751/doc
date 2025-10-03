import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth-utils";
import { Prisma } from "@prisma/client";

// Define type for JWT payload

// GET all lab tests for admin dropdown
export async function GET(request: NextRequest) {
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

    const tests = await prisma.labTest.findMany({
      where: {
        is_active: true,
      },
      select: {
        id: true,
        name: true,
        code: true,
        price: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      tests,
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
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Test ID is required" },
        { status: 400 }
      );
    }

    // Build update object
    const dataToUpdate: Prisma.LabTestUpdateInput = {};

    if (updateData.name !== undefined) dataToUpdate.name = updateData.name;
    if (updateData.code !== undefined) dataToUpdate.code = updateData.code;
    if (updateData.description !== undefined)
      dataToUpdate.description = updateData.description;
    if (updateData.category !== undefined)
      dataToUpdate.category = updateData.category;
    if (updateData.price !== undefined)
      dataToUpdate.price = parseFloat(updateData.price);
    if (updateData.sample_type !== undefined)
      dataToUpdate.sample_type = updateData.sample_type;
    if (updateData.preparation_required !== undefined)
      dataToUpdate.preparation_required = Boolean(
        updateData.preparation_required
      );
    if (updateData.preparation_instructions !== undefined)
      dataToUpdate.preparation_instructions =
        updateData.preparation_instructions;
    if (updateData.reporting_time !== undefined)
      dataToUpdate.reporting_time = updateData.reporting_time;
    if (updateData.normal_range !== undefined)
      dataToUpdate.normal_range = updateData.normal_range;
    if (updateData.is_active !== undefined)
      dataToUpdate.is_active = Boolean(updateData.is_active);

    // Update lab test
    const labTest = await prisma.labTest.update({
      where: { id },
      data: dataToUpdate,
    });

    // Log the update
    await prisma.auditLog.create({
      data: {
        user_id: authResult.user.id,
        action: "UPDATE",
        resource: "LabTest",
        resource_id: labTest.id,
        details: updateData,
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
        { error: "Test ID is required" },
        { status: 400 }
      );
    }

    // Check if this test is used in any packages
    const packageTests = await prisma.labPackageTest.findMany({
      where: { test_id: id },
    });

    if (packageTests.length > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete test that is part of packages. Remove from packages first.",
        },
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
