import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { orderId } = resolvedParams;
    
    console.log("Fetching order:", orderId);
    
    // Fetch the order with all necessary details
    const labOrder = await prisma.labOrder.findUnique({
      where: { id: orderId },
      include: {
        patient: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        package: {
          select: {
            name: true,
            description: true,
            price: true,
          },
        },
        test: {
          select: {
            name: true,
            description: true,
            price: true,
          },
        },
      },
    });

    console.log("Lab order result:", labOrder);

    if (!labOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Order found",
      order: labOrder
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "Failed to fetch order: " + (error as Error).message },
      { status: 500 }
    );
  }
}