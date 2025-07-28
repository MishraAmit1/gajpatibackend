import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
console.log("SENDGRID_API_KEY:", process.env.SENDGRID_API_KEY);
console.log("EMAIL_FROM:", process.env.EMAIL_FROM);
import { sendEmail } from "./sendEmail.js";

(async () => {
  try {
    await sendEmail(
      "amitmishra7427@gmail.com",
      "SendGrid Test Email",
      "This is a test email from your backend using SendGrid.",
      "<p>This is a <b>test email</b> from your backend using SendGrid.</p>"
    );
    console.log("Test email sent successfully!");
  } catch (err) {
    console.error("SendGrid test failed:", err.message);
  }
})();
