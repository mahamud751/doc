import { verifyAuthToken } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuthToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctorId");
    const status = searchParams.get("status");

    console.log("Testing appointments API with params:", { doctorId, status });

    const where: any = {};

    if (doctorId) {
      where.doctor_id = doctorId;
    }

    if (status) {
      try {
        const statusArray = JSON.parse(decodeURIComponent(status));
        if (Array.isArray(statusArray)) {
          where.status = { in: statusArray };
        }
      } catch (e) {
        where.status = status;
      }
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        doctor: {
          include: {
            doctor_profile: true,
          },
        },
        patient: {
          include: {
            patient_profile: true,
          },
        },
      },
      orderBy: [{ scheduled_at: "asc" }],
    });

    console.log("Found appointments:", appointments.length);

    return NextResponse.json({
      appointments,
      count: appointments.length,
    });
  } catch (error) {
    console.error("Test appointments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointments", details: error.message },
      { status: 500 }
    );
  }
}