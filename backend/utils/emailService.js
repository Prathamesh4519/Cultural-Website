import nodemailer from 'nodemailer';

// Helper to create transport
const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && port && user && pass) {
    return nodemailer.createTransport({
      host,
      port: parseInt(port),
      secure: port === '465', // true for 465, false for other ports
      auth: { user, pass }
    });
  }
  return null;
};

const sendEmailLogFallback = (to, subject, htmlContent) => {
  console.log('\n' + '='.repeat(60));
  console.log(`✉️  [MOCK EMAIL SENT]`);
  console.log(`To:      ${to}`);
  console.log(`Subject: ${subject}`);
  console.log('-'.repeat(60));
  // Strip HTML tags for cleaner console reading
  const cleanBody = htmlContent.replace(/<[^>]*>/g, '\n').replace(/\n+/g, '\n').trim();
  console.log(cleanBody);
  console.log('='.repeat(60) + '\n');
};

export const sendEmail = async ({ to, subject, html }) => {
  const transporter = getTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || '"CultureSpace" <noreply@culturespace.edu>',
        to,
        subject,
        html
      });
      return true;
    } catch (error) {
      console.error('Nodemailer Error: ', error);
      sendEmailLogFallback(to, subject, html);
      return false;
    }
  } else {
    sendEmailLogFallback(to, subject, html);
    return true;
  }
};

// 1. Send OTP for College Email Verification
export const sendVerificationOtp = async (email, otp) => {
  const subject = 'Verify your College Email - CultureSpace';
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="color: #0f172a;">CultureSpace OTP Verification</h2>
      <p>Hello,</p>
      <p>Thank you for registering at CultureSpace, the college Cultural Room booking portal. Use the OTP below to verify your email address:</p>
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #f97316; margin: 20px 0; text-align: center; padding: 10px; background-color: #f8fafc; border-radius: 4px;">
        ${otp}
      </div>
      <p style="font-size: 14px; color: #64748b;">This OTP is valid for 10 minutes. If you did not request this, please ignore this email.</p>
    </div>
  `;
  return await sendEmail({ to: email, subject, html });
};

// 2. Email to Room Owner / Admin (Request Notification)
export const sendBookingRequestEmail = async (adminEmail, booking, roomName) => {
  const subject = 'New Cultural Room Booking Request';
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="color: #0f172a; border-bottom: 2px solid #ea580c; padding-bottom: 10px;">New Cultural Room Booking Request</h2>
      <p>New booking request received for ${roomName}.</p>
      
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
        <tr>
          <td style="padding: 6px; font-weight: bold; width: 140px;">Student Name:</td>
          <td style="padding: 6px;">${booking.studentName}</td>
        </tr>
        <tr>
          <td style="padding: 6px; font-weight: bold;">Roll Number:</td>
          <td style="padding: 6px;">${booking.rollNumber}</td>
        </tr>
        <tr>
          <td style="padding: 6px; font-weight: bold;">Club:</td>
          <td style="padding: 6px;">${booking.clubName || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 6px; font-weight: bold;">Purpose:</td>
          <td style="padding: 6px;">${booking.purpose}</td>
        </tr>
        <tr>
          <td style="padding: 6px; font-weight: bold;">Room:</td>
          <td style="padding: 6px;">${roomName}</td>
        </tr>
        <tr>
          <td style="padding: 6px; font-weight: bold;">Date:</td>
          <td style="padding: 6px;">${new Date(booking.date).toLocaleDateString()}</td>
        </tr>
        <tr>
          <td style="padding: 6px; font-weight: bold;">Time:</td>
          <td style="padding: 6px;">${booking.startTime} - ${booking.endTime}</td>
        </tr>
      </table>
      
      <p style="margin-top: 20px;">Please review this request from the admin dashboard.</p>
    </div>
  `;
  return await sendEmail({ to: adminEmail, subject, html });
};

