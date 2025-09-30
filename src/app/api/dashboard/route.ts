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
      return getPatientDashboard(decoded.userId);
    } else if (decoded.role === "DOCTOR") {
      return getDoctorDashboard(decoded.userId);
    } else if (["ADMIN", "SUPERADMIN"].includes(decoded.role)) {
      return getAdminDashboard();
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

async function getPatientDashboard(userId: string) {
  try {
    // Get patient profile
    const patient = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        patient_profile: true,
      },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Get recent appointments
    const recentAppointments = await prisma.appointment.findMany({
      where: { patient_id: userId },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { scheduled_at: "desc" },
      take: 5,
    });

    // Get upcoming appointments
    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        patient_id: userId,
        scheduled_at: { gte: new Date() },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { scheduled_at: "asc" },
      take: 3,
    });

    // Get recent prescriptions
    const recentPrescriptions = await prisma.prescription.findMany({
      where: {
        appointment: {
          patient_id: userId,
        },
      },
      include: {
        doctor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        appointment: {
          select: {
            scheduled_at: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
      take: 5,
    });

    // Get health stats
    const totalAppointments = await prisma.appointment.count({
      where: { patient_id: userId },
    });

    const completedAppointments = await prisma.appointment.count({
      where: {
        patient_id: userId,
        status: "COMPLETED",
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
      patient: {
        id: patient.id,
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        avatar_url: patient.avatar_url,
        profile: patient.patient_profile,
      },
      stats: {
        totalAppointments,
        completedAppointments,
        upcomingAppointments: upcomingAppointments.length,
        totalPrescriptions,
      },
      recentAppointments,
      upcomingAppointments,
      recentPrescriptions,
    });
  } catch (error) {
    console.error("Error fetching patient dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch patient dashboard" },
      { status: 500 }
    );
  }
}

async function getDoctorDashboard(userId: string) {
  try {
    // Get doctor profile
    const doctor = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        doctor_profile: {
          include: {
            verification: true,
          },
        },
      },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // Get today's appointments
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const todayAppointments = await prisma.appointment.findMany({
      where: {
        doctor_id: userId,
        scheduled_at: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            phone: true,
            patient_profile: true,
          },
        },
      },
      orderBy: { scheduled_at: "asc" },
    });

    // Get upcoming appointments (next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        doctor_id: userId,
        scheduled_at: {
          gte: endOfDay,
          lte: nextWeek,
        },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
      orderBy: { scheduled_at: "asc" },
      take: 10,
    });

    // Get recent patients
    const recentPatients = await prisma.appointment.findMany({
      where: {
        doctor_id: userId,
        status: "COMPLETED",
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            phone: true,
            patient_profile: true,
          },
        },
      },
      orderBy: { ended_at: "desc" },
      take: 5,
      distinct: ["patient_id"],
    });

    // Get statistics
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

    // Calculate revenue from completed appointments
    const revenueData = await prisma.appointment.findMany({
      where: {
        doctor_id: userId,
        status: "COMPLETED",
        payment_status: "COMPLETED",
      },
      include: {
        doctor: {
          include: {
            doctor_profile: {
              select: {
                consultation_fee: true,
              },
            },
          },
        },
      },
    });

    const totalRevenue = revenueData.reduce((sum, appointment) => {
      const fee = appointment.doctor.doctor_profile?.consultation_fee || 0;
      return sum + Number(fee);
    }, 0);

    return NextResponse.json({
      doctor: {
        id: doctor.id,
        name: doctor.name,
        email: doctor.email,
        phone: doctor.phone,
        avatar_url: doctor.avatar_url,
        profile: doctor.doctor_profile,
        verification_status: doctor.doctor_profile?.verification?.status,
      },
      stats: {
        totalPatients: totalPatients.length,
        totalAppointments,
        completedAppointments,
        todayAppointments: todayAppointments.length,
        upcomingAppointments: upcomingAppointments.length,
        rating: doctor.doctor_profile?.rating || 0,
        totalReviews: doctor.doctor_profile?.total_reviews || 0,
        totalRevenue: totalRevenue,
      },
      todayAppointments,
      upcomingAppointments,
      recentPatients: recentPatients.map((apt) => apt.patient),
    });
  } catch (error) {
    console.error("Error fetching doctor dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch doctor dashboard" },
      { status: 500 }
    );
  }
}

async function getAdminDashboard() {
  try {
    // Get platform statistics
    const totalUsers = await prisma.user.count();
    const totalPatients = await prisma.user.count({
      where: { role: "PATIENT" },
    });
    const totalDoctors = await prisma.user.count({ where: { role: "DOCTOR" } });
    const verifiedDoctors = await prisma.user.count({
      where: {
        role: "DOCTOR",
        doctor_profile: {
          verification: {
            status: "APPROVED",
          },
        },
      },
    });

    const pendingVerifications = await prisma.doctorVerification.count({
      where: { status: "PENDING" },
    });

    const totalAppointments = await prisma.appointment.count();
    const todayAppointments = await prisma.appointment.count({
      where: {
        scheduled_at: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    });

    // Get recent registrations
    const recentUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
        is_verified: true,
      },
      orderBy: { created_at: "desc" },
      take: 10,
    });

    // Get pending doctor verifications
    const pendingDoctorVerifications = await prisma.doctorVerification.findMany(
      {
        where: { status: "PENDING" },
        include: {
          doctor: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
        },
        orderBy: { created_at: "asc" },
        take: 10,
      }
    );

    // Get monthly statistics (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyStats = await prisma.appointment.groupBy({
      by: ["scheduled_at"],
      where: {
        scheduled_at: { gte: sixMonthsAgo },
      },
      _count: true,
    });

    return NextResponse.json({
      stats: {
        totalUsers,
        totalPatients,
        totalDoctors,
        verifiedDoctors,
        pendingVerifications,
        totalAppointments,
        todayAppointments,
      },
      recentUsers,
      pendingDoctorVerifications,
      monthlyStats,
    });
  } catch (error) {
    console.error("Error fetching admin dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin dashboard" },
      { status: 500 }
    );
  }
}
