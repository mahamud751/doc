import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
  try {
    // Verify admin authorization
    const authResult = await verifyAuthToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "SUPERADMIN"].includes(authResult.user.role)) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    // Get current date for monthly calculations
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch dashboard statistics
    const [
      totalUsers,
      totalDoctors,
      totalPatients,
      pendingVerifications,
      totalAppointments,
      monthlyAppointments,
      totalMedicines,
      totalLabPackages,
      lowStockMedicines,
      pendingOrders,
    ] = await Promise.all([
      // Total users
      prisma.user.count(),

      // Total doctors
      prisma.user.count({
        where: { role: "DOCTOR" },
      }),

      // Total patients
      prisma.user.count({
        where: { role: "PATIENT" },
      }),

      // Pending doctor verifications
      prisma.doctorVerification.count({
        where: { status: "PENDING" },
      }),

      // Total appointments
      prisma.appointment.count(),

      // Monthly appointments for revenue calculation
      prisma.appointment.findMany({
        where: {
          created_at: {
            gte: firstDayOfMonth,
          },
          status: "COMPLETED",
        },
        include: {
          doctor: {
            select: {
              doctor_profile: {
                select: {
                  consultation_fee: true,
                },
              },
            },
          },
        },
      }),

      // Total medicines
      prisma.medicine.count({
        where: { is_active: true },
      }),

      // Total lab packages
      prisma.labPackage.count({
        where: { is_active: true },
      }),

      // Low stock medicines (less than 50)
      prisma.medicine.count({
        where: {
          stock_quantity: { lt: 50 },
          is_active: true,
        },
      }),

      // Pending orders (both lab and pharmacy)
      Promise.all([
        prisma.labOrder.count({
          where: { status: "PENDING" },
        }),
        prisma.pharmacyOrder.count({
          where: { status: "PENDING" },
        }),
      ]).then(([labOrders, pharmacyOrders]) => labOrders + pharmacyOrders),
    ]);

    // Calculate monthly revenue
    const monthlyRevenue = monthlyAppointments.reduce((total, appointment) => {
      const fee = appointment.doctor?.doctor_profile?.consultation_fee || 0;
      return total + Number(fee);
    }, 0);

    const stats = {
      totalUsers,
      totalDoctors,
      totalPatients,
      pendingVerifications,
      totalAppointments,
      monthlyRevenue,
      totalMedicines,
      totalLabPackages,
      lowStockMedicines,
      pendingOrders,
    };

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
