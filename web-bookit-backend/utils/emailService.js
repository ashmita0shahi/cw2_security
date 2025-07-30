const nodemailer = require("nodemailer");

// Configure the transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// General function to send an email
const sendEmail = async ({ to, subject, text }) => {
  try {
    if (!to || typeof to !== "string") {
      throw new Error("No recipient email defined."); // Explicit error
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
    };

    console.log("Sending email with options:", mailOptions); // Debug log
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully to:", to);
  } catch (error) {
    console.error("Error sending email:", error.message);
    throw new Error("Failed to send email.");
  }
};

// Function to send a verification email
const sendVerificationEmail = async (email, code) => {
  try {
    await sendEmail({
      to: email,
      subject: "Verify Your Email Address",
      text: `Your verification code is: ${code}`,
    });
  } catch (error) {
    console.error("Error sending verification email:", error.message);
    throw new Error("Failed to send verification email.");
  }
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
};
