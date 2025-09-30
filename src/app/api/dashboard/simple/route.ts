import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyJWT } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyJWT(token);

    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (decoded.role === "PATIENT") {
      return getPatientStats(decoded.userId);
    } else if (decoded.role === "DOCTOR") {
      return getDoctorStats(decoded.userId);
    } else if (["ADMIN", "SUPERADMIN"].includes(decoded.role)) {
      return getAdminStats();
    } else {
      return NextResponse.json({ error: "Invalid role" }, { status: 403 });
    }
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}

async function getPatientStats(userId: string) {
  try {
    const totalAppointments = await prisma.appointment.count({
      where: { patient_id: userId },
    });

    const completedAppointments = await prisma.appointment.count({
      where: {
        patient_id: userId,
        status: "COMPLETED",
      },
    });

    const upcomingAppointments = await prisma.appointment.count({
      where: {
        patient_id: userId,
        scheduled_at: { gte: new Date() },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    });

    const totalPrescriptions = await prisma.prescription.count({
      where: {
        appointment: {
          patient_id: userId,
        },
      },
    });

    return NextResponse.json({
      stats: {
        totalAppointments,
        completedAppointments,
        upcomingAppointments,
        totalPrescriptions,
      },
    });
  } catch (error) {
    console.error("Error fetching patient stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch patient stats" },
      { status: 500 }
    );
  }
}

async function getDoctorStats(userId: string) {
  try {
    const totalPatients = await prisma.appointment.findMany({
      where: { doctor_id: userId },
      select: { patient_id: true },
      distinct: ["patient_id"],
    });

    const totalAppointments = await prisma.appointment.count({
      where: { doctor_id: userId },
    });

    const completedAppointments = await prisma.appointment.count({
      where: {
        doctor_id: userId,
        status: "COMPLETED",
      },
    });

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const todayAppointments = await prisma.appointment.count({
      where: {
        doctor_id: userId,
        scheduled_at: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    return NextResponse.json({
      stats: {
        totalPatients: totalPatients.length,
        totalAppointments,
        completedAppointments,
        todayAppointments,
      },
    });
  } catch (error) {
    console.error("Error fetching doctor stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch doctor stats" },
      { status: 500 }
    );
  }
}

async function getAdminStats() {
  try {
    const totalUsers = await prisma.user.count();
    const totalPatients = await prisma.user.count({
      where: { role: "PATIENT" },
    });
    const totalDoctors = await prisma.user.count({ where: { role: "DOCTOR" } });

    const pendingVerifications = await prisma.doctorVerification.count({
      where: { status: "PENDING" },
    });

    const totalAppointments = await prisma.appointment.count();

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const todayAppointments = await prisma.appointment.count({
      where: {
        scheduled_at: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    const totalMedicines = await prisma.medicine.count({
      where: { is_active: true },
    });

    return NextResponse.json({
      stats: {
        totalUsers,
        totalPatients,
        totalDoctors,
        pendingVerifications,
        totalAppointments,
        todayAppointments,
        totalMedicines,
      },
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin stats" },
      { status: 500 }
    );
  }
}
