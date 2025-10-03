import nodemailer from "nodemailer";

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    const emailConfig: EmailConfig = {
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER || "",
        pass: process.env.SMTP_PASS || "",
      },
    };

    this.transporter = nodemailer.createTransport(emailConfig);
  }

  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log(
          "Email service not configured - email would be sent:",
          emailData.subject
        );
        return true; // Return true for development
      }

      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
      });

      return true;
    } catch (error) {
      console.error("Email sending failed:", error);
      return false;
    }
  }

  // Doctor approval notification
  async sendDoctorApprovalNotification(
    doctorEmail: string,
    doctorName: string,
    approved: boolean
  ) {
    const subject = approved
      ? "Doctor Account Approved"
      : "Doctor Account Rejected";
    const status = approved ? "approved" : "rejected";
    const statusColor = approved ? "#10B981" : "#EF4444";

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .status { color: ${statusColor}; font-weight: bold; font-size: 18px; }
            .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Medical Management System</h1>
            </div>
            <div class="content">
              <h2>Dear Dr. ${doctorName},</h2>
              <p>Your doctor account has been <span class="status">${status}</span> by the administrator.</p>
              ${
                approved
                  ? '<p>You can now log in to the system and start managing your schedule and appointments.</p><a href="' +
                    process.env.NEXT_PUBLIC_APP_URL +
                    '/login" class="button">Login to Dashboard</a>'
                  : "<p>Please contact the administrator for more information about the rejection reason.</p>"
              }
              <p>If you have any questions, please contact our support team.</p>
              <p>Best regards,<br>Medical Management Team</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: doctorEmail,
      subject,
      html,
      text: `Dear Dr. ${doctorName}, Your doctor account has been ${status}.`,
    });
  }

  // Medicine review notification
  async sendMedicineReviewNotification(
    adminEmail: string,
    medicineName: string,
    reviewerName: string,
    rating: number
  ) {
    const subject = "New Medicine Review Pending Approval";

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .rating { color: #F59E0B; font-weight: bold; }
            .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Medical Management System</h1>
            </div>
            <div class="content">
              <h2>New Review Pending Approval</h2>
              <p><strong>Medicine:</strong> ${medicineName}</p>
              <p><strong>Reviewer:</strong> ${reviewerName}</p>
              <p><strong>Rating:</strong> <span class="rating">${rating}/5 stars</span></p>
              <p>A new medicine review is waiting for your approval. Please review it in the admin dashboard.</p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/dashboard" class="button">Review in Dashboard</a>
              <p>Best regards,<br>Medical Management System</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: adminEmail,
      subject,
      html,
      text: `New medicine review for ${medicineName} by ${reviewerName} (${rating}/5 stars) pending approval.`,
    });
  }

  // Order status notification
  async sendOrderStatusNotification(
    userEmail: string,
    userName: string,
    orderNumber: string,
    status: string,
    items: any[]
  ) {
    const subject = `Order ${orderNumber} - Status Update`;
    const statusColors: { [key: string]: string } = {
      pending: "#F59E0B",
      confirmed: "#10B981",
      processing: "#3B82F6",
      shipped: "#8B5CF6",
      delivered: "#10B981",
      cancelled: "#EF4444",
    };

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .status { color: ${
              statusColors[status] || "#666"
            }; font-weight: bold; text-transform: uppercase; }
            .order-items { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .item { border-bottom: 1px solid #eee; padding: 10px 0; }
            .item:last-child { border-bottom: none; }
            .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Medical Management System</h1>
            </div>
            <div class="content">
              <h2>Dear ${userName},</h2>
              <p>Your order <strong>#${orderNumber}</strong> status has been updated to: <span class="status">${status}</span></p>
              
              <div class="order-items">
                <h3>Order Items:</h3>
                ${items
                  .map(
                    (item) => `
                  <div class="item">
                    <strong>${item.name}</strong><br>
                    Quantity: ${item.quantity} | Price: $${item.price}
                  </div>
                `
                  )
                  .join("")}
              </div>

              <a href="${
                process.env.NEXT_PUBLIC_APP_URL
              }/orders" class="button">View Order Details</a>
              <p>Thank you for choosing our medical services.</p>
              <p>Best regards,<br>Medical Management Team</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: userEmail,
      subject,
      html,
      text: `Your order #${orderNumber} status has been updated to: ${status}`,
    });
  }

  // Appointment notification
  async sendAppointmentNotification(
    patientEmail: string,
    patientName: string,
    doctorName: string,
    appointmentDate: string,
    appointmentTime: string,
    type: "confirmed" | "cancelled" | "rescheduled"
  ) {
    const subjects = {
      confirmed: "Appointment Confirmed",
      cancelled: "Appointment Cancelled",
      rescheduled: "Appointment Rescheduled",
    };

    const subject = subjects[type];
    const statusColor = type === "cancelled" ? "#EF4444" : "#10B981";

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .appointment-details { background: white; padding: 20px; border-radius: 5px; margin: 15px 0; border-left: 4px solid ${statusColor}; }
            .status { color: ${statusColor}; font-weight: bold; }
            .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Medical Management System</h1>
            </div>
            <div class="content">
              <h2>Dear ${patientName},</h2>
              <p>Your appointment has been <span class="status">${type}</span>.</p>
              
              <div class="appointment-details">
                <h3>Appointment Details:</h3>
                <p><strong>Doctor:</strong> Dr. ${doctorName}</p>
                <p><strong>Date:</strong> ${appointmentDate}</p>
                <p><strong>Time:</strong> ${appointmentTime}</p>
              </div>

              ${
                type !== "cancelled"
                  ? `<p>Please arrive 15 minutes before your scheduled time.</p>
                   <a href="${process.env.NEXT_PUBLIC_APP_URL}/appointments" class="button">View Appointments</a>`
                  : "<p>If you need to reschedule, please contact us.</p>"
              }
              
              <p>If you have any questions, please contact our support team.</p>
              <p>Best regards,<br>Medical Management Team</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: patientEmail,
      subject,
      html,
      text: `Your appointment with Dr. ${doctorName} on ${appointmentDate} at ${appointmentTime} has been ${type}.`,
    });
  }
}

export const emailService = new EmailService();
