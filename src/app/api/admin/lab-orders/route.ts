import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

// Define type for JWT payload
interface JwtPayload {
  role: string;
  [key: string]: unknown;
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

    const orders = await prisma.labOrder.findMany({
      include: {
        patient: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // Transform data to match expected interface
    const transformedOrders = orders.map((order) => ({
      id: order.id,
      patient_id: order.patient_id,
      appointment_id: order.appointment_id,
      package_id: order.package_id,
      vendor_id: order.vendor_id,
      status: order.status,
      total_amount: parseFloat(order.total_amount.toString()),
      sample_collection_date: order.sample_collection_date?.toISOString(),
      sample_collection_address: order.sample_collection_address,
      result_url: order.result_url,
      result_pdf: order.result_pdf,
      lab_report_date: order.lab_report_date?.toISOString(),
      instructions: order.instructions,
      created_at: order.created_at.toISOString(),
      updated_at: order.updated_at.toISOString(),
      patient: {
        name: order.patient.name,
        email: order.patient.email,
        phone: order.patient.phone || "",
      },
    }));

    return NextResponse.json({
      orders: transformedOrders,
      total: transformedOrders.length,
    });
  } catch (error) {
    console.error("Error fetching lab orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch lab orders" },
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

    const updatedOrder = await prisma.labOrder.update({
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
    console.error("Error updating lab order:", error);
    return NextResponse.json(
      { error: "Failed to update lab order" },
      { status: 500 }
    );
  }
}
