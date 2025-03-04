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
import { sendWaitlistConfirmation } from "./email";
import mailjet from "./mailjet";

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

  // Admin endpoint to approve waitlist members
  app.post("/api/admin/waitlist/approve", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Check if user is an admin (you can add an admin field to the user schema later)
    const user = req.user!;
    if (!user.username.includes("admin")) return res.sendStatus(403);
    
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "Email is required" });
      
      // Update waitlist entry status to approved
      const [entry] = await db
        .update(waitlist)
        .set({ status: "approved" })
        .where(waitlist.email.eq(email))
        .returning();
      
      if (!entry) {
        return res.status(404).json({ error: "Email not found in waitlist" });
      }
      
      res.json({ success: true, entry });
    } catch (error) {
      console.error('Waitlist approval error:', error);
      res.status(500).json({ error: "Failed to approve waitlist member" });
    }
  });
  
  // Admin endpoint to list all waitlist entries
  app.get("/api/admin/waitlist", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Check if user is an admin
    const user = req.user!;
    if (!user.username.includes("admin")) return res.sendStatus(403);
    
    try {
      const entries = await db
        .select()
        .from(waitlist)
        .orderBy(waitlist.createdAt.desc());
      
      res.json(entries);
    } catch (error) {
      console.error('Waitlist listing error:', error);
      res.status(500).json({ error: "Failed to list waitlist entries" });
    }
  });

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

  const httpServer = createServer(app);
  return httpServer;
}