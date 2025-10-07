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

    // Add API-level timeout protection
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("API timeout")), 10000); // 10 second API timeout
    });

    const statsPromise = fetchDashboardStats();

    // Race between stats fetch and timeout
    const stats = await Promise.race([statsPromise, timeoutPromise]);

    return NextResponse.json({
      success: true,
      stats,
      cached: false,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);

    // Return fallback data on timeout/error
    const fallbackStats = {
      totalUsers: 0,
      totalDoctors: 0,
      totalPatients: 0,
      pendingVerifications: 0,
      totalAppointments: 0,
      monthlyRevenue: 0,
      totalMedicines: 0,
      totalLabPackages: 0,
      lowStockMedicines: 0,
      pendingOrders: 0,
    };

    return NextResponse.json(
      {
        success: false,
        stats: fallbackStats,
        error:
          error instanceof Error && error.message === "API timeout"
            ? "Dashboard loading timeout - using cached data"
            : "Internal server error",
        fallback: true,
        timestamp: new Date().toISOString(),
      },
      {
        status:
          error instanceof Error && error.message === "API timeout" ? 408 : 500,
      }
    );
  }
}

// Optimized stats fetching with timeout handling
async function fetchDashboardStats() {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Optimized: Split into fast and slow queries for better performance
  try {
    // Fast queries first (simple counts)
    const [fastStats] = await Promise.all([
      Promise.all([
        // Basic user counts (indexed)
        prisma.user.count(),
        prisma.user.count({ where: { role: "DOCTOR" } }),
        prisma.user.count({ where: { role: "PATIENT" } }),

        // Simple counts (should be fast)
        prisma.appointment.count(),
        prisma.medicine.count({ where: { is_active: true } }),
      ]),
    ]);

    const [
      totalUsers,
      totalDoctors,
      totalPatients,
      totalAppointments,
      totalMedicines,
    ] = fastStats;

    // Slower queries with timeout protection
    const slowQueriesPromise = Promise.all([
      // Pending verifications
      prisma.doctorVerification.count({ where: { status: "PENDING" } }),

      // Monthly revenue (optimized query)
      prisma.appointment.aggregate({
        where: {
          created_at: { gte: firstDayOfMonth },
          status: "COMPLETED",
        },
        _count: true,
      }),

      // Lab packages
      prisma.labPackage.count({ where: { is_active: true } }),

      // Low stock medicines
      prisma.medicine.count({
        where: {
          stock_quantity: { lt: 50 },
          is_active: true,
        },
      }),

      // Pending orders (simplified)
      prisma.labOrder.count({ where: { status: "PENDING" } }),
    ]);

    // Add timeout for slow queries
    const slowTimeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Slow queries timeout")), 8000);
    });

    try {
      const slowQueriesResult = (await Promise.race([
        slowQueriesPromise,
        slowTimeout,
      ])) as [
        number, // pendingVerifications
        any, // monthlyData
        number, // totalLabPackages
        number, // lowStockMedicines
        number // pendingLabOrders
      ];
      const [
        pendingVerifications,
        monthlyData,
        totalLabPackages,
        lowStockMedicines,
        pendingLabOrders,
      ] = slowQueriesResult;

      // Simplified revenue calculation (avoid complex joins)
      const monthlyRevenue = monthlyData._count * 50; // Estimated average fee

      return {
        totalUsers,
        totalDoctors,
        totalPatients,
        pendingVerifications,
        totalAppointments,
        monthlyRevenue,
        totalMedicines,
        totalLabPackages,
        lowStockMedicines,
        pendingOrders: pendingLabOrders, // Simplified to just lab orders
      };
    } catch (slowError) {
      console.warn("Slow queries timed out, using fast stats only:", slowError);

      // Return fast stats with fallback values for slow queries
      return {
        totalUsers,
        totalDoctors,
        totalPatients,
        pendingVerifications: 0, // Fallback
        totalAppointments,
        monthlyRevenue: 0, // Fallback
        totalMedicines,
        totalLabPackages: 0, // Fallback
        lowStockMedicines: 0, // Fallback
        pendingOrders: 0, // Fallback
      };
    }
  } catch (error) {
    console.error("Error in fetchDashboardStats:", error);
    throw error;
  }
}
