import { verifyAuthToken } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all"; // all, pending, approved, rejected

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ReviewWhereInput = {};

    if (type !== "all") {
      where.is_approved = type === "approved";
    }

    // For admin endpoints, we'll create a general reviews system
    // Since the current schema only has appointment reviews, let's work with that
    const reviews = await prisma.review.findMany({
      where,
      skip,
      take: limit,
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        appointment: {
          select: {
            id: true,
            scheduled_at: true,
            doctor: {
              select: {
                id: true,
                name: true,
                doctor_profile: {
                  select: {
                    specialties: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    const totalCount = await prisma.review.count({ where });

    // Calculate statistics
    const stats = await prisma.review.groupBy({
      by: ["rating"],
      _count: { rating: true },
      where,
    });

    const ratingStats = stats.reduce((acc, stat) => {
      acc[stat.rating] = stat._count.rating;
      return acc;
    }, {} as Record<number, number>);

    const averageRating = await prisma.review.aggregate({
      where,
      _avg: { rating: true },
    });

    return NextResponse.json({
      success: true,
      reviews,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
      statistics: {
        average_rating: averageRating._avg.rating || 0,
        rating_distribution: ratingStats,
        total_reviews: totalCount,
      },
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { review_id, action, moderation_notes } = body;

    if (!review_id || !action) {
      return NextResponse.json(
        { error: "Review ID and action are required" },
        { status: 400 }
      );
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Action must be either 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    // Update review approval status
    const updatedReview = await prisma.review.update({
      where: { id: review_id },
      data: {
        is_approved: action === "approve",
        moderated_by: authResult.user.id,
        moderated_at: new Date(),
        // We'll store moderation notes in a JSON field or add to schema later
      },
      include: {
        patient: {
          select: { name: true, email: true },
        },
        appointment: {
          select: {
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

    // If approved, update doctor's rating
    if (action === "approve") {
      const doctorId = updatedReview.appointment.doctor.doctor_profile?.id;
      if (doctorId) {
        // Recalculate doctor's average rating
        const approvedReviews = await prisma.review.findMany({
          where: {
            is_approved: true,
            appointment: {
              doctor_id: updatedReview.appointment.doctor.id,
            },
          },
          select: { rating: true },
        });

        const totalRating = approvedReviews.reduce(
          (sum, review) => sum + review.rating,
          0
        );
        const averageRating =
          approvedReviews.length > 0 ? totalRating / approvedReviews.length : 0;

        await prisma.doctorProfile.update({
          where: { id: doctorId },
          data: {
            rating: averageRating,
            total_reviews: approvedReviews.length,
          },
        });
      }
    }

    // Log the moderation action
    await prisma.auditLog.create({
      data: {
        user_id: authResult.user.id,
        action: "MODERATE",
        resource: "Review",
        resource_id: review_id,
        details: {
          action,
          review_rating: updatedReview.rating,
          patient_name: updatedReview.patient.name,
          doctor_name: updatedReview.appointment.doctor.name,
          moderation_notes,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Review ${action}d successfully`,
      review: updatedReview,
    });
  } catch (error) {
    console.error("Error moderating review:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Bulk moderation endpoint
export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const { review_ids, action } = body;

    if (!Array.isArray(review_ids) || review_ids.length === 0) {
      return NextResponse.json(
        { error: "Review IDs array is required" },
        { status: 400 }
      );
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Action must be either 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    const updatedReviews = await prisma.$transaction(async (tx) => {
      // Update all reviews
      const updates = await tx.review.updateMany({
        where: { id: { in: review_ids } },
        data: {
          is_approved: action === "approve",
          moderated_by: authResult.user!.id,
          moderated_at: new Date(),
        },
      });

      // Log bulk moderation
      await tx.auditLog.create({
        data: {
          user_id: authResult.user!.id,
          action: "BULK_MODERATE",
          resource: "Review",
          details: {
            action,
            review_count: review_ids.length,
            review_ids,
          },
        },
      });

      return updates;
    });

    // If approved, we should recalculate doctor ratings
    // This is a simplified version - in production, you'd want to optimize this
    if (action === "approve") {
      const affectedReviews = await prisma.review.findMany({
        where: { id: { in: review_ids } },
        include: {
          appointment: {
            select: {
              doctor_id: true,
              doctor: {
                select: {
                  doctor_profile: {
                    select: { id: true },
                  },
                },
              },
            },
          },
        },
      });

      // Group by doctor and recalculate ratings
      const doctorIds = [
        ...new Set(
          affectedReviews
            .map((r) => r.appointment.doctor.doctor_profile?.id)
            .filter(Boolean)
        ),
      ];

      for (const doctorProfileId of doctorIds) {
        if (doctorProfileId) {
          const doctorReviews = await prisma.review.findMany({
            where: {
              is_approved: true,
              appointment: {
                doctor: {
                  doctor_profile: { id: doctorProfileId },
                },
              },
            },
          });

          const avgRating =
            doctorReviews.reduce((sum, r) => sum + r.rating, 0) /
            doctorReviews.length;

          await prisma.doctorProfile.update({
            where: { id: doctorProfileId },
            data: {
              rating: avgRating,
              total_reviews: doctorReviews.length,
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Bulk ${action} completed for ${updatedReviews.count} reviews`,
      updated_count: updatedReviews.count,
    });
  } catch (error) {
    console.error("Error in bulk review moderation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
