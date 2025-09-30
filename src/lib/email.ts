import nodemailer from "nodemailer";

// Configure the email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  // In development, just log the email instead of sending
  if (
    process.env.NODE_ENV === "development" &&
    (!process.env.SMTP_USER || process.env.SMTP_USER === "your-email@gmail.com")
  ) {
    console.log("\n📧 EMAIL WOULD BE SENT:");
    console.log("To:", options.to);
    console.log("Subject:", options.subject);
    console.log("HTML:", options.html.substring(0, 200) + "...");
    console.log("\n");
    return;
  }

  const mailOptions = {
    from: process.env.FROM_EMAIL,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully to:", options.to);
  } catch (error) {
    console.error("Error sending email:", error);
    // In development, don't throw error for email failures
    if (process.env.NODE_ENV !== "development") {
      throw new Error("Failed to send email");
    }
  }
};

export const sendOTPEmail = async (
  email: string,
  otp: string,
  name?: string
): Promise<void> => {
  const subject = "Your OTP for MediConnect";
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>OTP Verification</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; }
        .otp-code { font-size: 32px; font-weight: bold; color: #3b82f6; text-align: center; padding: 20px; background: white; border-radius: 8px; margin: 20px 0; letter-spacing: 4px; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        .warning { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 15px; border-radius: 8px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>MediConnect</h1>
          <h2>OTP Verification</h2>
        </div>
        <div class="content">
          <p>Hello ${name || "User"},</p>
          <p>Your One-Time Password (OTP) for MediConnect is:</p>
          <div class="otp-code">${otp}</div>
          <p>This OTP is valid for <strong>10 minutes</strong> only. Please use it to complete your verification.</p>
          <div class="warning">
            <strong>Security Notice:</strong> Never share this OTP with anyone. MediConnect will never ask you for this code via phone or email.
          </div>
          <p>If you didn't request this OTP, please ignore this email or contact our support team.</p>
        </div>
        <div class="footer">
          <p>© 2023 MediConnect. All rights reserved.</p>
          <p>This is an automated email, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Hello ${name || "User"},
    
    Your OTP for MediConnect is: ${otp}
    
    This OTP is valid for 10 minutes only.
    
    If you didn't request this OTP, please ignore this email.
    
    © 2023 MediConnect. All rights reserved.
  `;

  await sendEmail({
    to: email,
    subject,
    html,
    text,
  });
};

export const sendWelcomeEmail = async (
  email: string,
  name: string,
  role: string
): Promise<void> => {
  const subject = "Welcome to MediConnect!";
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to MediConnect</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to MediConnect!</h1>
        </div>
        <div class="content">
          <p>Dear ${name},</p>
          <p>Thank you for joining MediConnect as a <strong>${role}</strong>! We're excited to have you on board.</p>
          
          ${
            role === "DOCTOR"
              ? `
            <p>As a doctor on our platform, you can:</p>
            <ul>
              <li>Set your availability and consultation fees</li>
              <li>Conduct video/audio consultations</li>
              <li>Create digital prescriptions</li>
              <li>Manage patient records securely</li>
            </ul>
            <p><strong>Next Steps:</strong> Please complete your profile verification to start accepting patients.</p>
          `
              : `
            <p>As a patient on our platform, you can:</p>
            <ul>
              <li>Search and book doctors by specialty</li>
              <li>Have video/audio consultations</li>
              <li>Receive digital prescriptions</li>
              <li>Order medicines and lab tests</li>
            </ul>
            <p><strong>Next Steps:</strong> Complete your profile and book your first consultation!</p>
          `
          }
          
          <div style="text-align: center;">
            <a href="${process.env.APP_URL}" class="button">Get Started</a>
          </div>
          
          <p>If you have any questions, our support team is here to help.</p>
        </div>
        <div class="footer">
          <p>© 2023 MediConnect. All rights reserved.</p>
          <p>This is an automated email, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject,
    html,
  });
};
