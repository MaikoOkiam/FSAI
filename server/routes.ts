import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { getFashionAdvice, analyzeOutfit } from "./openai";
import { generateStyleTransfer } from "./replicate";
import multer from "multer";
import { z } from "zod";
import { db } from "./db";
import { waitlist } from "@shared/schema";

const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Waitlist signup endpoint
  app.post("/api/waitlist", async (req, res) => {
    try {
      const data = { 
        email: req.body.email,
        name: req.body.email.split('@')[0], // Use part before @ as name
        reason: "" // Empty reason
      };
      const [entry] = await db
        .insert(waitlist)
        .values(data)
        .returning();

      // Send confirmation email
      await getFashionAdvice(`Compose a welcome email for ${data.name}:
      - Thank them for joining Eva Harper's waitlist
      - Let them know we'll review their application shortly
      - Mention they'll receive access information via email
      Include emoji and keep it friendly!`).then(async (emailContent) => {
        console.log("Would send email to", data.email, "with content:", emailContent);
        // Here we would integrate with a real email service
      });

      res.status(201).json(entry);
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        res.status(400).json({ error: "Diese E-Mail-Adresse ist bereits registriert" });
      } else {
        console.error('Waitlist signup error:', error);
        res.status(400).json({ error: "Registrierung fehlgeschlagen" });
      }
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

  // User preferences endpoint
  app.patch("/api/user/preferences", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      await storage.updateUserPreferences(req.user!.id, req.body);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update preferences" });
    }
  });

  // User interests endpoint
  app.patch("/api/user/interests", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      await storage.updateUserInterests(req.user!.id, req.body);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update interests" });
    }
  });

  // Get saved images endpoint
  app.get("/api/images/saved", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const images = await storage.getUserSavedImages(req.user!.id);
      res.json(images);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch saved images" });
    }
  });

  // Save image endpoint
  app.post("/api/images/save", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const savedImage = await storage.saveUserImage(req.user!.id, req.body);
      res.json(savedImage);
    } catch (error) {
      res.status(500).json({ error: "Failed to save image" });
    }
  });

  // Purchase credits endpoint
  app.post("/api/credits/purchase", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const schema = z.object({
      amount: z.number().min(5).max(100)
    });

    try {
      const { amount } = schema.parse(req.body);
      const user = req.user!;
      await storage.updateUserCredits(user.id, user.credits + amount);
      res.json({ credits: user.credits + amount });
    } catch (error) {
      res.status(400).json({ error: "Invalid request" });
    }
  });

  // Purchase subscription endpoint
  app.post("/api/subscription/purchase", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const schema = z.object({
      plan: z.enum(["monthly", "yearly"])
    });

    try {
      const { plan } = schema.parse(req.body);
      const user = req.user!;
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + (plan === "yearly" ? 12 : 1));

      await storage.updateUserSubscription(
        user.id,
        plan,
        endDate.toISOString()
      );
      res.json({ subscription: plan, subscriptionEnds: endDate.toISOString() });
    } catch (error) {
      res.status(400).json({ error: "Invalid request" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}