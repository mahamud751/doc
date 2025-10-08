import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth-utils";
// @ts-ignore
import { PDFDocument, rgb } from "pdf-lib";
// @ts-ignore
import fontkit from "@pdf-lib/fontkit";

// Use the new Next.js 15 App Router syntax
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    console.log("PDF generation request received");

    // Await params as required by Next.js App Router
    const resolvedParams = await params;
    const { orderId } = resolvedParams;
    console.log("Order ID:", orderId);

    // Verify authentication
    const authResult = await verifyAuthToken(request);
    console.log("Auth result:", authResult);

    if (!authResult.success || !authResult.user) {
      console.log("Authentication failed");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user } = authResult;
    console.log("User:", user);

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

    console.log("Lab order:", labOrder);

    if (!labOrder) {
      console.log("Order not found");
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check if the user is authorized to access this order
    if (labOrder.patient_id !== user.id && user.role !== "ADMIN") {
      console.log("User not authorized to access this order");
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Create PDF using pdf-lib instead of pdfkit to avoid font issues
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    // Add a page to the document
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points

    // Set font size and add content
    const fontSize = 12;

    // Add title
    page.drawText("Lab Order Report", {
      x: 50,
      y: 750,
      size: 20,
      color: rgb(0, 0, 0),
    });

    // Add order details
    let yPosition = 700;

    page.drawText(`Order ID: ${labOrder.id}`, {
      x: 50,
      y: yPosition,
      size: fontSize,
      color: rgb(0, 0, 0),
    });
    yPosition -= 20;

    page.drawText(
      `Order Date: ${new Date(labOrder.created_at).toLocaleDateString()}`,
      {
        x: 50,
        y: yPosition,
        size: fontSize,
        color: rgb(0, 0, 0),
      }
    );
    yPosition -= 20;

    page.drawText(`Status: ${labOrder.status}`, {
      x: 50,
      y: yPosition,
      size: fontSize,
      color: rgb(0, 0, 0),
    });
    yPosition -= 30;

    // Patient details
    page.drawText("Patient Information:", {
      x: 50,
      y: yPosition,
      size: 14,
      color: rgb(0, 0, 0),
    });
    yPosition -= 20;

    page.drawText(`Name: ${labOrder.patient.name}`, {
      x: 50,
      y: yPosition,
      size: fontSize,
      color: rgb(0, 0, 0),
    });
    yPosition -= 20;

    page.drawText(`Email: ${labOrder.patient.email}`, {
      x: 50,
      y: yPosition,
      size: fontSize,
      color: rgb(0, 0, 0),
    });
    yPosition -= 20;

    page.drawText(`Phone: ${labOrder.patient.phone}`, {
      x: 50,
      y: yPosition,
      size: fontSize,
      color: rgb(0, 0, 0),
    });
    yPosition -= 30;

    // Order type - show Test or Package based on what was ordered
    if (labOrder.package) {
      page.drawText("Package Order", {
        x: 50,
        y: yPosition,
        size: 16,
        color: rgb(0, 0, 0),
      });
      yPosition -= 30;

      page.drawText("Package Details:", {
        x: 50,
        y: yPosition,
        size: 14,
        color: rgb(0, 0, 0),
      });
      yPosition -= 20;

      page.drawText(`Package Name: ${labOrder.package.name}`, {
        x: 50,
        y: yPosition,
        size: fontSize,
        color: rgb(0, 0, 0),
      });
      yPosition -= 20;

      page.drawText(`Description: ${labOrder.package.description || "N/A"}`, {
        x: 50,
        y: yPosition,
        size: fontSize,
        color: rgb(0, 0, 0),
      });
      yPosition -= 20;

      page.drawText(`Price: $${labOrder.package.price.toFixed(2)}`, {
        x: 50,
        y: yPosition,
        size: fontSize,
        color: rgb(0, 0, 0),
      });
    } else if (labOrder.test) {
      page.drawText("Test Order", {
        x: 50,
        y: yPosition,
        size: 16,
        color: rgb(0, 0, 0),
      });
      yPosition -= 30;

      page.drawText("Test Details:", {
        x: 50,
        y: yPosition,
        size: 14,
        color: rgb(0, 0, 0),
      });
      yPosition -= 20;

      page.drawText(`Test Name: ${labOrder.test.name}`, {
        x: 50,
        y: yPosition,
        size: fontSize,
        color: rgb(0, 0, 0),
      });
      yPosition -= 20;

      page.drawText(`Description: ${labOrder.test.description || "N/A"}`, {
        x: 50,
        y: yPosition,
        size: fontSize,
        color: rgb(0, 0, 0),
      });
      yPosition -= 20;

      page.drawText(`Price: $${labOrder.test.price.toFixed(2)}`, {
        x: 50,
        y: yPosition,
        size: fontSize,
        color: rgb(0, 0, 0),
      });
    }

    yPosition -= 30;
    page.drawText(`Total Amount: $${labOrder.total_amount.toFixed(2)}`, {
      x: 50,
      y: yPosition,
      size: fontSize,
      color: rgb(0, 0, 0),
    });

    // Instructions
    if (labOrder.instructions) {
      yPosition -= 30;
      page.drawText("Instructions:", {
        x: 50,
        y: yPosition,
        size: 14,
        color: rgb(0, 0, 0),
      });
      yPosition -= 20;

      page.drawText(labOrder.instructions, {
        x: 50,
        y: yPosition,
        size: fontSize,
        color: rgb(0, 0, 0),
      });
    }

    // Footer
    yPosition -= 30;
    page.drawText("Generated on: " + new Date().toLocaleString(), {
      x: 50,
      y: 50,
      size: 10,
      color: rgb(0, 0, 0),
    });

    // Serialize the PDF to bytes
    const pdfBytes = await pdfDoc.save();

    // Convert Uint8Array to Buffer for NextResponse
    const buffer = Buffer.from(pdfBytes);

    // Set headers for PDF download
    const headers = new Headers();
    headers.set("Content-Type", "application/pdf");
    headers.set(
      "Content-Disposition",
      `attachment; filename="lab-order-${orderId}.pdf"`
    );

    console.log("PDF generated successfully");
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="lab-order-${orderId}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF: " + (error as Error).message },
      { status: 500 }
    );
  }
}
