import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";

export async function GET(request: NextRequest) {
  try {
    // Create a simple PDF
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
    });

    // Collect PDF data
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => {});

    // Add simple content
    doc.fontSize(20).text("Test PDF", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text("This is a test PDF generated successfully!");
    doc.moveDown();
    doc.text("Generated on: " + new Date().toLocaleString());

    doc.end();

    // Wait for PDF generation to complete
    const pdfBuffer = await new Promise<Buffer>((resolve) => {
      doc.on("end", () => {
        resolve(Buffer.concat(chunks));
      });
    });

    // Convert Buffer to Uint8Array for NextResponse
    const uint8Array = new Uint8Array(pdfBuffer);

    // Set headers for PDF download
    const headers = new Headers();
    headers.set("Content-Type", "application/pdf");
    headers.set("Content-Disposition", `attachment; filename="test.pdf"`);

    return new NextResponse(uint8Array, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Error generating test PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate test PDF" },
      { status: 500 }
    );
  }
}