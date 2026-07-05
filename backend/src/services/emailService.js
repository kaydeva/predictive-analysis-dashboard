const nodemailer = require("nodemailer");

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SENDGRID_API_KEY) {
    transporter = nodemailer.createTransport({
      host: "smtp.sendgrid.net",
      port: 587,
      auth: {
        user: "apikey",
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  } else {
    console.warn("SendGrid API key not configured. Email alerts disabled.");
    transporter = null;
  }

  return transporter;
}

async function sendAlertEmail(alert) {
  try {
    const t = getTransporter();
    if (!t) return false;

    const mailOptions = {
      from: process.env.ALERT_EMAIL_FROM || "alerts@predictive-maintenance.com",
      to: process.env.ALERT_EMAIL_TO || "",
      subject: `[${alert.severity.toUpperCase()}] Predictive Maintenance Alert - Machine ${alert.machine_id}`,
      html: `
        <h2>Predictive Maintenance Alert</h2>
        <p><strong>Machine ID:</strong> ${alert.machine_id}</p>
        <p><strong>Severity:</strong> ${alert.severity}</p>
        <p><strong>Message:</strong> ${alert.message}</p>
        <p><strong>Time:</strong> ${new Date(alert.timestamp).toLocaleString()}</p>
        <hr />
        <p>This is an automated alert from the Predictive Maintenance System.</p>
      `,
    };

    await t.sendMail(mailOptions);
    console.log(`Alert email sent for machine ${alert.machine_id}`);
    return true;
  } catch (error) {
    console.error("Failed to send alert email:", error.message);
    return false;
  }
}

module.exports = { sendAlertEmail };
