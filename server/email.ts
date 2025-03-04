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

export async function sendPasswordSetupEmail(email: string, token: string) {
  try {
    // Determine the correct base URL
    let baseUrl = 'https://';
    if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
      // We're on Replit
      baseUrl += `${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
    } else {
      // Fallback to APP_URL or localhost
      baseUrl = process.env.APP_URL || 'http://localhost:5000';
    }

    const setupUrl = `${baseUrl}/auth/setup-password?token=${token}`;

    const content = `
Willkommen bei Eva Harper!

Ihr Konto wurde genehmigt. Bitte klicken Sie auf den folgenden Link, um Ihr Passwort einzurichten:

${setupUrl}

Dieser Link ist 24 Stunden gültig.

Mit freundlichen Grüßen,
Das Eva Harper Team
    `;

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
          Subject: "Richten Sie Ihr Eva Harper Konto ein",
          TextPart: content
        }
      ]
    });

    console.log("Password setup email sent successfully:", result.body);
    return true;
  } catch (error) {
    console.error("Failed to send password setup email:", error);
    return false;
  }
}