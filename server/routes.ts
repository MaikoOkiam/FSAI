if (process.env.REPLIT_DEPLOYMENT_URL) {
  process.env.NODE_ENV = 'production';
}

console.log('Environment Setup:', {
  NODE_ENV: process.env.NODE_ENV,
  REPL_SLUG: process.env.REPL_SLUG,
  REPL_OWNER: process.env.REPL_OWNER,
  REPLIT_DEPLOYMENT_URL: process.env.REPLIT_DEPLOYMENT_URL
});

import type { Express } from "express";
import { createServer, type Server } from "http";

import { setupAuth } from "./auth";
import { storage } from "./storage";
import { getFashionAdvice, analyzeOutfit } from "./openai";
import { generateStyleTransfer } from "./replicate";
import multer from "multer";
import { z } from "zod";
import { db } from "./db";
import { waitlist, users } from "@shared/schema";
import { sendWaitlistConfirmation, sendPasswordSetupEmail } from "./email";
import mailjet from "./mailjet";
import { desc, eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { stripe, CREDIT_PRICES, isCreditPackage } from "./stripe";

const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Log environment information
  console.log('Current environment:', process.env.NODE_ENV);
  console.log('Deployment URL:', process.env.REPLIT_DEPLOYMENT_URL);

  setupAuth(app);

  // Waitlist signup endpoint
  app.post("/api/waitlist", async (req, res) => {
    try {
      const data = {
        email: req.body.email,
        name: req.body.name, // Use the provided name
        reason: "" // Empty reason
      };
      const [entry] = await db
        .insert(waitlist)
        .values(data)
        .returning();

      // Send confirmation email
      await getFashionAdvice(`Compose a welcome email in German for ${data.name}:
      - Danke für die Registrierung auf der Eva Harper Warteliste
      - Wir prüfen die Anfrage und melden uns bald
      - Der Zugang wird per E-Mail mitgeteilt
      Nutze Emojis und halte es freundlich!`).then(async (emailContent) => {
        console.log("Attempting to send email to:", data.email);
        console.log("Email content:", emailContent);
        await sendWaitlistConfirmation(data.email, emailContent);
      });

      res.status(201).json(entry);
    } catch (error: any) {
      if (error.code === '23505') { // Unique violation
        res.status(400).json({ error: "Diese E-Mail-Adresse ist bereits registriert" });
      } else {
        console.error('Waitlist signup error:', error);
        res.status(400).json({ error: "Registrierung fehlgeschlagen" });
      }
    }
  });

  // Import waitlist to Mailjet list endpoint
  app.post("/api/waitlist/import-to-mailjet", async (req, res) => {
    try {
      // Get all emails from waitlist
      const entries = await db
        .select({
          email: waitlist.email,
          name: waitlist.name
        })
        .from(waitlist);

      if (entries.length === 0) {
        return res.json({ success: true, imported: 0, message: "No entries to import" });
      }

      console.log("Found waitlist entries:", entries.length);

      // Format contacts for Mailjet
      const contacts = entries.map(entry => ({
        Email: entry.email,
        Name: entry.name,
      }));

      // Add contacts to Mailjet list
      const contactManageList = await mailjet.post("contactslist", { version: "v3.1" }).id("10519869").action("managecontacts").request({
        Action: "addnoforce",
        Contacts: contacts
      });

      console.log("Contacts imported to Mailjet:", contactManageList.body);
      res.json({ success: true, imported: contacts.length });
    } catch (error) {
      console.error('Mailjet import error:', error);
      res.status(500).json({ error: "Failed to import contacts to Mailjet" });
    }
  });

  // Fashion advisor chat endpoint
  app.post("/api/fashion/advice", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const user = req.user!;
    if (user.credits < 1) return res.status(402).json({ error: "Insufficient credits" });

    try {
      const advice = await getFashionAdvice(req.body.prompt);
      await storage.updateUserCredits(user.id, user.credits - 1);
      res.json({ advice });
    } catch (error) {
      res.status(500).json({ error: "Failed to get fashion advice" });
    }
  });

  // Style transfer endpoint
  app.post("/api/fashion/transfer", upload.fields([
    { name: 'sourceImage', maxCount: 1 },
    { name: 'targetImage', maxCount: 1 }
  ]), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const user = req.user!;
    if (user.credits < 3) return res.status(402).json({ error: "Insufficient credits" });

    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      const sourceImage = files.sourceImage[0];
      const targetImage = files.targetImage[0];
      const prompt = req.body.prompt;

      if (!sourceImage || !targetImage || !prompt) {
        return res.status(400).json({ error: "Missing required files or prompt" });
      }

      console.log("Processing style transfer request:", {
        sourceImageSize: sourceImage.size,
        targetImageSize: targetImage.size,
        prompt,
      });

      const styleUrl = await generateStyleTransfer(
        sourceImage.buffer.toString("base64"),
        targetImage.buffer.toString("base64"),
        prompt
      );

      await storage.updateUserCredits(user.id, user.credits - 3);

      // Save the generated image
      const savedImage = await storage.saveUserImage(user.id, {
        imageUrl: styleUrl,
        imageType: 'generated',
        title: 'Style Transfer Result'
      });

      res.json({ url: styleUrl, savedImage });
    } catch (error) {
      console.error('Style transfer error:', error);
      res.status(500).json({ error: "Failed to transfer style" });
    }
  });

  // Admin endpoint to approve waitlist members
  app.post("/api/admin/waitlist/approve", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const user = req.user!;
    if (!user.username.includes("admin")) return res.sendStatus(403);

    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: "Email is required" });

      console.log("[Admin Debug] Approving waitlist entry for email:", email);

      // First check if the entry exists and its current status
      const [existingEntry] = await db
        .select()
        .from(waitlist)
        .where(eq(waitlist.email, email))
        .limit(1);

      if (!existingEntry) {
        console.log("[Admin Debug] No entry found for email:", email);
        return res.status(404).json({ message: "Email not found in waitlist" });
      }

      console.log("[Admin Debug] Found existing entry:", existingEntry);

      if (existingEntry.status === "approved") {
        return res.json({
          success: true,
          entry: existingEntry,
          message: "Entry was already approved"
        });
      }

      // Generate a unique token for password setup
      const token = randomBytes(32).toString('hex');
      const tokenExpires = new Date();
      tokenExpires.setHours(tokenExpires.getHours() + 24); // Token valid for 24 hours

      // Create user account with temporary token
      const [newUser] = await db
        .insert(users)
        .values({
          email: existingEntry.email,
          username: existingEntry.email.split('@')[0], // Temporary username from email
          password: token, // Temporary password
          passwordResetToken: token,
          passwordResetExpires: tokenExpires,
          hasAccess: true
        })
        .returning();

      // Update waitlist entry status to approved
      const [updatedEntry] = await db
        .update(waitlist)
        .set({
          status: "approved",
        })
        .where(eq(waitlist.email, email))
        .returning();

      if (!updatedEntry) {
        console.error("[Admin Debug] Failed to update entry status");
        return res.status(500).json({ message: "Failed to update waitlist status" });
      }

      // Send password setup email
      await sendPasswordSetupEmail(email, token);

      console.log("[Admin Debug] Successfully approved entry and created user:", updatedEntry);
      res.json({ success: true, entry: updatedEntry });
    } catch (error) {
      console.error('[Admin Debug] Waitlist approval error:', error);
      res.status(500).json({ message: "Failed to approve waitlist member" });
    }
  });

  // Admin endpoint to list all waitlist entries
  app.get("/api/admin/waitlist", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    // Check if user is an admin
    const user = req.user!;
    if (!user.username.includes("admin")) return res.sendStatus(403);

    try {
      console.log("[Admin Debug] Fetching waitlist entries");
      const entries = await db
        .select()
        .from(waitlist)
        .orderBy(desc(waitlist.createdAt));

      console.log("[Admin Debug] Found entries:", entries.length);
      res.json(entries);
    } catch (error) {
      console.error('Waitlist listing error:', error);
      res.status(500).json({ message: "Failed to list waitlist entries" });
    }
  });

  // New routes for outfit rating system
  app.post("/api/outfits", upload.single("image"), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const user = req.user!;
      if (user.credits < 2) return res.status(402).json({ error: "Insufficient credits" });

      if (!req.file) {
        return res.status(400).json({ error: "No image uploaded" });
      }

      // Upload image and get URL (implementation needed)
      const imageUrl = req.file.buffer.toString("base64");

      const outfit = await storage.createOutfit({
        userId: user.id,
        imageUrl,
        title: req.body.title,
        description: req.body.description,
        occasion: req.body.occasion,
      });

      // Analyze outfit using OpenAI
      const analysis = await analyzeOutfit(imageUrl, {
        occasion: req.body.occasion,
        style: user.preferences.style,
      });

      const rating = await storage.createRating({
        outfitId: outfit.id,
        styleScore: analysis.styleScore,
        fitScore: analysis.fitScore,
        colorScore: analysis.colorScore,
        feedback: analysis.feedback,
        suggestions: analysis.suggestions,
      });

      // Deduct credits
      await storage.updateUserCredits(user.id, user.credits - 2);

      res.status(201).json({ outfit, rating });
    } catch (error) {
      console.error("Error creating outfit rating:", error);
      res.status(500).json({ error: "Failed to create outfit rating" });
    }
  });

  app.get("/api/outfits", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const outfits = await storage.getUserOutfits(req.user!.id);
      res.json(outfits);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch outfits" });
    }
  });

  app.get("/api/outfits/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const outfit = await storage.getOutfit(parseInt(req.params.id));
      if (!outfit) return res.status(404).json({ error: "Outfit not found" });
      if (outfit.userId !== req.user!.id) return res.sendStatus(403);

      const rating = await storage.getOutfitRating(outfit.id);
      res.json({ outfit, rating });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch outfit" });
    }
  });

  app.post("/api/auth/setup-password", async (req, res) => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ message: "Token and password are required" });
      }

      // Find user with valid token
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.passwordResetToken, token))
        .limit(1);

      if (!user) {
        return res.status(404).json({ message: "Invalid or expired token" });
      }

      // Check if token is expired
      if (user.passwordResetExpires && new Date(user.passwordResetExpires) < new Date()) {
        return res.status(400).json({ message: "Token has expired" });
      }

      // Update user's password and clear reset token
      const [updatedUser] = await db
        .update(users)
        .set({
          password: password, // Note: In production, this should be hashed
          passwordResetToken: null,
          passwordResetExpires: null
        })
        .where(eq(users.id, user.id))
        .returning();

      res.json({ success: true, message: "Password set successfully" });
    } catch (error) {
      console.error('Password setup error:', error);
      res.status(500).json({ message: "Failed to set password" });
    }
  });


  // Profile image upload endpoint
  app.post("/api/profile/upload-image", upload.single("image"), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.file) return res.status(400).json({ error: "No image provided" });

    try {
      const imageType = req.body.type; // 'portrait' or 'fullBody'
      const imageUrl = req.file.buffer.toString("base64");

      const savedImage = await storage.saveUserImage(req.user!.id, {
        imageUrl,
        imageType,
        title: `${imageType} Photo`,
      });

      res.json(savedImage);
    } catch (error) {
      console.error("Failed to save profile image:", error);
      res.status(500).json({ error: "Failed to save image" });
    }
  });

  // Save user preferences endpoint
  app.post("/api/profile/preferences", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const { preferences, interests } = req.body;

      // Update user preferences and interests
      const [updatedUser] = await db
        .update(users)
        .set({
          preferences,
          interests,
          hasCompletedOnboarding: true // Added to handle onboarding completion
        })
        .where(eq(users.id, req.user!.id))
        .returning();

      res.json(updatedUser);
    } catch (error) {
      console.error("Failed to save preferences:", error);
      res.status(500).json({ error: "Failed to save preferences" });
    }
  });

  app.post("/api/profile/complete-onboarding", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const [updatedUser] = await db
        .update(users)
        .set({
          hasCompletedOnboarding: true,
        })
        .where(eq(users.id, req.user!.id))
        .returning();

      res.json(updatedUser);
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
      res.status(500).json({ error: "Failed to complete onboarding" });
    }
  });

  app.post("/api/profile/skip-onboarding", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const [updatedUser] = await db
        .update(users)
        .set({
          hasCompletedOnboarding: true,
        })
        .where(eq(users.id, req.user!.id))
        .returning();

      res.json(updatedUser);
    } catch (error) {
      console.error("Failed to skip onboarding:", error);
      res.status(500).json({ error: "Failed to skip onboarding" });
    }
  });

  // Credit purchase endpoints from edited snippet
  app.get("/api/credits/packages", (req, res) => {
    res.json(CREDIT_PRICES);
  });

  // Create a payment intent for purchasing credits
  app.post("/api/credits/create-payment-intent", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const { creditPackage } = req.body;

      if (!isCreditPackage(creditPackage)) {
        return res.status(400).json({ error: "Invalid credit package" });
      }

      const amount = CREDIT_PRICES[creditPackage];
      const credits = parseInt(creditPackage, 10);

      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "eur",
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          userId: req.user!.id.toString(),
          credits: credits.toString(),
        },
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        amount,
        credits,
      });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ error: "Failed to create payment intent" });
    }
  });

  // Handle successful payments and add credits to the user
  app.post("/api/credits/payment-success", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const { paymentIntentId } = req.body;

      // Verify the payment intent
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== "succeeded") {
        return res.status(400).json({ error: "Payment not successful" });
      }

      const userId = parseInt(paymentIntent.metadata.userId, 10);
      const credits = parseInt(paymentIntent.metadata.credits, 10);

      // Ensure the user making the request is the one who made the payment
      if (userId !== req.user!.id) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // Add credits to the user's account
      const [updatedUser] = await db
        .update(users)
        .set({
          credits: req.user!.credits + credits,
        })
        .where(eq(users.id, userId))
        .returning();

      res.json({ success: true, user: updatedUser });
    } catch (error) {
      console.error("Error processing payment success:", error);
      res.status(500).json({ error: "Failed to process payment" });
    }
  });

  // Stripe webhook to handle events
  app.post("/api/webhook/stripe", async (req, res) => {
    const signature = req.headers["stripe-signature"] as string;

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.warn("STRIPE_WEBHOOK_SECRET is not set. Webhook verification is disabled.");
      return res.status(400).send("Webhook secret not configured");
    }

    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      // Handle the event
      if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const userId = parseInt(paymentIntent.metadata.userId, 10);
        const credits = parseInt(paymentIntent.metadata.credits, 10);

        // Update the user's credits
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId));

        if (user) {
          await db
            .update(users)
            .set({
              credits: user.credits + credits,
            })
            .where(eq(users.id, userId));

          console.log(`Added ${credits} credits to user ${userId}`);
        }
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}