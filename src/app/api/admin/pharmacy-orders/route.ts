import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    if (decoded.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const orders = await prisma.pharmacyOrder.findMany({
      include: {
        patient: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        prescription: {
          select: {
            drugs: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // Transform data to match expected interface
    const transformedOrders = orders.map((order: any) => ({
      id: order.id,
      patient_id: order.patient_id,
      prescription_id: order.prescription_id,
      vendor_id: order.vendor_id,
      status: order.status,
      total_amount: parseFloat(order.total_amount.toString()),
      delivery_address: order.delivery_address,
      delivery_date: order.delivery_date?.toISOString(),
      tracking_number: order.tracking_number,
      delivery_instructions: order.delivery_instructions,
      created_at: order.created_at.toISOString(),
      updated_at: order.updated_at.toISOString(),
      patient: {
        name: order.patient.name,
        email: order.patient.email,
        phone: order.patient.phone || "",
      },
      items: order.items || [],
    }));

    return NextResponse.json({
      orders: transformedOrders,
      total: transformedOrders.length,
    });
  } catch (error) {
    console.error("Error fetching pharmacy orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch pharmacy orders" },
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    if (decoded.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(request.url);
    const orderId = url.pathname.split("/").slice(-2, -1)[0]; // Extract order ID from path
    const { status } = await request.json();

    const validStatuses = [
      "PENDING",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
      "COMPLETED",
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updatedOrder = await prisma.pharmacyOrder.update({
      where: { id: orderId },
      data: { status },
      include: {
        patient: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Order status updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Error updating pharmacy order:", error);
    return NextResponse.json(
      { error: "Failed to update pharmacy order" },
      { status: 500 }
    );
  }
}