// 3. Email to Student (Approval Notification)
export const sendBookingApprovalEmail = async (booking, roomName) => {
  const subject = 'Your Booking Has Been Approved';
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="color: #15803d; border-bottom: 2px solid #16a34a; padding-bottom: 10px;">Booking Approved!</h2>
      <p>Hello ${booking.studentName},</p>
      <p>Your booking has been approved. Below are the details:</p>
      
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
        <tr>
          <td style="padding: 6px; font-weight: bold; width: 100px;">Room:</td>
          <td style="padding: 6px;">${roomName}</td>
        </tr>
        <tr>
          <td style="padding: 6px; font-weight: bold;">Date:</td>
          <td style="padding: 6px;">${new Date(booking.date).toLocaleDateString()}</td>
        </tr>
        <tr>
          <td style="padding: 6px; font-weight: bold;">Time:</td>
          <td style="padding: 6px;">${booking.startTime} - ${booking.endTime}</td>
        </tr>
        <tr>
          <td style="padding: 6px; font-weight: bold;">Purpose:</td>
          <td style="padding: 6px;">${booking.purpose}</td>
        </tr>
      </table>

      ${booking.qrCode ? `
        <div style="text-align: center; margin: 20px 0;">
          <p style="font-weight: bold;">Check-In QR Code:</p>
          <img src="${booking.qrCode}" alt="Booking QR Code" style="border: 1px solid #ccc; padding: 8px; width: 180px; height: 180px;" />
          <p style="font-size: 12px; color: #64748b;">Show this QR Code to the room administrator when you arrive.</p>
        </div>
      ` : ''}
      
      <p style="margin-top: 20px;">Please arrive on time and follow the room guidelines.</p>
      <p>Thank you.</p>
    </div>
  `;
  return await sendEmail({ to: booking.email, subject, html });
};

// 4. Email to Student (Rejection Notification)
export const sendBookingRejectionEmail = async (booking, roomName, reason) => {
  const subject = 'Booking Request Rejected';
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="color: #b91c1c; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">Booking Request Rejected</h2>
      <p>Hello ${booking.studentName},</p>
      <p>Unfortunately, your booking request has been rejected.</p>
      
      <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 12px; margin: 15px 0; border-radius: 4px;">
        <strong>Reason:</strong> ${reason || 'Not specified by administrator.'}
      </div>
      
      <p>Please contact the room administrator if required.</p>
      <p>Thank you.</p>
    </div>
  `;
  return await sendEmail({ to: booking.email, subject, html });
};

// 5. Booking Reminder Email (24 Hours Before)
export const sendBookingReminderEmail = async (booking, roomName) => {
  const subject = `Reminder: Upcoming Booking for ${roomName}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="color: #0f172a; border-bottom: 2px solid #f97316; padding-bottom: 10px;">Upcoming Booking Reminder</h2>
      <p>Hello ${booking.studentName},</p>
      <p>This is a reminder that you have a booking scheduled in 24 hours.</p>
      
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 20px;">
        <tr>
          <td style="padding: 6px; font-weight: bold; width: 100px;">Room:</td>
          <td style="padding: 6px;">${roomName}</td>
        </tr>
        <tr>
          <td style="padding: 6px; font-weight: bold;">Date:</td>
          <td style="padding: 6px;">${new Date(booking.date).toLocaleDateString()}</td>
        </tr>
        <tr>
          <td style="padding: 6px; font-weight: bold;">Time:</td>
          <td style="padding: 6px;">${booking.startTime} - ${booking.endTime}</td>
        </tr>
      </table>
      
      <h3 style="color: #ea580c;">Rules & Guidelines</h3>
      <ul style="padding-left: 20px; line-height: 1.6;">
        <li>Please clean the room before leaving.</li>
        <li>Switch off all lights, ACs, and electrical equipment after use.</li>
        <li>Ensure you do not exceed your allocated time slot.</li>
        <li>Report any damaged equipment immediately via the feedback form.</li>
      </ul>
      
      <p style="margin-top: 20px;">Enjoy your session! Thank you.</p>
    </div>
  `;
  return await sendEmail({ to: booking.email, subject, html });
};
