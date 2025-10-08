import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJWT } from "@/lib/auth";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
// @ts-ignore
import fontkit from "@pdf-lib/fontkit";

// Generate prescription PDF
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: prescriptionId } = await params;

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyJWT(token);

    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get prescription with all related data
    const prescription = await prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: {
        appointment: {
          include: {
            patient: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                patient_profile: true,
              },
            },
            doctor: {
              select: {
                id: true,
                name: true,
                doctor_profile: true,
              },
            },
          },
        },
      },
    });

    if (!prescription) {
      return NextResponse.json(
        { error: "Prescription not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to access this prescription
    if (
      decoded.role !== "ADMIN" &&
      decoded.role !== "SUPERADMIN" &&
      prescription.patient_id !== decoded.userId &&
      prescription.doctor_id !== decoded.userId
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const page = pdfDoc.addPage([600, 800]);
    const { width, height } = page.getSize();

    // Add header
    page.drawText("MEDICAL PRESCRIPTION", {
      x: width / 2 - 100,
      y: height - 50,
      size: 20,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    // Add clinic/hospital info
    page.drawText("Telehealth Medical Services", {
      x: width / 2 - 90,
      y: height - 80,
      size: 14,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    page.drawText("www.telehealth.com", {
      x: width / 2 - 60,
      y: height - 100,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });

    // Add horizontal line
    page.drawLine({
      start: { x: 50, y: height - 120 },
      end: { x: width - 50, y: height - 120 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // Add patient info
    let yPos = height - 150;

    page.drawText("Patient Information:", {
      x: 50,
      y: yPos,
      size: 14,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    yPos -= 20;
    page.drawText(`Name: ${prescription.appointment.patient.name}`, {
      x: 60,
      y: yPos,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });

    yPos -= 20;
    page.drawText(`Phone: ${prescription.appointment.patient.phone}`, {
      x: 60,
      y: yPos,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });

    yPos -= 20;
    page.drawText(`Email: ${prescription.appointment.patient.email}`, {
      x: 60,
      y: yPos,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });

    if (prescription.appointment.patient.patient_profile?.date_of_birth) {
      yPos -= 20;
      const dob = new Date(
        prescription.appointment.patient.patient_profile.date_of_birth
      );
      page.drawText(`Date of Birth: ${dob.toLocaleDateString()}`, {
        x: 60,
        y: yPos,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });
    }

    if (prescription.appointment.patient.patient_profile?.blood_group) {
      yPos -= 20;
      page.drawText(
        `Blood Group: ${prescription.appointment.patient.patient_profile.blood_group}`,
        {
          x: 60,
          y: yPos,
          size: 12,
          font,
          color: rgb(0, 0, 0),
        }
      );
    }

    // Add doctor info
    yPos -= 40;
    page.drawText("Doctor Information:", {
      x: 50,
      y: yPos,
      size: 14,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    yPos -= 20;
    page.drawText(`Name: ${prescription.appointment.doctor.name}`, {
      x: 60,
      y: yPos,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });

    if (prescription.appointment.doctor.doctor_profile?.qualifications) {
      yPos -= 20;
      page.drawText(
        `Qualifications: ${prescription.appointment.doctor.doctor_profile.qualifications.join(
          ", "
        )}`,
        {
          x: 60,
          y: yPos,
          size: 12,
          font,
          color: rgb(0, 0, 0),
        }
      );
    }

    // Add appointment date
    yPos -= 20;
    const appointmentDate = new Date(prescription.appointment.scheduled_at);
    page.drawText(`Date: ${appointmentDate.toLocaleDateString()}`, {
      x: 60,
      y: yPos,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });

    // Add diagnosis
    yPos -= 40;
    page.drawText("Diagnosis:", {
      x: 50,
      y: yPos,
      size: 14,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    yPos -= 20;
    page.drawText(prescription.diagnosis || "No diagnosis provided", {
      x: 60,
      y: yPos,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });

    // Add medications
    if (prescription.drugs && prescription.drugs.length > 0) {
      yPos -= 40;
      page.drawText("Medications:", {
        x: 50,
        y: yPos,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      yPos -= 10;

      // Table headers
      page.drawText("Medicine", { x: 60, y: yPos, size: 12, font: boldFont });
      page.drawText("Dosage", { x: 200, y: yPos, size: 12, font: boldFont });
      page.drawText("Frequency", { x: 300, y: yPos, size: 12, font: boldFont });
      page.drawText("Duration", { x: 420, y: yPos, size: 12, font: boldFont });

      yPos -= 5;
      page.drawLine({
        start: { x: 50, y: yPos },
        end: { x: width - 50, y: yPos },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      yPos -= 20;

      prescription.drugs.forEach((drug: any) => {
        if (yPos < 100) {
          // Create new page if needed
          const newPage = pdfDoc.addPage([600, 800]);
          yPos = newPage.getHeight() - 50;
        }

        page.drawText(drug.name || "", { x: 60, y: yPos, size: 11, font });
        page.drawText(drug.dosage || "", { x: 200, y: yPos, size: 11, font });
        page.drawText(drug.frequency || "", {
          x: 300,
          y: yPos,
          size: 11,
          font,
        });
        page.drawText(drug.duration || "", { x: 420, y: yPos, size: 11, font });

        yPos -= 20;

        if (drug.instructions) {
          page.drawText(`Instructions: ${drug.instructions}`, {
            x: 70,
            y: yPos,
            size: 10,
            font,
            color: rgb(0.3, 0.3, 0.3),
          });
          yPos -= 20;
        }
      });
    }

    // Add general instructions
    if (prescription.instructions) {
      yPos -= 30;
      page.drawText("General Instructions:", {
        x: 50,
        y: yPos,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      yPos -= 20;
      page.drawText(prescription.instructions, {
        x: 60,
        y: yPos,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });
    }

    // Add follow-up instructions
    if (prescription.follow_up_instructions) {
      yPos -= 30;
      page.drawText("Follow-up Instructions:", {
        x: 50,
        y: yPos,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      yPos -= 20;
      page.drawText(prescription.follow_up_instructions, {
        x: 60,
        y: yPos,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });
    }

    // Add signature area
    yPos -= 60;
    page.drawText("Doctor Signature: ____________________", {
      x: 50,
      y: yPos,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    // Add footer
    page.drawText(
      "This is a computer-generated prescription. No signature required for teleconsultation.",
      {
        x: 50,
        y: 30,
        size: 10,
        font,
        color: rgb(0.5, 0.5, 0.5),
      }
    );

    // Save and return PDF
    const pdfBytes = await pdfDoc.save();

    // Update prescription with PDF URL (in a real app, you'd save the PDF to storage)
    await prisma.prescription.update({
      where: { id: prescriptionId },
      data: {
        pdf_url: `/api/prescriptions/${prescriptionId}/pdf`,
      },
    });

    // Return PDF
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=prescription-${prescriptionId.substring(
          0,
          8
        )}.pdf`,
      },
    });
  } catch (error) {
    console.error("Error generating prescription PDF:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
