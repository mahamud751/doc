import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJWT } from "@/lib/auth";

// Get patient's wishlist
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyJWT(token);

    if (!decoded || decoded.role !== "PATIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if this is a check for a specific item
    const { searchParams } = new URL(request.url);
    const checkItemId = searchParams.get("check_item_id");
    const checkItemType = searchParams.get("check_item_type");

    if (checkItemId && checkItemType) {
      // Check if specific item is in wishlist
      const wishlist = await prisma.wishlist.findUnique({
        where: { patient_id: decoded.userId },
        include: {
          items: {
            where: {
              item_id: checkItemId,
              item_type: checkItemType,
            },
          },
        },
      });

      return NextResponse.json({
        success: true,
        inWishlist: wishlist?.items && wishlist.items.length > 0,
      });
    }

    // Get or create wishlist for patient
    let wishlist = await prisma.wishlist.findUnique({
      where: { patient_id: decoded.userId },
      include: {
        items: true,
      },
    });

    // If no wishlist exists, create one
    if (!wishlist) {
      wishlist = await prisma.wishlist.create({
        data: {
          patient_id: decoded.userId,
        },
        include: {
          items: true,
        },
      });
    }

    // Fetch related items data separately
    const medicineIds = wishlist.items
      .filter((item) => item.item_type === "MEDICINE")
      .map((item) => item.item_id);

    const labTestIds = wishlist.items
      .filter((item) => item.item_type === "LAB_TEST")
      .map((item) => item.item_id);

    const labPackageIds = wishlist.items
      .filter((item) => item.item_type === "LAB_PACKAGE")
      .map((item) => item.item_id);

    const [medicines, labTests, labPackages] = await Promise.all([
      medicineIds.length > 0
        ? prisma.medicine.findMany({
            where: { id: { in: medicineIds } },
          })
        : Promise.resolve([]),
      labTestIds.length > 0
        ? prisma.labTest.findMany({
            where: { id: { in: labTestIds } },
          })
        : Promise.resolve([]),
      labPackageIds.length > 0
        ? prisma.labPackage.findMany({
            where: { id: { in: labPackageIds } },
          })
        : Promise.resolve([]),
    ]);

    // Transform items to include the actual item data
    const items = wishlist.items.map((item) => {
      let itemData = null;
      switch (item.item_type) {
        case "MEDICINE":
          itemData = medicines.find((m) => m.id === item.item_id) || null;
          break;
        case "LAB_TEST":
          itemData = labTests.find((t) => t.id === item.item_id) || null;
          break;
        case "LAB_PACKAGE":
          itemData = labPackages.find((p) => p.id === item.item_id) || null;
          break;
      }

      return {
        ...item,
        itemData,
      };
    });

    return NextResponse.json({
      success: true,
      wishlist: {
        ...wishlist,
        items,
      },
    });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Add item to wishlist
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyJWT(token);

    if (!decoded || decoded.role !== "PATIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { item_type, item_id } = body;

    // Validate item_type
    if (!["MEDICINE", "LAB_TEST", "LAB_PACKAGE"].includes(item_type)) {
      return NextResponse.json({ error: "Invalid item type" }, { status: 400 });
    }

    // Check if item exists
    let itemExists = false;
    switch (item_type) {
      case "MEDICINE":
        const medicine = await prisma.medicine.findUnique({
          where: { id: item_id },
        });
        itemExists = !!medicine;
        break;
      case "LAB_TEST":
        const labTest = await prisma.labTest.findUnique({
          where: { id: item_id },
        });
        itemExists = !!labTest;
        break;
      case "LAB_PACKAGE":
        const labPackage = await prisma.labPackage.findUnique({
          where: { id: item_id },
        });
        itemExists = !!labPackage;
        break;
    }

    if (!itemExists) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Get or create wishlist
    let wishlist = await prisma.wishlist.findUnique({
      where: { patient_id: decoded.userId },
    });

    if (!wishlist) {
      wishlist = await prisma.wishlist.create({
        data: {
          patient_id: decoded.userId,
        },
      });
    }

    // Check if item is already in wishlist
    const existingItem = await prisma.wishlistItem.findFirst({
      where: {
        wishlist_id: wishlist.id,
        item_type,
        item_id,
      },
    });

    if (existingItem) {
      return NextResponse.json(
        { error: "Item already in wishlist" },
        { status: 400 }
      );
    }

    // Add item to wishlist
    const wishlistItem = await prisma.wishlistItem.create({
      data: {
        wishlist_id: wishlist.id,
        item_type,
        item_id,
      },
    });

    // Get the item data
    let itemData = null;
    switch (item_type) {
      case "MEDICINE":
        itemData = await prisma.medicine.findUnique({
          where: { id: item_id },
        });
        break;
      case "LAB_TEST":
        itemData = await prisma.labTest.findUnique({
          where: { id: item_id },
        });
        break;
      case "LAB_PACKAGE":
        itemData = await prisma.labPackage.findUnique({
          where: { id: item_id },
        });
        break;
    }

    return NextResponse.json({
      success: true,
      message: "Item added to wishlist",
      item: {
        ...wishlistItem,
        itemData,
      },
    });
  } catch (error) {
    console.error("Error adding item to wishlist:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Remove item from wishlist
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyJWT(token);

    if (!decoded || decoded.role !== "PATIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const item_id = searchParams.get("item_id");

    if (!item_id) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      );
    }

    // Get patient's wishlist
    const wishlist = await prisma.wishlist.findUnique({
      where: { patient_id: decoded.userId },
    });

    if (!wishlist) {
      return NextResponse.json(
        { error: "Wishlist not found" },
        { status: 404 }
      );
    }

    // Remove item from wishlist
    await prisma.wishlistItem.deleteMany({
      where: {
        wishlist_id: wishlist.id,
        item_id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Item removed from wishlist",
    });
  } catch (error) {
    console.error("Error removing item from wishlist:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
