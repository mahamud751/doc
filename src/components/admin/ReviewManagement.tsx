"use client";

import ExportButton, { prepareExportData } from "@/components/ExportButton";
import {
  ResponsiveButton,
  ResponsiveCard,
  ResponsiveGrid,
  ResponsiveInput,
  ResponsiveModal,
} from "@/components/ResponsiveComponents";
import { formatDate } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  Eye,
  MessageSquare,
  Star,
  ThumbsUp,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface Review extends Record<string, unknown> {
  id: string;
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  rating: number;
  comment?: string;
  is_anonymous: boolean;
  is_approved: boolean;
  moderated_by?: string;
  moderated_at?: string;
  created_at: string;
  patient: {
    name: string;
    email: string;
  };
  doctor: {
    name: string;
    specialties: string[];
  };
  appointment: {
    scheduled_at: string;
    status: string;
  };
}

export default function ReviewManagement() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedRating, setSelectedRating] = useState("");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  const [stats, setStats] = useState({
    totalReviews: 0,
    pendingReviews: 0,
    approvedReviews: 0,
    averageRating: 0,
  });

  const calculateStats = useCallback(() => {
    const totalReviews = reviews.length;
    const pendingReviews = reviews.filter(
      (review) => !review.is_approved
    ).length;
    const approvedReviews = reviews.filter(
      (review) => review.is_approved
    ).length;
    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) /
          reviews.length
        : 0;

    setStats({ totalReviews, pendingReviews, approvedReviews, averageRating });
  }, [reviews]);

  useEffect(() => {
    fetchReviews();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [reviews, calculateStats]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/admin/reviews", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      } else {
        setError("Failed to fetch reviews");
      }
    } catch (_error: unknown) {
      setError("Error loading reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReview = async (reviewId: string) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`/api/admin/reviews/${reviewId}/approve`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        await fetchReviews();
      } else {
        setError("Failed to approve review");
      }
    } catch (_error: unknown) {
      setError("Error approving review");
    }
  };

  const handleRejectReview = async (reviewId: string) => {
    if (!confirm("Are you sure you want to reject this review?")) return;

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`/api/admin/reviews/${reviewId}/reject`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchReviews();
      } else {
        setError("Failed to reject review");
      }
    } catch (_error: unknown) {
      setError("Error rejecting review");
    }
  };

  const openDetailsModal = (review: Review) => {
    setSelectedReview(review);
    setShowDetailsModal(true);
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "text-green-600";
    if (rating >= 3) return "text-yellow-600";
    return "text-red-600";
  };

  const filteredReviews = reviews.filter((review) => {
    const matchesSearch =
      review.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.comment?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      !selectedStatus ||
      (selectedStatus === "approved" && review.is_approved) ||
      (selectedStatus === "pending" && !review.is_approved);

    const matchesRating =
      !selectedRating || review.rating.toString() === selectedRating;

    return matchesSearch && matchesStatus && matchesRating;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Review Management
          </h1>
          <p className="text-gray-600 mt-2">
            Moderate patient reviews and feedback for doctors
          </p>
        </div>
      </div>

      {/* Stats */}
      <ResponsiveGrid cols={{ default: 1, sm: 2, lg: 4 }}>
        {[
          {
            label: "Total Reviews",
            value: stats.totalReviews,
            icon: MessageSquare,
            color: "blue",
          },
          {
            label: "Pending Reviews",
            value: stats.pendingReviews,
            icon: AlertTriangle,
            color: "orange",
          },
          {
            label: "Approved Reviews",
            value: stats.approvedReviews,
            icon: ThumbsUp,
            color: "green",
          },
          {
            label: "Average Rating",
            value: stats.averageRating.toFixed(1),
            icon: Star,
            color: "purple",
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <ResponsiveCard>
              <div className="flex items-center">
                <div className={`bg-${stat.color}-100 rounded-lg p-3`}>
                  <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              </div>
            </ResponsiveCard>
          </motion.div>
        ))}
      </ResponsiveGrid>

      {/* Filters */}
      <ResponsiveCard>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <ResponsiveInput
              label="Search reviews"
              placeholder="Search by patient, doctor, or comment..."
              value={searchTerm}
              onChange={setSearchTerm}
            />
          </div>
          <div className="w-full sm:w-40">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
            </select>
          </div>
          <div className="w-full sm:w-32">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Rating
            </label>
            <select
              value={selectedRating}
              onChange={(e) => setSelectedRating(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            >
              <option value="">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
          <div className="flex items-end">
            <ExportButton
              data={prepareExportData(
                filteredReviews,
                [
                  {
                    key: "patient",
                    label: "Patient Name",
                    format: (value) => (value as { name: string }).name,
                  },
                  {
                    key: "doctor",
                    label: "Doctor Name",
                    format: (value) => (value as { name: string }).name,
                  },
                  { key: "rating", label: "Rating" },
                  { key: "comment", label: "Comment" },
                  {
                    key: "is_approved",
                    label: "Approved",
                    format: (value) => (value ? "Yes" : "No"),
                  },
                  {
                    key: "created_at",
                    label: "Review Date",
                    format: (value) => {
                      if (typeof value === "string" || value instanceof Date) {
                        return formatDate(value);
                      }
                      return "";
                    },
                  },
                ],
                "reviews-export"
              )}
            />
          </div>
        </div>
      </ResponsiveCard>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Reviews Grid */}
      <ResponsiveGrid cols={{ default: 1, md: 2, lg: 3 }}>
        {filteredReviews.map((review, index) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -5 }}
          >
            <ResponsiveCard className="h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full w-12 h-12 flex items-center justify-center mr-3">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Dr. {review.doctor.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      by{" "}
                      {review.is_anonymous ? "Anonymous" : review.patient.name}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <div className="flex items-center space-x-1">
                    {getRatingStars(review.rating)}
                    <span
                      className={`ml-1 font-semibold ${getRatingColor(
                        review.rating
                      )}`}
                    >
                      {review.rating}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      review.is_approved
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {review.is_approved ? "Approved" : "Pending"}
                  </span>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                {review.comment && (
                  <p className="text-sm text-gray-700 line-clamp-3">
                    &quot;{review.comment}&quot;
                  </p>
                )}

                <div className="text-sm text-gray-600">
                  <span className="font-medium">Appointment:</span>{" "}
                  {formatDate(review.appointment.scheduled_at)}
                </div>

                <div className="text-sm text-gray-600">
                  <span className="font-medium">Specialty:</span>{" "}
                  {review.doctor.specialties?.[0] || "General"}
                </div>

                <div className="text-sm text-gray-600">
                  <span className="font-medium">Review Date:</span>{" "}
                  {formatDate(review.created_at)}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <ResponsiveButton
                  size="sm"
                  variant="outline"
                  onClick={() => openDetailsModal(review)}
                  fullWidth
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </ResponsiveButton>

                {!review.is_approved && (
                  <div className="grid grid-cols-2 gap-2">
                    <ResponsiveButton
                      size="sm"
                      onClick={() => handleApproveReview(review.id)}
                      className="bg-green-600 text-white hover:bg-green-700"
                      fullWidth
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Approve
                    </ResponsiveButton>
                    <ResponsiveButton
                      size="sm"
                      variant="outline"
                      onClick={() => handleRejectReview(review.id)}
                      className="text-red-600 border-red-600 hover:bg-red-50"
                      fullWidth
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reject
                    </ResponsiveButton>
                  </div>
                )}
              </div>
            </ResponsiveCard>
          </motion.div>
        ))}
      </ResponsiveGrid>

      {/* Review Details Modal */}
      <ResponsiveModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedReview(null);
        }}
        title="Review Details"
        size="lg"
      >
        {selectedReview && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full w-16 h-16 flex items-center justify-center mr-4">
                  <MessageSquare className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Review for Dr. {selectedReview.doctor.name}
                  </h3>
                  <p className="text-gray-600">
                    by{" "}
                    {selectedReview.is_anonymous
                      ? "Anonymous Patient"
                      : selectedReview.patient.name}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-1 mb-2">
                  {getRatingStars(selectedReview.rating)}
                  <span
                    className={`ml-1 text-lg font-bold ${getRatingColor(
                      selectedReview.rating
                    )}`}
                  >
                    {selectedReview.rating}
                  </span>
                </div>
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-full ${
                    selectedReview.is_approved
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {selectedReview.is_approved ? "Approved" : "Pending Approval"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Patient Email
                </label>
                <p className="text-sm text-gray-900">
                  {selectedReview.patient.email}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Doctor Specialty
                </label>
                <p className="text-sm text-gray-900">
                  {selectedReview.doctor.specialties?.[0] || "General Medicine"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Appointment Date
                </label>
                <p className="text-sm text-gray-900">
                  {formatDate(selectedReview.appointment.scheduled_at)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Review Date
                </label>
                <p className="text-sm text-gray-900">
                  {formatDate(selectedReview.created_at)}
                </p>
              </div>
            </div>

            {selectedReview.comment && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Patient Comment
                </label>
                <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-900">
                    &quot;{selectedReview.comment}&quot;
                  </p>
                </div>
              </div>
            )}

            {selectedReview.moderated_by && (
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700">
                  Moderation Info
                </label>
                <p className="text-sm text-gray-600">
                  Approved by {selectedReview.moderated_by} on{" "}
                  {formatDate(selectedReview.moderated_at!)}
                </p>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              {!selectedReview.is_approved && (
                <>
                  <ResponsiveButton
                    onClick={() => {
                      handleApproveReview(selectedReview.id);
                      setShowDetailsModal(false);
                    }}
                    className="bg-green-600 text-white hover:bg-green-700"
                    fullWidth
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Approve Review
                  </ResponsiveButton>
                  <ResponsiveButton
                    onClick={() => {
                      handleRejectReview(selectedReview.id);
                      setShowDetailsModal(false);
                    }}
                    className="bg-red-600 text-white hover:bg-red-700"
                    fullWidth
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reject Review
                  </ResponsiveButton>
                </>
              )}
              <ResponsiveButton
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedReview(null);
                }}
                variant="outline"
                fullWidth
              >
                Close
              </ResponsiveButton>
            </div>
          </div>
        )}
      </ResponsiveModal>
    </motion.div>
  );
}
