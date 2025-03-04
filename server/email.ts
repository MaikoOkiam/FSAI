import Mailjet from "node-mailjet";

if (!process.env.MAILJET_API_KEY || !process.env.MAILJET_API_SECRET) {
  throw new Error("Mailjet API credentials are required");
}

const mailjet = new Mailjet({
  apiKey: process.env.MAILJET_API_KEY,
  apiSecret: process.env.MAILJET_API_SECRET
});

export async function sendWaitlistConfirmation(email: string, content: string) {
  try {
    console.log("Sending email via Mailjet to:", email);
    const result = await mailjet.post("send", { version: "v3.1" }).request({
      Messages: [
        {
          From: {
            Email: "maiko.okiam111@gmail.com",
            Name: "Eva Harper"
          },
          To: [
            {
              Email: email,
              Name: email.split('@')[0]
            }
          ],
          Subject: "Willkommen bei Eva Harper",
          TextPart: content
        }
      ]
    });

    console.log("Email sent successfully:", result.body);
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}