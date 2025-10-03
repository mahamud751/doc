import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth-utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      patient_id,
      patient_name,
      patient_phone,
      delivery_address,
      items,
      total_amount,
    } = body;

    // Validate required fields
    if (
      !patient_id ||
      !patient_name ||
      !patient_phone ||
      !delivery_address ||
      !items ||
      !total_amount
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Separate items by type
    const medicineItems = items.filter((item: any) => item.type === "medicine");
    const testItems = items.filter(
      (item: any) => item.type === "test" || item.type === "package"
    );

    const createdOrders = [];

    // Create PharmacyOrder for medicines
    if (medicineItems.length > 0) {
      const medicineOrder = await prisma.pharmacyOrder.create({
        data: {
          patient_id,
          total_amount: medicineItems.reduce(
            (sum: number, item: any) =>
              sum + parseFloat(item.price) * item.quantity,
            0
          ),
          delivery_address,
          status: "PENDING",
          items: medicineItems.map((item: any) => ({
            medicine_name: item.name,
            quantity: item.quantity,
            price: parseFloat(item.price),
          })),
        },
      });
      createdOrders.push({
        ...medicineOrder,
        order_type: "MEDICINE",
      });
    }

    // Create separate LabOrder for each test/package
    for (const item of testItems) {
      const labOrder = await prisma.labOrder.create({
        data: {
          patient_id,
          // If it's a package, set package_id, otherwise set test_id
          ...(item.type === "package"
            ? { package_id: item.id }
            : { test_id: item.id }),
          total_amount: parseFloat(item.price) * item.quantity,
          status: "PENDING",
          sample_collection_address: delivery_address,
          // Add instructions if available
          instructions: item.instructions || "",
        },
      });
      createdOrders.push({
        ...labOrder,
        order_type: "TEST",
      });
    }

    return NextResponse.json({ orders: createdOrders }, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patient_id");
    const orderId = searchParams.get("order_id");

    // For now, we'll return a simplified response since we're dealing with two different order types
    let pharmacyOrders: any[] = [];
    let labOrders: any[] = [];

    if (orderId) {
      // Try to find specific order
      try {
        const pharmacyOrder = await prisma.pharmacyOrder.findUnique({
          where: { id: orderId },
        });
        if (pharmacyOrder) {
          pharmacyOrders = [pharmacyOrder];
        } else {
          // Try lab order
          const labOrder = await prisma.labOrder.findUnique({
            where: { id: orderId },
          });
          if (labOrder) {
            labOrders = [labOrder];
          }
        }
      } catch (e) {
        // Try lab order
        const labOrder = await prisma.labOrder.findUnique({
          where: { id: orderId },
        });
        if (labOrder) {
          labOrders = [labOrder];
        }
      }
    } else if (patientId) {
      // Get orders for specific patient
      pharmacyOrders = await prisma.pharmacyOrder.findMany({
        where: { patient_id: patientId },
        orderBy: { created_at: "desc" },
      });

      labOrders = await prisma.labOrder.findMany({
        where: { patient_id: patientId },
        orderBy: { created_at: "desc" },
        include: {
          package: {
            select: {
              name: true,
            },
          },
          test: {
            select: {
              name: true,
            },
          },
        },
      });
    } else {
      // Get all orders (admin) - we need to verify auth for this
      const authHeader = request.headers.get("authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      pharmacyOrders = await prisma.pharmacyOrder.findMany({
        orderBy: { created_at: "desc" },
        include: {
          patient: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      labOrders = await prisma.labOrder.findMany({
        orderBy: { created_at: "desc" },
        include: {
          patient: {
            select: {
              name: true,
              email: true,
            },
          },
          package: {
            select: {
              name: true,
            },
          },
          test: {
            select: {
              name: true,
            },
          },
        },
      });
    }

    // Combine and format orders
    const orders = [
      ...pharmacyOrders.map((order) => ({
        ...order,
        order_type: "MEDICINE",
        items: order.items || [],
      })),
      ...labOrders.map((order) => {
        // For lab orders, we need to create items with test/package names
        let items: Array<{
          test_name?: string;
          price: number;
          quantity: number;
        }> = [];

        if (order.package) {
          // If it's a package order
          items = [
            {
              test_name: order.package.name,
              price: order.total_amount,
              quantity: 1,
            },
          ];
        } else if (order.test) {
          // If it's a single test order
          items = [
            {
              test_name: order.test.name,
              price: order.total_amount,
              quantity: 1,
            },
          ];
        }

        return {
          ...order,
          order_type: "TEST",
          items: items,
        };
      }),
    ].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
