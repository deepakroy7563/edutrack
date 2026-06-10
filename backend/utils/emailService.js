const nodemailer = require('nodemailer');

const smtpConfigured = 
  process.env.SMTP_HOST && 
  process.env.SMTP_PORT && 
  process.env.SMTP_USER && 
  process.env.SMTP_PASS;

let transporter = null;

if (smtpConfigured) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
  console.log('Nodemailer SMTP transporter initialized.');
} else {
  console.warn('SMTP settings are missing. Email service will run in CONSOLE LOG fallback mode.');
}

/**
 * Send an email using configured SMTP transporter, or fall back to logging
 * @param {object} options - { to, subject, html }
 */
const sendMail = async (options) => {
  const fromEmail = process.env.SMTP_FROM || 'attendance@edutrack.com';
  
  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"EduTrack Face Recognition" <${fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html
      });
      console.log(`[Email Sent] Success to: ${options.to} | Subject: ${options.subject}`);
    } catch (error) {
      console.error('[Email Error] Failed to send email to:', options.to, error);
    }
  } else {
    // Console log fallback
    console.log('\n=================== [MOCK EMAIL ALERT] ===================');
    console.log(`To:       ${options.to}`);
    console.log(`From:     ${fromEmail}`);
    console.log(`Subject:  ${options.subject}`);
    console.log('------------------ Content (HTML) ------------------');
    console.log(options.html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
    console.log('========================================================\n');
  }
};

/**
 * Send attendance confirmation to the student
 */
const sendAttendanceConfirmation = async (studentEmail, studentName, dateTime, status) => {
  const statusColors = {
    'Present': '#10b981',
    'Late': '#f59e0b',
    'Absent': '#ef4444'
  };
  const color = statusColors[status] || '#6366f1';

  await sendMail({
    to: studentEmail,
    subject: `[EduTrack] Attendance Notification: ${status}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 20px; border-radius: 10px;">
        <h2 style="color: #4f46e5; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">EduTrack Attendance Check-In</h2>
        <p>Dear <strong>${studentName}</strong>,</p>
        <p>Your attendance has been logged successfully via Face Recognition today.</p>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid ${color}; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Date & Time:</strong> ${new Date(dateTime).toLocaleString()}</p>
          <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: ${color}; font-weight: bold;">${status}</span></p>
        </div>
        <p>If you believe there is an error with this log, please contact your classroom teacher immediately.</p>
        <p style="color: #64748b; font-size: 12px; margin-top: 30px;">This is an automated message from EduTrack School Management & Attendance System.</p>
      </div>
    `
  });
};

/**
 * Send parent alert when child is absent
 */
const sendParentAbsenceAlert = async (parentEmail, parentName, childName, date) => {
  await sendMail({
    to: parentEmail,
    subject: `[ALERT] Absence Notification: ${childName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 20px; border-radius: 10px;">
        <h2 style="color: #ef4444; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">EduTrack Absence Alert</h2>
        <p>Dear Mr./Mrs. <strong>${parentName}</strong>,</p>
        <p>This is to inform you that your child, <strong>${childName}</strong>, has been marked <strong>ABSENT</strong> from school today, <strong>${new Date(date).toLocaleDateString()}</strong>.</p>
        <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 20px 0;">
          <p style="margin: 5px 0; color: #991b1b;"><strong>Status:</strong> ABSENT (Liveness scan did not detect face check-in by cut-off time)</p>
        </div>
        <p>Please provide an excuse note or contact the administrative office to verify this absence.</p>
        <p style="color: #64748b; font-size: 12px; margin-top: 30px;">This is an automated alert from EduTrack School Management & Attendance System.</p>
      </div>
    `
  });
};

/**
 * Send late arrival alert to student/parent
 */
const sendLateArrivalAlert = async (studentEmail, studentName, dateTime) => {
  await sendMail({
    to: studentEmail,
    subject: `[EduTrack] Late Arrival Alert: ${studentName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 20px; border-radius: 10px;">
        <h2 style="color: #f59e0b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">EduTrack Late Arrival Alert</h2>
        <p>Dear <strong>${studentName}</strong>,</p>
        <p>Your check-in at <strong>${new Date(dateTime).toLocaleTimeString()}</strong> was flagged as <strong>LATE</strong> relative to the school cutoff time (08:30 AM).</p>
        <p>Multiple late arrivals may result in administrative review or academic points deduction.</p>
        <p style="color: #64748b; font-size: 12px; margin-top: 30px;">This is an automated alert from EduTrack School Management & Attendance System.</p>
      </div>
    `
  });
};

module.exports = {
  sendAttendanceConfirmation,
  sendParentAbsenceAlert,
  sendLateArrivalAlert
};
