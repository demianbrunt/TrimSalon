"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendAppointmentReminder =
  exports.generateAppointmentReminderEmail =
  exports.getEmailTransporter =
    void 0;
const nodemailer = require("nodemailer");
// Default configuration (to be set via environment variables or Firebase Remote Config)
const getEmailConfig = async () => {
  // In production, retrieve from Firebase Remote Config or environment variables
  // For now, we'll use a placeholder that needs to be configured
  return {
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER || "",
      pass: process.env.EMAIL_PASS || "",
    },
  };
};
// Create transporter
let transporter = null;
const getEmailTransporter = async () => {
  if (!transporter) {
    const config = await getEmailConfig();
    transporter = nodemailer.createTransport(config);
  }
  return transporter;
};
exports.getEmailTransporter = getEmailTransporter;
// Email template for appointment reminder
const generateAppointmentReminderEmail = (appointment) => {
  const dateStr = new Date(appointment.appointmentDate).toLocaleString(
    "nl-NL",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );
  const subject = "Herinnering: Afspraak bij TrimSalon";
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #2196F3;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          background-color: #f9f9f9;
          padding: 20px;
          border-radius: 0 0 5px 5px;
        }
        .appointment-details {
          background-color: white;
          padding: 15px;
          margin: 15px 0;
          border-left: 4px solid #2196F3;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>TrimSalon</h1>
          <p>Trimsalon voor honden</p>
        </div>
        <div class="content">
          <h2>Herinnering: Uw afspraak</h2>
          <p>Beste ${appointment.clientName},</p>
          <p>Dit is een herinnering voor uw aanstaande afspraak bij TrimSalon.</p>
          
          <div class="appointment-details">
            <h3>Afspraak Details</h3>
            <p><strong>Datum en tijd:</strong> ${dateStr}</p>
            <p><strong>Dienst:</strong> ${appointment.serviceName}</p>
            ${appointment.dogName ? `<p><strong>Voor:</strong> ${appointment.dogName}</p>` : ""}
          </div>

          <p>Wij zien u graag tegemoet!</p>
          <p>Als u niet kunt komen, laat het ons dan zo snel mogelijk weten.</p>

          <p>Met vriendelijke groet,<br>TrimSalon</p>
        </div>
        <div class="footer">
          <p>Dit is een automatisch gegenereerde email. U kunt niet direct op deze email antwoorden.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  const text = `
Herinnering: Uw afspraak bij TrimSalon

Beste ${appointment.clientName},

Dit is een herinnering voor uw aanstaande afspraak bij TrimSalon.

Afspraak Details:
- Datum en tijd: ${dateStr}
- Dienst: ${appointment.serviceName}
${appointment.dogName ? `- Voor: ${appointment.dogName}` : ""}

Wij zien u graag tegemoet!
Als u niet kunt komen, laat het ons dan zo snel mogelijk weten.

Met vriendelijke groet,
TrimSalon
  `.trim();
  return { subject, html, text };
};
exports.generateAppointmentReminderEmail = generateAppointmentReminderEmail;
// Send appointment reminder email
const sendAppointmentReminder = async (to, appointment) => {
  const { subject, html, text } = (0, exports.generateAppointmentReminderEmail)(
    appointment,
  );
  const emailTransporter = await (0, exports.getEmailTransporter)();
  const mailOptions = {
    from: process.env.EMAIL_FROM || "noreply@trimsalon.nl",
    to,
    subject,
    text,
    html,
  };
  try {
    await emailTransporter.sendMail(mailOptions);
    console.log(`Appointment reminder email sent to ${to}`);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};
exports.sendAppointmentReminder = sendAppointmentReminder;
//# sourceMappingURL=email.js.map
