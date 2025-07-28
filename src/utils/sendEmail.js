import sgMail from "@sendgrid/mail";
import { throwApiError } from "./apiError.js";
import dotenv from "dotenv";
dotenv.config();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendEmail = async (to, subject, text, html) => {
  try {
    const msg = {
      to,
      from: process.env.EMAIL_FROM,
      subject,
      text,
      html,
    };
    const info = await sgMail.send(msg);
    console.log(`Email sent successfully to ${to}`);
    return info;
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error.message);
    throw throwApiError(500, "Failed to send email");
  }
};

// import nodemailer from "nodemailer";
// import { throwApiError } from "./apiError.js";

// export const sendMail = async (to, subject, text, html) => {
//   try {
//     const transporter = nodemailer.createTransport({
//       service: "Gmail",
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//       },
//     });

//     const mailOptions = {
//       from: `"Admin Dashboard" <${process.env.EMAIL_USER}>`,
//       to,
//       subject,
//       text,
//       html,
//     };
//     const info = await transporter.sendMail(mailOptions);

//     console.log(`Email sent successfully to ${to}: ${info.messageId}`);
//     return info;
//   } catch (error) {
//     console.error(`Error sending email to ${to}:`, error.message);
//     throw throwApiError(500, "Failed to send email");
//   }
// };
