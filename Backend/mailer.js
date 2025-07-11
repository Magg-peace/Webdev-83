// backend/mailer.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'yourgmail@gmail.com',
    pass: 'your-app-password' // Not your real Gmail password. Generate an app password!
  }
});

module.exports = transporter;
// backend/index.js or backend/routes/report.js
const express = require('express');
const transporter = require('./mailer');
const router = express.Router();

router.post('/send-report-email', async (req, res) => {
  const { type, location, severity, needs } = req.body;

  const mailOptions = {
    from: 'yourgmail@gmail.com',
    to: 'admin@relieflink.org',
    subject: `New Disaster Report: ${type}`,
    html: `<p><strong>Location:</strong> ${location}</p>
           <p><strong>Severity:</strong> ${severity}</p>
           <p><strong>Immediate Needs:</strong> ${needs}</p>`
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Email sent successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send email.' });
  }
});

module.exports = router;
